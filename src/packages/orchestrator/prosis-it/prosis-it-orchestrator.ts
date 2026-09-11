/**
 * @prosis/orchestrator - ProsisIt AI Orchestrator
 * Central intelligence and orchestration coordinator for the Prosis enterprise ecosystem.
 * Implements the real cognitive loop:
 * User Directive -> Model Reasoning -> Dynamic Plan/Tool Selection -> Server Tool Gateway -> Telemetry Reflection -> Model Final Synthesis
 */

import {
  ProsisOrchestrationState,
  ProsisContext,
  ProsisPlan,
  PlanStep,
  PendingApproval,
  OrchestrationResult,
  ProsisAIRequest,
  ProsisAIResponse,
  ProsisAIToolDescriptor,
  ConversationTurn,
} from "./prosis-it-types";
import { CapabilityRegistry } from "./capability-registry";
import { IProsisReasoningEngine, ProsisReasoningEngine } from "./reasoning-engine";
import { ToolExecutionService } from "../tool-execution-service";
import { ToolRegistry } from "../../tools";
import { TrustedExecutionContext } from "../tool-gateway-types";
import "../repository-tools";

export class ProsisItOrchestrator {
  private reasoningEngine: IProsisReasoningEngine;
  private activePlans: Map<string, ProsisPlan> = new Map();
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  public static readonly MAX_ORCHESTRATION_STEPS = 5;

  constructor(reasoningEngine?: IProsisReasoningEngine) {
    this.reasoningEngine = reasoningEngine || ProsisReasoningEngine.getEngine();
  }

  /**
   * Sets or updates the active reasoning engine implementation (e.g. for testing or provider switching).
   */
  public setReasoningEngine(engine: IProsisReasoningEngine): void {
    this.reasoningEngine = engine;
  }

  /**
   * Retrieves the current active reasoning engine.
   */
  public getReasoningEngine(): IProsisReasoningEngine {
    return this.reasoningEngine;
  }

  /**
   * Main entry point: Executes the real LLM cognitive loop with deterministic server boundaries.
   */
  public async orchestrate(
    input: string,
    context: ProsisContext
  ): Promise<OrchestrationResult> {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return {
        state: "IDLE",
        response: "Prosis operating system ready. Awaiting directive.",
      };
    }

    // 1. Check interruption status upfront
    if (context.interruptionEpoch !== undefined) {
      const activeEpoch = ToolExecutionService.getSessionEpoch(context.sessionId);
      if (context.interruptionEpoch < activeEpoch) {
        return {
          state: "INTERRUPTED",
          response: "Operation cancelled due to user interruption.",
          error: "STALE_REQUEST",
        };
      }
    }

    // Initialize conversation history if needed
    if (!context.conversationHistory) {
      context.conversationHistory = [];
    }
    context.conversationHistory.push({
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    });

    // Build trusted server-side execution context (The model is NEVER authoritative for identity)
    const trustedContext: TrustedExecutionContext = {
      userId: context.user.id,
      organizationId: context.organization.tenantId || context.organization.id,
      role: context.user.role,
      permissions: context.user.permissions,
      sessionId: context.sessionId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      autonomyLevel: context.autonomyLevel ?? 1,
    };

    // Prepare tools and capabilities descriptors for the LLM
    const availableCapabilities = CapabilityRegistry.getAll();
    const availableTools: ProsisAIToolDescriptor[] = ToolRegistry.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: (t.inputSchema as any)?._def ? { type: "object" } : {},
      requiresApproval: t.requiresApproval,
    }));

    // If getVenueAnalytics is not explicitly in ToolRegistry under that name, add its descriptor
    if (!availableTools.some((t) => t.name === "getVenueAnalytics")) {
      availableTools.push({
        name: "getVenueAnalytics",
        description: "Retrieve real-time booking trajectories, cover pacing, capacity, and revenue deltas across properties.",
        parameters: { timeframe: "string", venueId: "string" },
        requiresApproval: false,
      });
    }

    const previousResults: Record<string, any> = {};
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const steps: PlanStep[] = [];
    let loopCount = 0;

    let plan: ProsisPlan = {
      id: planId,
      userIntent: trimmedInput,
      classification: "information_request",
      targetCapabilities: [],
      steps,
      currentStepIndex: 0,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.activePlans.set(planId, plan);

    // ─────────────────────────────────────────────────────────────────────────
    // DYNAMIC COGNITIVE LOOP: LLM -> Decision -> Server Gateway -> Reflection
    // ─────────────────────────────────────────────────────────────────────────
    while (loopCount < ProsisItOrchestrator.MAX_ORCHESTRATION_STEPS) {
      loopCount++;

      // Check interruption epoch before model turn
      if (context.interruptionEpoch !== undefined) {
        const activeEpoch = ToolExecutionService.getSessionEpoch(context.sessionId);
        if (context.interruptionEpoch < activeEpoch) {
          plan.status = "interrupted";
          return {
            state: "INTERRUPTED",
            plan,
            response: "Execution halted. Interrupted by subsequent user utterance.",
            error: "STALE_REQUEST",
          };
        }
      }

      // 1. Build AI Request payload
      const aiRequest: ProsisAIRequest = {
        userMessage: trimmedInput,
        conversationContext: context.conversationHistory,
        prosisContext: {
          user: context.user,
          organization: context.organization,
          activeProduct: context.activeProduct,
          activeVenue: context.activeVenue,
          autonomyLevel: context.autonomyLevel,
        },
        availableCapabilities,
        availableTools,
        currentPlan: plan,
        previousResults,
      };

      // 2. Query Real LLM Reasoning Engine
      let aiDecision: ProsisAIResponse;
      try {
        aiDecision = await this.reasoningEngine.reason(aiRequest);
      } catch (err: any) {
        plan.status = "failed";
        return {
          state: "FAILED",
          plan,
          response: `Reasoning engine error: ${err.message || "Failed to parse model intelligence."}`,
          error: "REASONING_ERROR",
        };
      }

      // Synchronize plan metadata with model's semantic understanding
      if (plan.classification !== "multi_step_task" || aiDecision.understanding.classification === "multi_step_task") {
        plan.classification = aiDecision.understanding.classification;
      }
      plan.targetCapabilities = Array.from(
        new Set([...plan.targetCapabilities, ...aiDecision.understanding.targetCapabilities])
      );
      plan.explanation = aiDecision.reasoningSummary;

      // 3. ACTION: Clarification Needed
      if (aiDecision.nextAction === "clarification" || aiDecision.needsMoreInformation) {
        const clarificationMsg =
          aiDecision.clarificationPrompt || "Additional parameters are required to proceed with this directive.";
        context.conversationHistory.push({
          role: "assistant",
          content: clarificationMsg,
          timestamp: new Date().toISOString(),
        });
        return {
          state: "WAITING_FOR_INFORMATION",
          plan,
          response: clarificationMsg,
          reasoningSummary: aiDecision.reasoningSummary,
          requiresClarification: true,
        };
      }

      // 4. ACTION: Human Approval Required (Autonomy Level 1 Policy Enforcement)
      const isDestructive =
        aiDecision.understanding.isDestructive ||
        aiDecision.understanding.classification === "destructive_action" ||
        Boolean(aiDecision.requiresApproval);

      if (
        aiDecision.nextAction === "approval_required" ||
        (isDestructive && context.autonomyLevel < 2)
      ) {
        const stepId = `step_${planId}_${steps.length + 1}`;
        const step: PlanStep = {
          id: stepId,
          goal: aiDecision.goal || "Execute high-impact operation",
          capabilityId: aiDecision.selectedCapability || "operations",
          toolName: aiDecision.selectedTool || "destructive_action",
          arguments: aiDecision.toolArguments || {},
          status: "waiting_approval",
          isDestructive: true,
          requiresApproval: true,
        };
        steps.push(step);
        plan.status = "waiting_approval";

        const approval: PendingApproval = {
          id: `appr_${stepId}`,
          planId: plan.id,
          stepId,
          actionSummary: step.goal,
          toolName: step.toolName,
          arguments: step.arguments,
          impact: "high",
          isDestructive: true,
          timestamp: new Date().toISOString(),
          status: "pending",
        };

        this.pendingApprovals.set(approval.id, approval);
        context.pendingApprovals.push(approval);

        const approvalPrompt = `Approval required: ${step.goal}. This operation has high operational impact. Awaiting confirmation.`;
        context.conversationHistory.push({
          role: "assistant",
          content: approvalPrompt,
          timestamp: new Date().toISOString(),
        });

        return {
          state: "WAITING_FOR_APPROVAL",
          plan,
          activeStep: step,
          pendingApproval: approval,
          response: approvalPrompt,
          reasoningSummary: aiDecision.reasoningSummary,
        };
      }

      // 5. ACTION: Final Direct Response Synthesized by Model
      if (aiDecision.nextAction === "response" || !aiDecision.selectedTool) {
        plan.status = "completed";
        const finalMsg =
          aiDecision.finalResponse ||
          aiDecision.goal ||
          "Directive completed successfully.";

        context.conversationHistory.push({
          role: "assistant",
          content: finalMsg,
          timestamp: new Date().toISOString(),
        });

        return {
          state: "COMPLETED",
          plan: steps.length > 0 ? plan : undefined,
          response: finalMsg,
          toolResults: previousResults,
          reasoningSummary: aiDecision.reasoningSummary,
        };
      }

      // 6. ACTION: Tool Request Dispatch Through Server Gateway
      const stepId = `step_${planId}_${steps.length + 1}`;
      const step: PlanStep = {
        id: stepId,
        goal: aiDecision.goal,
        capabilityId: aiDecision.selectedCapability || "analytics",
        toolName: aiDecision.selectedTool,
        arguments: aiDecision.toolArguments || {},
        status: "executing",
        isDestructive: false,
        requiresApproval: false,
      };
      steps.push(step);
      plan.currentStepIndex = steps.length - 1;

      // Handle roadmap future capabilities gracefully
      const cap = CapabilityRegistry.get(step.capabilityId);
      if (cap && cap.status === "future") {
        step.status = "completed";
        step.result = {
          status: "planned",
          message: `${cap.name} is on the Prosis roadmap (${cap.futureRoadmapNotes || "In development"}).`,
        };
        previousResults[stepId] = step.result;
        continue;
      }

      const execStartTime = Date.now();
      const execResult = await ToolExecutionService.execute(
        {
          requestId: `req_${Date.now()}_${steps.length}`,
          sessionId: context.sessionId,
          conversationId: context.conversationId,
          toolName: step.toolName,
          arguments: step.arguments,
          interruptionEpoch: context.interruptionEpoch,
        },
        trustedContext
      );

      step.executionDurationMs = Date.now() - execStartTime;

      // Telemetry / Error Evaluation
      if (!execResult.success) {
        step.status = "failed";
        step.error = execResult.error?.message;
        plan.status = "failed";

        const errorCode = execResult.error?.code;
        let responseMsg = `Execution halted at step '${step.goal}': ${execResult.error?.message || "Internal gateway error"}.`;

        if (errorCode === "AUTHORIZATION_DENIED") {
          responseMsg = `Access restricted. User role '${context.user.role}' lacks required permissions to execute ${step.toolName}.`;
        } else if (errorCode === "RESOURCE_FORBIDDEN") {
          responseMsg = `Venue boundary violation. You do not have authorization to access '${step.arguments.venueId || step.arguments.restaurantId}'.`;
        } else if (errorCode === "STALE_REQUEST") {
          plan.status = "interrupted";
          return {
            state: "INTERRUPTED",
            plan,
            activeStep: step,
            response: "Request superseded by a newer voice command.",
            error: "STALE_REQUEST",
          };
        }

        context.conversationHistory.push({
          role: "assistant",
          content: responseMsg,
          timestamp: new Date().toISOString(),
        });

        return {
          state: "FAILED",
          plan,
          activeStep: step,
          response: responseMsg,
          error: errorCode || "TOOL_EXECUTION_FAILED",
          reasoningSummary: aiDecision.reasoningSummary,
        };
      }

      // Step Succeeded: Record Telemetry and loop back to Model for Reflection
      step.status = "completed";
      step.result = execResult.data;
      previousResults[stepId] = execResult.data;
      context.previousToolResults[stepId] = execResult.data;
    }

    // Fallback if max loop iterations reached
    plan.status = "completed";
    return {
      state: "COMPLETED",
      plan,
      response: "Operation completed. All requested parameters processed.",
      toolResults: previousResults,
    };
  }

  /**
   * Resumes a plan after explicit human approval (Level 1 Autonomy).
   */
  public async approvePendingAction(
    approvalId: string,
    context: ProsisContext
  ): Promise<OrchestrationResult> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return {
        state: "FAILED",
        response: `Approval request '${approvalId}' not found or already processed.`,
        error: "NOT_FOUND",
      };
    }

    approval.status = "approved";
    this.pendingApprovals.delete(approvalId);

    const plan = this.activePlans.get(approval.planId);
    if (!plan) {
      return {
        state: "FAILED",
        response: "Associated plan no longer active.",
        error: "PLAN_NOT_FOUND",
      };
    }

    const step = plan.steps.find((s) => s.id === approval.stepId);
    if (step) {
      step.requiresApproval = false;
      step.status = "pending";
    }

    // Dispatch approved action through server gateway
    const trustedContext: TrustedExecutionContext = {
      userId: context.user.id,
      organizationId: context.organization.tenantId || context.organization.id,
      role: context.user.role,
      permissions: context.user.permissions,
      sessionId: context.sessionId,
      requestId: `req_appr_${Date.now()}`,
      autonomyLevel: context.autonomyLevel ?? 1,
    };

    if (step) {
      step.status = "executing";
      const execResult = await ToolExecutionService.execute(
        {
          requestId: `req_appr_exec_${Date.now()}`,
          sessionId: context.sessionId,
          conversationId: context.conversationId,
          toolName: step.toolName,
          arguments: step.arguments,
          interruptionEpoch: context.interruptionEpoch,
        },
        trustedContext
      );

      if (execResult.success) {
        step.status = "completed";
        step.result = execResult.data;
        plan.status = "completed";
        return {
          state: "COMPLETED",
          plan,
          response: `Approved action '${step.goal}' executed successfully.`,
          toolResults: { [step.id]: execResult.data },
        };
      } else {
        step.status = "failed";
        step.error = execResult.error?.message;
        plan.status = "failed";
        return {
          state: "FAILED",
          plan,
          response: `Approved action failed: ${execResult.error?.message || "Execution error"}`,
          error: execResult.error?.code || "EXECUTION_FAILED",
        };
      }
    }

    return {
      state: "COMPLETED",
      plan,
      response: "Approved action completed.",
    };
  }

  /**
   * Rejects a pending approval action.
   */
  public rejectPendingAction(
    approvalId: string,
    reason = "Operation cancelled by user."
  ): OrchestrationResult {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      approval.status = "rejected";
      this.pendingApprovals.delete(approvalId);
    }

    return {
      state: "COMPLETED",
      response: `Action rejected: ${reason}`,
    };
  }
}
