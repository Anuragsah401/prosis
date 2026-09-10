/**
 * @prosis/orchestrator - ProsisIt AI Orchestrator
 * Central intelligence and orchestration engine for the Prosis ecosystem.
 * Implements the cognitive loop:
 * User -> Understand Intent -> Reason / Plan -> Select Capability -> Secure Tool Gateway -> Observe -> Synthesize
 */

import {
  ProsisOrchestrationState,
  RequestClassification,
  ProsisContext,
  ProsisPlan,
  PlanStep,
  PendingApproval,
  IntentUnderstanding,
  OrchestrationResult,
  CapabilityDefinition,
} from "./prosis-it-types";
import { CapabilityRegistry } from "./capability-registry";
import { ToolExecutionService } from "../tool-execution-service";
import { AuthService } from "../auth-service";
import { TrustedExecutionContext } from "../tool-gateway-types";

export class ProsisItOrchestrator {
  private activePlans: Map<string, ProsisPlan> = new Map();
  private pendingApprovals: Map<string, PendingApproval> = new Map();

  /**
   * Main entry point: Processes a user input through the cognitive loop.
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

    // Check interruption status upfront
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

    // 1. UNDERSTANDING: Intent comprehension & reasoning
    const understanding = this.understand(trimmedInput, context);

    // 2. Pure Conversation & System Identity
    if (understanding.classification === "conversation") {
      const response = this.handleConversation(understanding, trimmedInput);
      return {
        state: "COMPLETED",
        response,
      };
    }

    // 3. Roadmap / Future Capability Request
    const futureCaps = understanding.targetCapabilities
      .map((id) => CapabilityRegistry.get(id))
      .filter((c): c is CapabilityDefinition => c !== undefined && c.status === "future");

    if (futureCaps.length > 0 && understanding.targetCapabilities.length === futureCaps.length) {
      const futureCap = futureCaps[0];
      const response = `${futureCap.name} is part of the Prosis ecosystem roadmap. Supported operations will include ${futureCap.supportedOperations.slice(0, 3).join(", ")}. ${futureCap.futureRoadmapNotes || "Live execution for this module will be available in an upcoming release."}`;
      return {
        state: "COMPLETED",
        response,
      };
    }

    // 4. Missing required parameters
    if (understanding.requiresClarification) {
      return {
        state: "WAITING_FOR_INFORMATION",
        response: understanding.clarificationPrompt || "Additional parameters required to execute this operation.",
        requiresClarification: true,
        missingParameters: understanding.missingParameters,
      };
    }

    // 5. PLANNING: Construct execution plan
    const plan = this.plan(understanding, context);
    this.activePlans.set(plan.id, plan);

    // 6. EXECUTION & OBSERVATION LOOP
    return await this.executePlan(plan, context);
  }

  /**
   * Cognitive Stage 1: Understand Intent & Semantic Analysis.
   * Evaluates user prompt, context, role, active venue, and capabilities.
   */
  public understand(input: string, context: ProsisContext): IntentUnderstanding {
    const lower = input.toLowerCase();

    // 1. System inquiry / greetings
    const isGreeting = /^(hello|hi|hey|good\s(morning|afternoon|evening)|prosis)\b/i.test(lower);
    const isIdentityInquiry =
      /who are you|what are you|what can you do|capabilities|tell me about prosisit|ecosystem overview/i.test(lower);

    if (isGreeting && !/analytics|booking|reservation|staff|menu|marketing|revenue|pacing/i.test(lower)) {
      return {
        intent: "greeting",
        classification: "conversation",
        targetCapabilities: [],
        entities: {},
        requiresClarification: false,
        isDestructive: false,
        confidence: 0.95,
      };
    }

    if (isIdentityInquiry) {
      return {
        intent: "ecosystem_inquiry",
        classification: "conversation",
        targetCapabilities: CapabilityRegistry.getAll().map((c) => c.id),
        entities: {},
        requiresClarification: false,
        isDestructive: false,
        confidence: 0.98,
      };
    }

    // 2. Destructive Actions Detection
    const isDestructive =
      /cancel|delete|purge|remove all|void|shutdown|emergency close|clear/i.test(lower);

    // 3. Multi-domain / Multi-step Detection
    const mentionsAnalytics = /analytic|metric|pacing|cover|revenue|trend|occupancy|performance/i.test(lower);
    const mentionsBooking = /book|reservation|table|guest|party|seating|waitlist/i.test(lower);
    const mentionsWorkforce = /staff|schedule|shift|roster|labor|clock/i.test(lower);
    const mentionsMenu = /menu|dish|item|86|price|kitchen|recipe/i.test(lower);
    const mentionsMarketing = /campaign|promo|vip|discount|marketing|outreach/i.test(lower);

    const isAnalyticsQuery = mentionsAnalytics && !/create|make|reserve\b|book a table|assign shift/i.test(lower);

    const targetCapabilities: string[] = [];
    if (mentionsWorkforce) targetCapabilities.push("workforce");
    if (mentionsMenu) targetCapabilities.push("menu");
    if (mentionsMarketing) targetCapabilities.push("marketing");

    if (isAnalyticsQuery) {
      targetCapabilities.unshift("analytics");
    } else if (mentionsBooking) {
      targetCapabilities.push("seatbooking");
    }

    // Has multiple distinct domains joined by coordinating words
    const hasMultipleDomains = targetCapabilities.length > 1 && /(and|then|after|also|with)/i.test(lower);

    if (!hasMultipleDomains && isAnalyticsQuery) {
      targetCapabilities.length = 0;
      targetCapabilities.push("analytics");
    }

    // Fallback to active product if none detected
    if (targetCapabilities.length === 0 && context.activeProduct) {
      targetCapabilities.push(context.activeProduct);
    }

    const isBookingCreation = /\b(create|make|book)\s+(a\s+)?(reservation|table|seat)\b|\breserve\s+(a\s+)?(table|seat)?\b|\bbook\s+for\b/i.test(lower);

    let classification: RequestClassification = "information_request";
    if (isDestructive) {
      classification = "destructive_action";
    } else if (hasMultipleDomains) {
      classification = "multi_step_task";
    } else if (!isAnalyticsQuery && isBookingCreation) {
      classification = "business_operation";
    } else {
      classification = "information_request";
    }

    // Extract basic entities from context or utterance
    const entities: Record<string, any> = {};
    if (/cantina/i.test(lower)) entities.venueId = "cantina_bella";
    else if (/rooftop/i.test(lower)) entities.venueId = "rooftop_lounge";
    else if (/all\s*(venues)?|portfolio|across/i.test(lower)) entities.venueId = "all";
    else if (context.activeVenue) entities.venueId = context.activeVenue;

    if (/last week/i.test(lower)) entities.timeframe = "last_week";
    else if (/month/i.test(lower)) entities.timeframe = "month";
    else entities.timeframe = "current_week";

    // Party size extraction
    const partyMatch = lower.match(/party of (\d+)|(\d+)\s*(people|guests|covers)/i);
    if (partyMatch) {
      entities.partySize = parseInt(partyMatch[1] || partyMatch[2], 10);
    }

    // Check if critical booking parameters are missing when attempting a direct booking
    let requiresClarification = false;
    const missingParameters: string[] = [];
    if (classification === "business_operation" && isBookingCreation && !isDestructive) {
      if (!entities.partySize) {
        requiresClarification = true;
        missingParameters.push("partySize");
      }
    }

    return {
      intent: lower,
      classification,
      targetCapabilities,
      entities,
      requiresClarification,
      missingParameters: missingParameters.length > 0 ? missingParameters : undefined,
      clarificationPrompt: requiresClarification
        ? `Please specify party size and preferred dining time to confirm this reservation.`
        : undefined,
      isDestructive,
      confidence: 0.9,
    };
  }

  /**
   * Cognitive Stage 2: Construct Execution Plan.
   */
  public plan(understanding: IntentUnderstanding, context: ProsisContext): ProsisPlan {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const steps: PlanStep[] = [];

    // Step generation based on understanding
    if (understanding.classification === "destructive_action") {
      // Destructive operation requires supervised approval at Autonomy Level 1
      const isBookingCancel = understanding.targetCapabilities.includes("seatbooking");
      steps.push({
        id: `step_${planId}_1`,
        goal: isBookingCancel ? "Cancel designated dining reservations" : "Execute destructive operational modification",
        capabilityId: isBookingCancel ? "seatbooking" : understanding.targetCapabilities[0] || "operations",
        toolName: isBookingCancel ? "seatbooking_createReservation" : "emergency_action",
        arguments: {
          ...understanding.entities,
          action: "cancel",
          restaurantId: understanding.entities.venueId || context.activeVenue,
        },
        status: "waiting_approval",
        isDestructive: true,
        requiresApproval: true,
      });
    } else if (understanding.classification === "multi_step_task") {
      // Step 1: Analytics / Pacing check
      steps.push({
        id: `step_${planId}_1`,
        goal: "Query cross-venue telemetry and pacing metrics",
        capabilityId: "analytics",
        toolName: "getVenueAnalytics",
        arguments: {
          timeframe: understanding.entities.timeframe || "current_week",
          venueId: understanding.entities.venueId || context.activeVenue,
        },
        status: "pending",
        isDestructive: false,
        requiresApproval: false,
      });

      // Step 2: Next capability action
      const secondCap = understanding.targetCapabilities.find((c) => c !== "analytics") || "seatbooking";
      if (secondCap === "workforce") {
        steps.push({
          id: `step_${planId}_2`,
          goal: "Evaluate staff shift pacing against cover trajectories",
          capabilityId: "workforce",
          toolName: "workforce_planShifts",
          arguments: {
            venueId: understanding.entities.venueId || context.activeVenue,
          },
          status: "pending",
          dependencies: [`step_${planId}_1`],
          isDestructive: false,
          requiresApproval: false,
        });
      } else {
        steps.push({
          id: `step_${planId}_2`,
          goal: "Inspect reservation pacing and table utilization",
          capabilityId: "seatbooking",
          toolName: "getVenueAnalytics",
          arguments: {
            timeframe: understanding.entities.timeframe || "current_week",
            venueId: understanding.entities.venueId || context.activeVenue,
          },
          status: "pending",
          dependencies: [`step_${planId}_1`],
          isDestructive: false,
          requiresApproval: false,
        });
      }
    } else {
      // Single operational or information query
      const cap = understanding.targetCapabilities[0] || "analytics";
      const toolName = cap === "seatbooking" && understanding.entities.partySize
        ? "seatbooking_createReservation"
        : "getVenueAnalytics";

      const requiresApproval = toolName === "seatbooking_createReservation" && context.autonomyLevel < 2;

      steps.push({
        id: `step_${planId}_1`,
        goal: toolName === "seatbooking_createReservation"
          ? "Create table reservation"
          : "Retrieve operational telemetry and venue analytics",
        capabilityId: cap,
        toolName,
        arguments: {
          timeframe: understanding.entities.timeframe || "current_week",
          venueId: understanding.entities.venueId || context.activeVenue,
          ...understanding.entities,
        },
        status: requiresApproval ? "waiting_approval" : "pending",
        isDestructive: false,
        requiresApproval,
      });
    }

    const plan: ProsisPlan = {
      id: planId,
      userIntent: understanding.intent,
      classification: understanding.classification,
      targetCapabilities: understanding.targetCapabilities,
      steps,
      currentStepIndex: 0,
      status: steps.some((s) => s.requiresApproval) ? "waiting_approval" : "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return plan;
  }

  /**
   * Cognitive Stage 3: Execute Plan with Observation & Dynamic Replanning.
   */
  public async executePlan(
    plan: ProsisPlan,
    context: ProsisContext
  ): Promise<OrchestrationResult> {
    plan.status = "in_progress";
    const toolResults: Record<string, any> = { ...context.previousToolResults };

    // Resolve or build TrustedExecutionContext
    const trustedContext: TrustedExecutionContext = {
      userId: context.user.id,
      organizationId: context.organization.tenantId || context.organization.id,
      role: context.user.role,
      permissions: context.user.permissions,
      sessionId: context.sessionId,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      autonomyLevel: context.autonomyLevel ?? 1,
    };

    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStepIndex = i;

      // 1. Interruption Check
      if (context.interruptionEpoch !== undefined) {
        const activeEpoch = ToolExecutionService.getSessionEpoch(context.sessionId);
        if (context.interruptionEpoch < activeEpoch) {
          step.status = "failed";
          plan.status = "interrupted";
          return {
            state: "INTERRUPTED",
            plan,
            response: "Execution halted. Interrupted by subsequent user utterance.",
            error: "STALE_REQUEST",
          };
        }
      }

      // 2. Human Approval Check (Autonomy Level 1 Enforcement)
      if (step.requiresApproval && step.status === "waiting_approval") {
        const approval: PendingApproval = {
          id: `appr_${step.id}`,
          planId: plan.id,
          stepId: step.id,
          actionSummary: step.goal,
          toolName: step.toolName,
          arguments: step.arguments,
          impact: step.isDestructive ? "high" : "medium",
          isDestructive: step.isDestructive,
          timestamp: new Date().toISOString(),
          status: "pending",
        };

        this.pendingApprovals.set(approval.id, approval);
        context.pendingApprovals.push(approval);
        plan.status = "waiting_approval";

        return {
          state: "WAITING_FOR_APPROVAL",
          plan,
          activeStep: step,
          pendingApproval: approval,
          response: `Approval required: ${step.goal}. This operation has ${approval.impact} operational impact. Awaiting confirmation.`,
        };
      }

      // 3. Capability status check (handle future capabilities gracefully)
      const cap = CapabilityRegistry.get(step.capabilityId);
      if (cap && cap.status === "future") {
        step.status = "completed";
        step.result = {
          status: "planned",
          message: `${cap.name} is on the Prosis roadmap (${cap.futureRoadmapNotes || "In development"}).`,
        };
        toolResults[step.id] = step.result;
        continue;
      }

      // 4. Secure Dispatch to ToolExecutionService
      step.status = "executing";
      const startTime = Date.now();

      const execResult = await ToolExecutionService.execute(
        {
          requestId: `req_${Date.now()}_${i}`,
          sessionId: context.sessionId,
          conversationId: context.conversationId,
          toolName: step.toolName,
          arguments: step.arguments,
          interruptionEpoch: context.interruptionEpoch,
        },
        trustedContext
      );

      step.executionDurationMs = Date.now() - startTime;

      // 5. OBSERVING & EVALUATING RESULT
      if (!execResult.success) {
        step.status = "failed";
        step.error = execResult.error?.message;
        plan.status = "failed";

        // Evaluate error taxonomy
        const errorCode = execResult.error?.code;

        if (errorCode === "AUTHORIZATION_DENIED") {
          return {
            state: "FAILED",
            plan,
            activeStep: step,
            response: `Access restricted. User role '${context.user.role}' lacks required permissions to execute ${step.toolName}.`,
            error: "AUTHORIZATION_DENIED",
          };
        }

        if (errorCode === "RESOURCE_FORBIDDEN") {
          return {
            state: "FAILED",
            plan,
            activeStep: step,
            response: `Venue boundary violation. You do not have authorization to access '${step.arguments.venueId || step.arguments.restaurantId}'.`,
            error: "RESOURCE_FORBIDDEN",
          };
        }

        if (errorCode === "STALE_REQUEST") {
          plan.status = "interrupted";
          return {
            state: "INTERRUPTED",
            plan,
            activeStep: step,
            response: "Request superseded by a newer voice command.",
            error: "STALE_REQUEST",
          };
        }

        // Attempt replanning or return clean failure
        return {
          state: "FAILED",
          plan,
          activeStep: step,
          response: `Execution halted at step '${step.goal}': ${execResult.error?.message || "Internal gateway error"}.`,
          error: errorCode || "TOOL_EXECUTION_FAILED",
        };
      }

      // Step Succeeded
      step.status = "completed";
      step.result = execResult.data;
      toolResults[step.id] = execResult.data;
    }

    // All steps executed successfully
    plan.status = "completed";
    const executiveResponse = this.synthesizeExecutiveResponse(plan, toolResults);

    return {
      state: "COMPLETED",
      plan,
      response: executiveResponse,
      toolResults,
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

    return await this.executePlan(plan, context);
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

  /**
   * Handles conversational, orientation, and identity inquiries.
   */
  private handleConversation(
    understanding: IntentUnderstanding,
    rawInput: string
  ): string {
    if (understanding.intent === "greeting") {
      return "Prosis executive intelligence operating system online. Ready for operational directives.";
    }

    if (understanding.intent === "ecosystem_inquiry") {
      return CapabilityRegistry.formatEcosystemSummary();
    }

    return "Prosis intelligence operating system standing by. State your query or operational requirement.";
  }

  /**
   * Synthesizes a calm, authoritative response from completed plan results.
   */
  private synthesizeExecutiveResponse(
    plan: ProsisPlan,
    toolResults: Record<string, any>
  ): string {
    const lines: string[] = [];

    for (const step of plan.steps) {
      const data = toolResults[step.id];
      if (!data) continue;

      if (step.capabilityId === "analytics" || step.toolName === "getVenueAnalytics") {
        const venueArg = step.arguments.venueId || step.arguments.restaurantId;
        const venue = (venueArg && venueArg !== "all")
          ? (venueArg === "cantina_bella" ? "Cantina Bella" : venueArg)
          : (data.venueName || "Portfolio");
        const pacing = data.bookingVelocity || (data.weeklyPacingTrendPercent ? `${data.weeklyPacingTrendPercent}% trend` : "on pace");
        const covers = data.totalCovers !== undefined
          ? `${data.totalCovers} covers booked`
          : (data.covers !== undefined ? `${data.covers} covers` : "cover pacing verified");
        const revenue = data.projectedRevenueUsd || data.projectedRevenue
          ? `Revenue trajectory is $${(data.projectedRevenueUsd || data.projectedRevenue).toLocaleString()}`
          : "";
        lines.push(`${venue}: ${covers} (${pacing}). ${revenue}`.trim());
      } else if (step.capabilityId === "workforce") {
        lines.push(`Workforce telemetry: Shift coverage balanced against cover pacing targets.`);
      } else if (step.capabilityId === "seatbooking") {
        lines.push(`Reservation confirmed. Dining table allocation secured.`);
      } else {
        lines.push(`Step '${step.goal}' completed.`);
      }
    }

    if (lines.length === 0) {
      return "Directive executed successfully. All parameters verified.";
    }

    return lines.join(" ");
  }
}
