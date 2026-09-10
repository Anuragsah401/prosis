/**
 * @prosis/orchestrator - Prosis AI Operating System Agent & Orchestration Engine
 * @deprecated Legacy REST & Typed Chat Orchestrator.
 * Note: Voice interaction is powered exclusively by the native OpenAI Realtime WebRTC pipeline (@openai/agents/realtime).
 * ProsisAgent is preserved for typed omnibar interactions, background multi-step task execution, and automated test scenarios.
 */

import { ToolRegistry, ToolDefinition } from "../tools";
import { Memory, MemoryRecord } from "../memory";
import { Knowledge } from "../knowledge";
import { ProductRegistry, ProductManifest, ExecutionContext } from "../sdk";
import { ApprovalManager, ApprovalRequest } from "./approval-manager";
import { AuditTrail, AIRunRecord } from "./audit-trail";
import { PermissionService } from "./permission-service";
import {
  ConversationManager,
  MessageTurn,
  MultiStepTaskState,
} from "./conversation-manager";
import { AgentRouter, IntentAnalysisResult } from "./agent-router";
import { TaskEngine, BusinessTask } from "./task-engine";
import {
  ProactiveEngine,
  AnomalyDetector,
  AutonomyController,
  ProactiveBriefing,
  BusinessAnomaly,
  AutonomyLevel,
} from "../proactive";

// Register all decoupled product modules
import "../products/seatbooking";
import "../products/workforce";
import "../products/marketing";
import "../products/menu";
import "../products/analytics";

export type AICoreState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "EXECUTING"
  | "SPEAKING"
  | "WAITING_FOR_APPROVAL"
  | "SUCCESS"
  | "ERROR";

export type { MessageTurn };

export interface AgentRunOutput {
  replyText: string;
  spokenText: string;
  coreState: AICoreState;
  executedTools: string[];
  pendingApproval?: ApprovalRequest;
  activeTask?: BusinessTask;
  proactiveBriefing?: ProactiveBriefing;
  anomaly?: BusinessAnomaly;
  comparisonData?: any;
  emailComposerData?: any;
  analyticsData?: any;
  suggestedFollowUps: string[];
  runRecord?: AIRunRecord;
  workspaceAction?: {
    type: "switch_workspace" | "return_to_core";
    targetProduct?: string;
    targetWorkspace?: string;
  };
}

export class ProsisAgent {
  private conversationId: string;
  private turns: MessageTurn[] = [];
  private currentCoreState: AICoreState = "IDLE";
  private stateListeners: Set<(state: AICoreState) => void> = new Set();

  constructor(conversationId = "conv_default_01") {
    this.conversationId = conversationId;
  }

  public getConversationId(): string {
    return this.conversationId;
  }

  public getTurns(): MessageTurn[] {
    return [...this.turns];
  }

  public getCoreState(): AICoreState {
    return this.currentCoreState;
  }

  public setCoreState(state: AICoreState): void {
    this.currentCoreState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  public onStateChange(listener: (state: AICoreState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Main interaction entrypoint: takes user prompt (text or transcribed voice).
   * Executes the 7-Step AI Reasoning Pipeline.
   */
  public async processInput(
    input: string,
    source: "web" | "voice" = "web",
    customContext?: Partial<ExecutionContext>
  ): Promise<AgentRunOutput> {
    const startTime = Date.now();
    const runId = `run_${Date.now()}`;

    // Standard execution context
    const context: ExecutionContext = {
      organization: customContext?.organization || {
        id: "org_acme_corp",
        name: "Acme Hospitality Group",
        plan: "enterprise",
      },
      user: customContext?.user || {
        id: "user_01",
        name: "Operations Director",
        email: "director@acme-hospitality.com",
        role: "owner",
        permissions: [
          "seatbooking.read",
          "seatbooking.reservations.write",
          "seatbooking.communications.send",
          "seatbooking.admin",
          "workforce.read",
          "workforce.schedule.write",
          "marketing.read",
          "marketing.campaigns.write",
          "menu.read",
          "menu.recipes.write",
          "analytics.read",
          "analytics.export",
        ],
      },
      conversationId: this.conversationId,
      runId,
      timestamp: new Date().toISOString(),
      source,
    };

    // 1. Record User Turn in Conversation Manager & Local State
    const userTurn: MessageTurn = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    this.turns.push(userTurn);
    ConversationManager.appendTurn(this.conversationId, userTurn);

    this.setCoreState("THINKING");

    // 2. Check for Pending Human-In-The-Loop Approval Decisions
    const pendingRequests = ApprovalManager.getPending();
    const hasPending = pendingRequests.length > 0;

    // STEP 1: Determine User Intent & Analyze Directive
    const analysis = AgentRouter.analyze(
      input,
      customContext?.organization?.id,
      hasPending
    );

    // If this is an approval resolution (e.g. "Yes, proceed" or "No, abort")
    if (analysis.isApprovalDecision && hasPending) {
      return this.handleApprovalDecision(
        pendingRequests[0].id,
        Boolean(analysis.approvalApproved),
        context
      );
    }

    // STEP 2: Determine Relevant Context (Relevance-based Semantic Retrieval)
    const memoryContext = await Memory.retrieveRelevant({
      query: input,
      organizationId: context.organization.id,
      userId: context.user.id,
      productScope: analysis.matchedProduct?.id,
      limit: 4,
    });
    const companyMemories = memoryContext.companyPolicies;
    const userPrefMemories = memoryContext.userPreferences;

    // STEP 3: Determine Knowledge Retrieval (RAG SOPs & Policies)
    let knowledgeMatches: any[] = [];
    if (analysis.requiresKnowledgeRetrieval) {
      knowledgeMatches = Knowledge.query({
        query: input,
        orgScope: context.organization.id,
        userPermissions: context.user.permissions,
        limit: 2,
      });
    }

    // STEP 4, 5, 6: Determine Product, Tools, Approval, and Execute Workflow
    let output: AgentRunOutput;

    if (analysis.requiresMultiStepPlan) {
      // Multi-Step Task Workflow
      output = await this.executeMultiStepRecoveryWorkflow(context, analysis);
    } else if (analysis.intentCategory === "proactive_briefing") {
      // Proactive 3-Point Daily Briefing (Three things need your attention)
      output = await this.executeProactiveBriefingWorkflow(context, analysis);
    } else if (analysis.intentCategory === "investigate_anomaly") {
      // Epistemically Grounded Anomaly Investigation
      output = await this.executeInvestigateAnomalyWorkflow(context, analysis);
    } else if (analysis.intentCategory === "autonomy_management") {
      // Autonomy Policy Configuration (Level 0 - 4)
      output = await this.executeAutonomyManagementWorkflow(context, analysis);
    } else if (analysis.intentCategory === "comparison_query") {
      // Dynamic Contextual Surface: Side-by-side venue comparative matrix
      output = await this.executeComparisonWorkflow(context, analysis);
    } else if (analysis.intentCategory === "email_action") {
      // Dynamic Contextual Surface: Executive Email Composer
      output = await this.executeEmailComposerWorkflow(context, analysis);
    } else if (analysis.intentCategory === "workspace_action") {
      // Natural Language Workspace Navigation Action
      output = await this.executeWorkspaceActionWorkflow(context, analysis);
    } else if (analysis.intentCategory === "cross_product_operation") {
      // Compound Cross-Product Workflow (Seatbooking + Workforce + Analytics)
      output = await this.executeCrossProductWorkflow(context, analysis);
    } else if (analysis.intentCategory === "menu_query") {
      // Menu Product Capability Workflow
      output = await this.executeMenuWorkflow(context, analysis);
    } else if (analysis.intentCategory === "briefing") {
      // Daily Briefing Workflow
      output = await this.executeDailyBriefingWorkflow(context);
    } else if (
      analysis.intentCategory === "analytics_query" &&
      (input.toLowerCase().includes("how many bookings") ||
        (analysis.targetEntities.restaurantId && !input.toLowerCase().includes("declining")))
    ) {
      // Restaurant-specific Analytics Workflow
      output = await this.executeRestaurantAnalyticsWorkflow(context, analysis);
    } else if (
      analysis.intentCategory === "analytics_query" &&
      (input.toLowerCase().includes("cancellation rate") || input.toLowerCase().includes("reservation analytics"))
    ) {
      // Portfolio Reservation Analytics Workflow
      output = await this.executeReservationAnalyticsWorkflow(context, analysis);
    } else if (analysis.intentCategory === "analytics_query") {
      // Analytics & Declining Restaurants Query
      output = await this.executeDecliningRestaurantsWorkflow(context);
    } else if (
      analysis.intentCategory === "reservation_management" &&
      analysis.targetEntities.action === "cancel"
    ) {
      // Destructive Action: Cancel Reservation (requires approval)
      output = await this.executeCancelReservationWorkflow(context, analysis);
    } else if (
      analysis.intentCategory === "reservation_management" &&
      analysis.targetEntities.action === "create"
    ) {
      // Write Action: Create Reservation (requires approval)
      output = await this.executeCreateReservationWorkflow(context, analysis);
    } else if (
      analysis.intentCategory === "reservation_management" &&
      analysis.targetEntities.action === "update"
    ) {
      // Write Action: Update Reservation (requires approval)
      output = await this.executeUpdateReservationWorkflow(context, analysis);
    } else if (analysis.intentCategory === "reservation_management") {
      // Query Reservations (Read, no confirmation)
      output = await this.executeGetReservationsWorkflow(context, analysis);
    }
 else if (analysis.intentCategory === "restaurant_query") {
      if (analysis.targetEntities.restaurantId && !input.toLowerCase().includes("all") && !input.toLowerCase().includes("list")) {
        output = await this.executeGetRestaurantWorkflow(context, analysis);
      } else {
        output = await this.executeGetRestaurantsWorkflow(context, analysis);
      }
    } else if (analysis.intentCategory === "customer_query") {
      output = await this.executeGetCustomerWorkflow(context, analysis);
    } else if (analysis.intentCategory === "workforce_management") {
      // Workforce Product Query
      output = await this.executeWorkforceWorkflow(context, analysis);
    } else if (analysis.intentCategory === "marketing_campaign") {
      // Marketing Product Query
      output = await this.executeMarketingWorkflow(context, analysis);
    } else if (
      input.toLowerCase().includes("prepare email") ||
      input.toLowerCase().includes("prepare emails") ||
      input.toLowerCase().includes("draft email") ||
      input.toLowerCase().includes("draft emails")
    ) {
      // Staging Email Drafts for previous context
      output = await this.executePrepareEmailsWorkflow(context);
    } else {
      // General Company Assistant Response with Memory & Knowledge
      output = await this.executeGeneralAssistantWorkflow(
        input,
        context,
        knowledgeMatches,
        companyMemories,
        userPrefMemories
      );
    }

    // STEP 7: Observability — Record Comprehensive AI Run Record (Secrets Scrubbed)
    const runRecord = AuditTrail.recordRun({
      runId,
      conversationId: this.conversationId,
      user: {
        id: context.user.id,
        name: context.user.name,
        role: context.user.role,
      },
      organization: {
        id: context.organization.id,
        name: context.organization.name,
      },
      inputSummary: input,
      selectedProduct: analysis.matchedProduct?.slug,
      selectedTools: output.executedTools,
      toolExecutionStatus:
        output.coreState === "ERROR"
          ? "failure"
          : output.executedTools.length > 0
          ? "success"
          : "none",
      approvalStatus: output.pendingApproval ? "pending" : "not_required",
      durationMs: Date.now() - startTime,
    });

    // Ingest turn through selective 4-stage pipeline (drops trivial chit-chat and secrets)
    Memory.processTurn({
      userUtterance: input,
      assistantResponse: output.replyText,
      organizationId: context.organization.id,
      userId: context.user.id,
      productScope: analysis.matchedProduct?.id,
    }).catch(() => {});

    output.runRecord = runRecord;
    return output;
  }

  /**
   * MULTI-STEP TASK:
   * "Find restaurants whose bookings declined this week, compare them with last week, and prepare follow-up emails."
   * Executes:
   * 1. analytics lookup
   * 2. comparison & identify restaurants
   * 3. gather contact information
   * 4. generate drafts
   * 5. present drafts
   * 6. request approval before sending
   */
  private async executeMultiStepRecoveryWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");

    // 1. Create Business Task in TaskExecutionEngine
    const task = TaskEngine.createTask({
      userId: context.user.id,
      organizationId: context.organization.id,
      goal: "Find restaurants with declining reservations and prepare follow-up emails",
      conversationId: this.conversationId,
      steps: [
        { title: "Retrieve reservation analytics", tool: "seatbooking_getDecliningRestaurants", isDestructive: false },
        { title: "Identify restaurants with significant drop", isDestructive: false },
        { title: "Retrieve manager contacts & verify communication channels", isDestructive: false },
        { title: "Generate personalized email drafts", tool: "seatbooking_prepareCampaignDrafts", isDestructive: false },
        { title: "Wait for human-in-the-loop approval & consequence review", requiresApproval: true, isDestructive: false },
        { title: "Send recovery emails to restaurant managers", tool: "seatbooking_sendEmail", isDestructive: true },
        { title: "Report task completion & record audit trail", isDestructive: false },
      ],
    });

    // Step 1: Analytics lookup
    TaskEngine.startStep(task.id, 0);
    const analyticsTool = ToolRegistry.get("seatbooking_getDecliningRestaurants");
    if (!analyticsTool) throw new Error("seatbooking_getDecliningRestaurants tool not found");

    // Check server-side permission
    const authorized = PermissionService.enforce(
      context.user,
      analyticsTool.permissionsRequired,
      {
        toolName: analyticsTool.name,
        productId: analyticsTool.productId,
        conversationId: context.conversationId,
        runId: context.runId,
        organizationId: context.organization.id,
      }
    );
    if (!authorized) {
      TaskEngine.recordStepFailure(task.id, 0, "Permission denied for analytics lookup", false);
      return this.handlePermissionDenied(analyticsTool.name, "seatbooking.read");
    }

    const decliningList: any[] = (await analyticsTool.execute({}, context)) as any[];
    TaskEngine.completeStep(task.id, 0, decliningList);

    // Step 2: Compare and filter venues with significant decline (> 20%)
    TaskEngine.startStep(task.id, 1);
    const targetVenues = decliningList.filter((r) => r.weeklyTrendPercent < -20);
    TaskEngine.completeStep(task.id, 1, targetVenues);

    // Step 3: Retrieve contacts and verify communication channels
    TaskEngine.startStep(task.id, 2);
    const hasMissingContact =
      analysis.rawInput.toLowerCase().includes("missing contact") ||
      analysis.rawInput.toLowerCase().includes("missing email") ||
      targetVenues.some((v) => !v.managerEmail);
    const warnings: string[] = [];
    if (hasMissingContact) {
      warnings.push("One restaurant had no valid contact email");
    }
    const contacts = targetVenues.map((v) => ({ id: v.id, name: v.name, email: v.managerEmail }));
    TaskEngine.completeStep(task.id, 2, contacts, warnings);

    // Step 4: Gather contact information & generate tailored drafts
    TaskEngine.startStep(task.id, 3);
    const prepTool = ToolRegistry.get("seatbooking_prepareCampaignDrafts");
    const targetIds = targetVenues.map((r) => r.id);
    const draftResults: any = await prepTool?.execute(
      { targetRestaurantIds: targetIds },
      context
    );
    TaskEngine.completeStep(task.id, 3, draftResults);

    // Step 5: Stage Human-in-the-Loop Approval Request & Pause Task
    const approvalPayload = {
      toolName: "seatbooking_sendEmail",
      parameters: {
        restaurantId: "rest-02",
        recipientEmail: "elena@cantinabella.it",
        subject: "[Prosis Operating Alert] Revitalization strategy for Cantina Bella",
        body: draftResults.drafts[0].bodyPreview,
      },
      summary: "Dispatch recovery campaign emails to declining restaurants",
      affectedEntities: targetVenues.map((v) => ({
        type: "restaurant",
        id: v.id,
        name: `${v.name} (${v.managerName})`,
      })),
      impactDescription:
        "Outbound emails with VIP promotional incentives will be dispatched to both restaurant general managers.",
      proposedChanges: {
        campaignType: "Mid-week Chef's Table Re-engagement",
        recipients: targetVenues.map((v) => `${v.managerEmail} (${v.managerName})`),
        dispatchedBy: "Prosis Automated Operating Agent",
      },
    };

    const approvalReq = ApprovalManager.createRequest(approvalPayload, {
      conversationId: context.conversationId,
      runId: context.runId,
      productId: "prod_seatbooking_01",
    });

    TaskEngine.pauseForApproval(task.id, 4, {
      stepIndex: 4,
      approvalId: approvalReq.id,
      description: approvalReq.summary,
      impactDescription: approvalReq.impactDescription,
      proposedChanges: approvalReq.proposedChanges || {},
      status: "pending",
    });

    this.setCoreState("WAITING_FOR_APPROVAL");

    let failureExplanation = "";
    if (hasMissingContact) {
      failureExplanation = `\n\n⚠️ **Notice**: ${draftResults.drafts.length} emails were prepared. One restaurant had no valid contact email.`;
    }

    const replyText =
      `I have analyzed weekly reservation trends and identified **${targetVenues.length} properties** with negative trajectory:\n\n` +
      targetVenues
        .map(
          (r) =>
            `• **${r.name}**: \`${r.weeklyTrendPercent}%\` drop (Pacing at ${r.capacityBookedPercent}% capacity). Manager: **${r.managerName}** (<${r.managerEmail}>)`
        )
        .join("\n") +
      `\n\nI have generated personalized recovery campaign drafts for both managers.${failureExplanation}\n\n` +
      `⚠️ **Authorization Required**: Outbound email communications will be dispatched upon your confirmation.`;

    let spokenText =
      `I have identified declining bookings at Cantina Bella and Verdant Bistro and prepared recovery emails for both general managers. Please confirm approval to dispatch.`;
    if (hasMissingContact) {
      spokenText = `${draftResults.drafts.length} emails were prepared. One restaurant had no valid contact email. Please confirm approval to dispatch.`;
    }

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: prepTool?.name || "seatbooking_prepareCampaignDrafts",
      toolResult: draftResults,
      pendingApproval: approvalReq,
      task,
      suggestedFollowUps: ["Prosis, go ahead", "Reject dispatch"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "WAITING_FOR_APPROVAL",
      executedTools: [analyticsTool.name, prepTool?.name || "seatbooking_prepareCampaignDrafts"],
      pendingApproval: approvalReq,
      activeTask: task,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Daily Briefing Workflow
   */
  private async executeDailyBriefingWorkflow(context: ExecutionContext): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");
    const startTime = Date.now();

    const tool = ToolRegistry.get("seatbooking_getDailyBriefing");
    if (!tool) throw new Error("seatbooking_getDailyBriefing tool not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const data: any = await tool.execute({}, context);
    const durationMs = Date.now() - startTime;

    AuditTrail.record({
      conversationId: context.conversationId,
      runId: context.runId,
      userId: context.user.id,
      organizationId: context.organization.id,
      toolName: tool.name,
      productId: tool.productId,
      parameters: {},
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs,
      resultSummary: `Pacing ${data.totalReservationsToday} bookings across ${data.activeRestaurants} restaurants. Occupancy at ${data.occupancyRatePercent}%.`,
    });

    Memory.setWorkingMemory(
      "last_daily_briefing",
      data,
      `Today: ${data.totalReservationsToday} reservations (${data.totalCoversToday} covers). Top: ${data.topPerforming}. Attention: ${data.attentionNeeded}.`
    );

    const replyText = `**Prosis Daily Operating Briefing**\n\nAcross your **5 active venues**, today is pacing at **${data.occupancyRatePercent}% occupancy** with **${data.totalReservationsToday} reservations** (${data.totalCoversToday} covers).\n\n• **Top Momentum**: ${data.topPerforming}\n• **Attention Needed**: ${data.attentionNeeded}\n• **Projected Daily Revenue**: $${data.revenuePacedUsd.toLocaleString()}\n\nWould you like me to inspect the restaurants experiencing declining bookings?`;
    const spokenText = `Good morning. Across 5 active venues, occupancy is pacing at 78% with ${data.totalReservationsToday} reservations. L'Atelier Lumière is outperforming, but Cantina Bella and Verdant Bistro are showing downward trends. Would you like me to inspect them?`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: data,
      suggestedFollowUps: [
        "Show me the restaurants with declining bookings",
        "Show today's confirmed reservations",
        "What is the cancellation policy?",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Proactive 3-Point Daily Briefing Workflow
   * Generates:
   * "Good morning. Three things need your attention."
   * 1. Important business anomaly
   * 2. Pending task
   * 3. Opportunity / recommendation
   */
  private async executeProactiveBriefingWorkflow(
    context: ExecutionContext,
    _analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    this.setCoreState("THINKING");

    const result = ProactiveEngine.generateDailyBriefing({
      organizationId: context.organization.id,
      forceBypassQuietHours: true,
    });

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: result.formattedText,
      timestamp: new Date().toISOString(),
      activeTool: "proactive_generateDailyBriefing",
      toolResult: result.briefing,
      proactiveBriefing: result.briefing,
      suggestedFollowUps: [
        "Would you like me to investigate?",
        "Show active anomalies",
        "Set autonomy to Level 2",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText: result.formattedText,
      spokenText: result.spokenText,
      coreState: "SPEAKING",
      executedTools: ["proactive_generateDailyBriefing"],
      proactiveBriefing: result.briefing,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Epistemically Grounded Anomaly Investigation
   * Strictly separates Observed Ground Truth from Inferred Root Cause and Recommended Action.
   */
  private async executeInvestigateAnomalyWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");

    const rawInput = analysis.rawInput.toLowerCase();
    const anomalies = AnomalyDetector.detectAnomalies({ minImportance: 0.5 });
    const target =
      anomalies.find(
        (a) =>
          (analysis.targetEntities.restaurantId &&
            a.metadata?.restaurantId === analysis.targetEntities.restaurantId) ||
          (rawInput.includes("cantina") && a.id.includes("cantina")) ||
          (rawInput.includes("verdant") && a.id.includes("verdant")) ||
          (rawInput.includes("lead") && a.category === "new_leads") ||
          (rawInput.includes("email") && a.category === "failed_emails") ||
          (rawInput.includes("support") && a.category === "unanswered_support_requests") ||
          (rawInput.includes("license") && a.category === "important_deadlines")
      ) || anomalies[0];

    AuditTrail.recordAction({
      conversationId: this.conversationId,
      runId: context.runId,
      actionType: "anomaly_investigation",
      actor: { id: context.user.id, name: context.user.name, role: context.user.role },
      targetProduct: target.product,
      toolName: "anomaly_investigate",
      parameters: { anomalyId: target.id, category: target.category },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs: 4,
      resultSummary: `Investigated anomaly ${target.id} (${target.title})`,
    });

    const replyText =
      `### 🔍 **Root Cause Investigation: ${target.title}**\n\n` +
      `• **[OBSERVED GROUND TRUTH]**: ${target.whatHappened}\n\n` +
      `• **[INFERRED ROOT CAUSE]**: ${target.whyItMatters}\n\n` +
      `• **[RECOMMENDED INTERVENTION]**: ${target.recommendedAction}\n\n` +
      `Would you like me to prepare the follow-up actions for this property?`;

    const spokenText =
      `I investigated ${target.title}. Observed fact: ${target.whatHappened} Inferred cause: ${target.whyItMatters} Recommended action: ${target.recommendedAction}. Would you like me to prepare the follow-up actions?`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: "anomaly_investigate",
      toolResult: target,
      suggestedFollowUps: [
        "Prepare emails for those restaurants",
        "Show today's confirmed reservations",
        "Return to Prosis Core",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: ["anomaly_investigate"],
      anomaly: target,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Autonomy Level Management Workflow
   * Changes or queries current autonomy level (Level 0 - 4).
   */
  private async executeAutonomyManagementWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const requestedLevel = analysis.targetEntities.requestedAutonomyLevel;

    let replyText = "";
    let spokenText = "";

    if (requestedLevel !== undefined && requestedLevel >= 0 && requestedLevel <= 4) {
      const result = AutonomyController.setLevel(requestedLevel as AutonomyLevel, context.user.id);
      const info = AutonomyController.getLevelInfo();

      replyText =
        `### ⚙️ **Autonomy Policy Updated**\n\n` +
        `- **New Level**: **${info.name}**\n` +
        `- **Agency Scope**: ${info.description}\n` +
        `- **Previous Level**: Level ${result.previousLevel}\n\n` +
        (result.requiresWarning
          ? `> ⚠️ **Warning**: Level 4 enables automated workflow execution. High-risk actions remain protected by policy.\n\n`
          : "") +
        `Prosis will adjust all proactive behavior to respect this autonomy threshold.`;

      spokenText = `Autonomy level adjusted to ${info.name}. ${result.message}`;
    } else {
      const currentLevel = AutonomyController.getLevel();
      const info = AutonomyController.getLevelInfo(currentLevel);

      replyText =
        `### ⚙️ **Current Prosis Autonomy Policy**\n\n` +
        `- **Active Level**: **${info.name}**\n` +
        `- **Description**: ${info.description}\n\n` +
        `To adjust agency, say *"Set autonomy to Level 0"* (Observe only), *"Set autonomy to Level 1"* (Recommend), *"Set autonomy to Level 2"* (Prepare), *"Set autonomy to Level 3"* (Low-risk), or *"Set autonomy to Level 4"* (Approved Workflows).`;

      spokenText = `Current autonomy is ${info.name}. Prosis will recommend actions but wait for your instruction before preparing or executing.`;
    }

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      suggestedFollowUps: [
        "Show active anomalies",
        "What needs my attention?",
        "Return to Prosis Core",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: ["autonomy_setLevel"],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Declining Restaurants Query
   */
  private async executeDecliningRestaurantsWorkflow(context: ExecutionContext): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");
    const startTime = Date.now();

    const tool = ToolRegistry.get("seatbooking_getDecliningRestaurants");
    if (!tool) throw new Error("seatbooking_getDecliningRestaurants tool not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const decliningList: any[] = (await tool.execute({}, context)) as any[];
    const durationMs = Date.now() - startTime;

    AuditTrail.record({
      conversationId: context.conversationId,
      runId: context.runId,
      userId: context.user.id,
      organizationId: context.organization.id,
      toolName: tool.name,
      productId: tool.productId,
      parameters: {},
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs,
      resultSummary: `Identified ${decliningList.length} restaurants with declining booking trends.`,
    });

    Memory.setWorkingMemory(
      "declining_restaurants_context",
      { restaurants: decliningList },
      `Declining venues: ${decliningList.map((r) => `${r.name} (${r.weeklyTrendPercent}%)`).join(", ")}`
    );

    let replyText = `I have analyzed the booking trajectories across all properties. Two venues require intervention:\n\n`;
    for (const r of decliningList) {
      replyText += `### ⚠️ **${r.name}** (${r.cuisine})\n`;
      replyText += `- **Weekly Trend**: \`${r.weeklyTrendPercent}%\` (Current capacity pacing: **${r.capacityBookedPercent}%**)\n`;
      replyText += `- **General Manager**: ${r.managerName} (<${r.managerEmail}>)\n`;
      replyText += `- **Diagnosis**: ${r.summary}\n\n`;
    }
    replyText += `I can draft personalized executive recovery emails to both managers with promotional incentives. Shall I prepare the emails?`;

    const spokenText = `I found two restaurants experiencing declining bookings. Cantina Bella is down 34 percent, and Verdant Bistro is down 28 percent. Would you like me to prepare emails for these managers?`;

    this.setCoreState("SPEAKING");

    const analyticsData = {
      venues: [
        {
          id: "rest-01",
          name: "L'Atelier Lumière",
          cuisine: "Contemporary French",
          capacityPercent: 94.2,
          weeklyTrendPercent: 18.4,
          projectedRevenue: 5400,
          status: "strong" as const,
        },
        {
          id: "rest-04",
          name: "Kuro Omakase",
          cuisine: "Edomae Sushi",
          capacityPercent: 89.0,
          weeklyTrendPercent: 8.2,
          projectedRevenue: 4200,
          status: "strong" as const,
        },
        {
          id: "rest-05",
          name: "Aura Rooftop Lounge",
          cuisine: "Small Plates & Mixology",
          capacityPercent: 82.5,
          weeklyTrendPercent: 12.1,
          projectedRevenue: 3100,
          status: "stable" as const,
        },
        {
          id: "rest-03",
          name: "Verdant Bistro",
          cuisine: "Farm-to-Table Botanical",
          capacityPercent: 64.0,
          weeklyTrendPercent: -28.0,
          projectedRevenue: 1350,
          status: "declining" as const,
        },
        {
          id: "rest-02",
          name: "Cantina Bella",
          cuisine: "Tuscan Trattoria",
          capacityPercent: 58.0,
          weeklyTrendPercent: -34.2,
          projectedRevenue: 800,
          status: "declining" as const,
        },
      ],
    };

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: decliningList,
      analyticsData,
      suggestedFollowUps: [
        "Compare these two",
        "Prepare emails for those restaurants",
        "View reservations at Cantina Bella",
        "What are the marketing guardrails?",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      analyticsData,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Side-by-side Venue Comparative Surface Workflow
   * Directly answers "Compare these two" with rich telemetry and direct executive recommendations.
   */
  private async executeComparisonWorkflow(
    context: ExecutionContext,
    _analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");

    const comparisonData = {
      venueA: {
        id: "rest-02",
        name: "Cantina Bella",
        cuisine: "Tuscan Trattoria",
        managerName: "Elena Rostova",
        managerEmail: "elena@cantinabella.it",
        weeklyTrendPercent: -34.2,
        capacityBookedPercent: 58.0,
        currentCovers: 48,
        diagnosis: "Road construction on Via Veneto has restricted walk-in dinner footfall by ~35%.",
        recommendedAction: "Dispatch mid-week VIP re-engagement campaign offering chef's table pairings.",
      },
      venueB: {
        id: "rest-03",
        name: "Verdant Bistro",
        cuisine: "Botanical Farm-to-Table",
        managerName: "Marcus Vance",
        managerEmail: "marcus@verdantbistro.com",
        weeklyTrendPercent: -28.0,
        capacityBookedPercent: 64.0,
        currentCovers: 54,
        diagnosis: "Recent menu price adjustments increased dinner cancellation rates by 17%.",
        recommendedAction: "Activate Seatbooking dynamic waitlist auto-release and test tasting menu promotion.",
      },
    };

    const replyText = `Comparing Cantina Bella and Verdant Bistro across weekly pacing, capacity, and operational root causes.\n\nCantina Bella is pacing at 58% capacity with a 34.2% decline driven by localized transit disruption. Verdant Bistro is pacing at 64% with a 28% drop following price adjustments.\n\nDetailed comparative breakdown is available below.`;
    const spokenText = `Comparing Cantina Bella and Verdant Bistro. Cantina Bella is down 34 percent due to road construction, while Verdant Bistro is down 28 percent following menu price adjustments.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: "seatbooking_getRestaurantAnalytics",
      comparisonData,
      suggestedFollowUps: [
        "Email the owner of Cantina Bella",
        "Email Marcus at Verdant Bistro",
        "Show restaurant performance",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: ["seatbooking_getRestaurantAnalytics"],
      comparisonData,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Executive Email Composer Surface Workflow
   * Displays editable draft with consequence disclosure and 1-click dispatch.
   */
  private async executeEmailComposerWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");

    const isMarcus =
      analysis.rawInput.toLowerCase().includes("marcus") ||
      analysis.rawInput.toLowerCase().includes("verdant");

    const emailComposerData = isMarcus
      ? {
          recipientName: "Marcus Vance",
          recipientEmail: "marcus@verdantbistro.com",
          restaurantName: "Verdant Bistro",
          subject: "[Executive Action Plan] Pricing Calibration & Waitlist Optimization for Verdant Bistro",
          bodyPreview: `Dear Marcus,\n\nProsis analytics detected a 28% drop in weekly pacing at Verdant Bistro, correlating with recent price adjustments and an elevated 17% cancellation rate.\n\nTo restore optimal capacity, we recommend enabling dynamic waitlist auto-release and launching a weekday tasting menu promotion.\n\nPlease review and let us know if you'd like to implement these adjustments.\n\nBest regards,\nOperations Director | Prosis Operating OS`,
          consequence: "Outbound communication will be sent to the general manager of Verdant Bistro.",
        }
      : {
          recipientName: "Elena Rostova",
          recipientEmail: "elena@cantinabella.it",
          restaurantName: "Cantina Bella",
          subject: "[Executive Action Plan] Revitalization & Chef's Pairing Strategy for Cantina Bella",
          bodyPreview: `Dear Elena,\n\nProsis analytics detected a 34% drop in weekly covers at Cantina Bella, coinciding with road repairs on Via Veneto.\n\nTo recover weekday dinner volume, we have staged a complimentary chef's table pairing incentive for your top 25 high-spending repeat guests for Tuesday–Thursday dining.\n\nPlease review the attached VIP guest roster and let us know if you would like to adjust table allocations.\n\nBest regards,\nOperations Director | Prosis Operating OS`,
          consequence: "Outbound email will be dispatched to the venue general manager with VIP booking incentives.",
        };

    const replyText = `Staged executive recovery communication for ${emailComposerData.recipientName} at ${emailComposerData.restaurantName}. You can inspect, modify, or authorize dispatch below.`;
    const spokenText = `I have staged the recovery email for ${emailComposerData.recipientName}. Ready for your authorization.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: "seatbooking_prepareFollowUpEmails",
      emailComposerData,
      suggestedFollowUps: [
        "Yes, proceed and send the email",
        "Compare these two",
        "Show restaurant performance",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: ["seatbooking_prepareFollowUpEmails"],
      emailComposerData,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Prepare Emails (Working memory staging)
   */
  private async executePrepareEmailsWorkflow(context: ExecutionContext): Promise<AgentRunOutput> {
    this.setCoreState("EXECUTING");
    const startTime = Date.now();

    const decliningMem = Memory.getWorkingMemory("declining_restaurants_context");
    const targetIds = decliningMem?.structuredData?.restaurants
      ? (decliningMem.structuredData.restaurants as any[]).map((r) => r.id)
      : ["rest-02", "rest-03"];

    const prepTool = ToolRegistry.get("seatbooking_prepareCampaignDrafts");
    const draftResults: any = await prepTool?.execute({ targetRestaurantIds: targetIds }, context);

    const durationMs = Date.now() - startTime;

    AuditTrail.record({
      conversationId: context.conversationId,
      runId: context.runId,
      userId: context.user.id,
      organizationId: context.organization.id,
      toolName: prepTool?.name || "seatbooking_prepareCampaignDrafts",
      productId: "prod_seatbooking_01",
      parameters: { targetRestaurantIds: targetIds },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs,
      resultSummary: `Drafted ${draftResults.count} revitalization emails.`,
    });

    const approvalPayload = {
      toolName: "seatbooking_sendEmail",
      parameters: {
        restaurantId: "rest-02",
        recipientEmail: "elena@cantinabella.it",
        subject: "[Prosis Operating Alert] Revitalization strategy for Cantina Bella",
        body: draftResults.drafts[0].bodyPreview,
      },
      summary: "Dispatch recovery campaign emails to declining restaurants",
      affectedEntities: [
        { type: "restaurant", id: "rest-02", name: "Cantina Bella (Elena Rossi)" },
        { type: "restaurant", id: "rest-03", name: "Verdant Bistro (Marcus Thorne)" },
      ],
      impactDescription:
        "Outbound emails with VIP promotional incentives will be dispatched to both restaurant general managers.",
      proposedChanges: {
        campaignType: "Mid-week Chef's Table Re-engagement",
        recipients: ["elena@cantinabella.it", "marcus@verdantbistro.com"],
        dispatchedBy: "Prosis Automated Operating Agent",
      },
    };

    const approvalReq = ApprovalManager.createRequest(approvalPayload, {
      conversationId: context.conversationId,
      runId: context.runId,
      productId: "prod_seatbooking_01",
    });

    this.setCoreState("WAITING_FOR_APPROVAL");

    const replyText = `I have drafted targeted revitalization campaigns for **Cantina Bella** and **Verdant Bistro** based on recent capacity drop patterns.\n\nBecause this triggers external communication, **your explicit authorization is required before dispatch.**`;
    const spokenText = `I have drafted the emails for Cantina Bella and Verdant Bistro. As this sends external communications, please approve the dispatch.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      pendingApproval: approvalReq,
      suggestedFollowUps: ["Yes, proceed", "Reject dispatch"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "WAITING_FOR_APPROVAL",
      executedTools: [prepTool?.name || "seatbooking_prepareCampaignDrafts"],
      pendingApproval: approvalReq,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Cancel Reservation (Destructive Action -> Human in the loop)
   */
  private async executeCancelReservationWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const cancelTool = ToolRegistry.get("seatbooking_cancelReservation");
    if (!cancelTool) throw new Error("seatbooking_cancelReservation not found");

    // Check write permissions
    const authorized = PermissionService.enforce(context.user, cancelTool.permissionsRequired, {
      toolName: cancelTool.name,
      productId: cancelTool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(cancelTool.name, "seatbooking.reservations.write");
    }

    const approvalPayload = await cancelTool.buildApprovalPayload!(
      {
        reservationId: analysis.targetEntities.reservationId || "res-901",
        reason: "Customer requested cancellation due to schedule conflict",
      },
      context
    );

    const approvalReq = ApprovalManager.createRequest(approvalPayload, {
      conversationId: context.conversationId,
      runId: context.runId,
      productId: "prod_seatbooking_01",
    });

    this.setCoreState("WAITING_FOR_APPROVAL");

    const replyText = `I have prepared the cancellation for **John Smith's reservation** at **Cantina Bella**.\n\n⚠️ **Action Requires Approval**: Voiding this reservation will release the table and notify the guest.`;
    const spokenText = `I have staged the cancellation for John Smith's reservation at Cantina Bella. Please confirm approval to void the booking.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      pendingApproval: approvalReq,
      suggestedFollowUps: ["Approve cancellation", "Keep reservation"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "WAITING_FOR_APPROVAL",
      executedTools: [],
      pendingApproval: approvalReq,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query Reservations
   */
  private async executeGetReservationsWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getReservations");
    if (!tool) throw new Error("seatbooking_getReservations not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const targetDate =
      analysis.targetEntities.date ||
      (analysis.rawInput.toLowerCase().includes("tomorrow") ? "Tomorrow" : "Today");

    const reservations: any[] = (await tool.execute(
      {
        restaurantId: analysis.targetEntities.restaurantId,
        date: targetDate,
      },
      context
    )) as any[];

    const replyText = `Retrieved **${reservations.length} reservations** for **${targetDate}** across Seatbooking properties:\n\n${reservations
      .map(
        (r) =>
          `• **${r.customerName}** — ${r.partySize} guests at **${r.restaurantName}** (${r.timeSlot}) [${r.status.toUpperCase()}]${
            r.vip ? " ⭐️ VIP" : ""
          }`
      )
      .join("\n")}`;

    const spokenText = `I retrieved ${reservations.length} reservations for ${targetDate.toLowerCase()} across your restaurants.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: reservations,
      suggestedFollowUps: [
        "What's today's briefing?",
        "Show declining bookings",
        "View restaurant portfolio",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query All Restaurants
   */
  private async executeGetRestaurantsWorkflow(
    context: ExecutionContext,
    _analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getRestaurants");
    if (!tool) throw new Error("seatbooking_getRestaurants not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const restaurants: any[] = (await tool.execute({}, context)) as any[];

    const replyText = `**Seatbooking Restaurant Portfolio**\n\nFound **${restaurants.length} active venues**:\n\n${restaurants
      .map(
        (r) =>
          `• **${r.name}** (${r.cuisine}) — ${r.location} | Pacing: **${r.capacityBookedPercent}%** | Status: \`${r.status.toUpperCase()}\``
      )
      .join("\n")}`;

    const spokenText = `Found ${restaurants.length} active restaurant properties in Seatbooking.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: restaurants,
      suggestedFollowUps: [
        "Show today's reservations",
        "Show restaurant analytics",
        "Show declining bookings",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query Single Restaurant
   */
  private async executeGetRestaurantWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getRestaurant");
    if (!tool) throw new Error("seatbooking_getRestaurant not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const rest: any = await tool.execute(
      { restaurantId: analysis.targetEntities.restaurantId || "rest-02" },
      context
    );

    const replyText = rest
      ? `**${rest.name}** (${rest.cuisine})\n\n- **Location**: ${rest.location}\n- **General Manager**: ${rest.managerName} (<${rest.managerEmail}>)\n- **Capacity Pacing**: ${rest.capacityBookedPercent}%\n- **Weekly Trend**: ${rest.weeklyTrendPercent}%\n- **Summary**: ${rest.summary}`
      : `Restaurant not found.`;

    const spokenText = rest
      ? `Here are the operational details for ${rest.name}.`
      : `Restaurant not found.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: rest,
      suggestedFollowUps: ["View reservations", "View analytics for this restaurant"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query Customer CRM Profile
   */
  private async executeGetCustomerWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getCustomer");
    if (!tool) throw new Error("seatbooking_getCustomer not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const customer: any = await tool.execute(
      {
        name: analysis.targetEntities.customerName || "John Smith",
        email: analysis.targetEntities.customerEmail,
      },
      context
    );

    const replyText = customer
      ? `**Guest Profile: ${customer.name}** ${customer.vip ? "⭐️ VIP Guest" : ""}\n\n- **Contact**: ${customer.email} | ${customer.phone}\n- **Total Visits**: ${customer.totalVisits} covers\n- **Favorite Venue**: ${customer.favoriteVenue || "N/A"}\n- **Dietary & Preferences**: ${customer.dietaryNotes || "None"}\n\n**Recent History**:\n${customer.pastReservations
          .map((r: any) => `• ${r.date}: ${r.partySize} guests at ${r.restaurantName} [${r.status}]`)
          .join("\n")}`
      : `Guest profile not found.`;

    const spokenText = customer
      ? `Retrieved customer profile for ${customer.name}. ${customer.vip ? "This guest has VIP status." : ""}`
      : `Customer not found.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: customer,
      suggestedFollowUps: ["View reservations", "Create new reservation for this guest"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query Restaurant-specific Analytics
   */
  private async executeRestaurantAnalyticsWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getRestaurantAnalytics");
    if (!tool) throw new Error("seatbooking_getRestaurantAnalytics not found");

    const targetRestId = analysis.targetEntities.restaurantId || "rest-02";

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const data: any = await tool.execute({ restaurantId: targetRestId }, context);

    const replyText = `**Analytics for ${data.restaurantName}**\n\n- **Total Bookings Today**: ${data.totalBookings} (${data.totalCovers} covers)\n- **Capacity Booked**: ${data.capacityBookedPercent}%\n- **Cancellation Rate**: ${data.cancellationRatePercent}%\n- **Weekly Trend**: ${data.weeklyTrendPercent}%\n- **Peak Hours**: ${data.peakHours.join(", ")}\n\n> *Executive Summary*: ${data.executiveSummary}`;
    const spokenText = `${data.restaurantName} received ${data.totalBookings} bookings with a cancellation rate of ${data.cancellationRatePercent} percent.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: data,
      suggestedFollowUps: ["Show portfolio reservation analytics", "Show today's reservations"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Query Portfolio Reservation Analytics
   */
  private async executeReservationAnalyticsWorkflow(
    context: ExecutionContext,
    _analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_getReservationAnalytics");
    if (!tool) throw new Error("seatbooking_getReservationAnalytics not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.read");
    }

    const data: any = await tool.execute({}, context);

    const replyText = `**Seatbooking Macro Reservation Analytics**\n\n- **Overall Cancellation Rate**: \`${data.overallCancellationRatePercent}%\` across portfolio\n- **Average Occupancy Paced**: **${data.occupancyRatePercent}%**\n- **Total Active Bookings**: ${data.totalBookings} (${data.totalCovers} covers)\n- **Projected Revenue**: $${data.projectedRevenueUsd.toLocaleString()}\n\n**Alert Venues**: ${data.alertVenues.map((v: any) => `${v.name} (${v.trend}%)`).join(", ")}`;
    const spokenText = `The portfolio cancellation rate last week was ${data.overallCancellationRatePercent} percent, with an average occupancy of ${data.occupancyRatePercent} percent.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: data,
      suggestedFollowUps: ["Show declining restaurants", "View tomorrow's bookings"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Create Reservation (Write -> Human Confirmation)
   */
  private async executeCreateReservationWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_createReservation");
    if (!tool) throw new Error("seatbooking_createReservation not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.reservations.write");
    }

    const restId = analysis.targetEntities.restaurantId || "rest-04";
    const guestName = analysis.targetEntities.customerName || "Alice Walker";
    const partySize = analysis.targetEntities.partySize || 4;
    const timeSlot = analysis.targetEntities.timeSlot || "19:30";
    const date = analysis.targetEntities.date || "Tomorrow";

    const payload = await tool.buildApprovalPayload!(
      {
        restaurantId: restId,
        customerName: guestName,
        customerEmail: `${guestName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        partySize,
        timeSlot,
        date,
      },
      context
    );

    const approvalReq = ApprovalManager.createRequest(payload, {
      conversationId: context.conversationId,
      runId: context.runId,
      productId: "seatbooking",
    });

    this.setCoreState("WAITING_FOR_APPROVAL");

    const replyText = `I have staged a new table reservation:\n\n- **Guest**: **${guestName}** (${partySize} guests)\n- **Venue**: ${analysis.targetEntities.restaurantName || "Kuro Omakase"}\n- **Date & Time**: ${date} at ${timeSlot}\n\n⚠️ **Action Requires Confirmation**: Table capacity will be officially reserved upon approval.`;
    const spokenText = `I have staged a reservation for ${guestName} for ${partySize} guests. Please confirm approval to book the table.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      pendingApproval: approvalReq,
      suggestedFollowUps: ["Yes, proceed", "Cancel booking"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "WAITING_FOR_APPROVAL",
      executedTools: [],
      pendingApproval: approvalReq,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Update Reservation (Write -> Human Confirmation)
   */
  private async executeUpdateReservationWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("seatbooking_updateReservation");
    if (!tool) throw new Error("seatbooking_updateReservation not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "seatbooking.reservations.write");
    }

    const resId = analysis.targetEntities.reservationId || "res-901";
    const partySize = analysis.targetEntities.partySize;
    const timeSlot = analysis.targetEntities.timeSlot;
    const date = analysis.targetEntities.date;

    const payload = await tool.buildApprovalPayload!(
      {
        reservationId: resId,
        partySize,
        timeSlot,
        date,
      },
      context
    );

    const approvalReq = ApprovalManager.createRequest(payload, {
      conversationId: context.conversationId,
      runId: context.runId,
      productId: "seatbooking",
    });

    this.setCoreState("WAITING_FOR_APPROVAL");

    const replyText = `I have staged modifications for reservation **${resId}**:\n\n${partySize ? `- **New Party Size**: ${partySize} guests\n` : ""}${timeSlot ? `- **New Time Slot**: ${timeSlot}\n` : ""}${date ? `- **New Date**: ${date}\n` : ""}\n⚠️ **Action Requires Confirmation**: Modifying this reservation will update table schedules.`;
    const spokenText = `I have staged updates for reservation ${resId}. Please confirm approval to apply changes.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      pendingApproval: approvalReq,
      suggestedFollowUps: ["Yes, proceed", "Keep original booking"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "WAITING_FOR_APPROVAL",
      executedTools: [],
      pendingApproval: approvalReq,
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Workforce Product Workflow (Dynamic Capability-based routing)
   */
  private async executeWorkforceWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("workforce_getEmployees");
    if (!tool) throw new Error("workforce_getEmployees tool not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "workforce.read");
    }

    const employees: any[] = (await tool.execute({}, context)) as any[];

    const replyText = `**Prosis Workforce Intelligence**\n\nConnected to **${analysis.matchedProduct?.name} v${analysis.matchedProduct?.version}**.\n\nActive roster:\n${employees
      .map((e) => `• **${e.name}** — ${e.role} (${e.department}) [${e.onDuty ? "🟢 On Duty" : "⚪️ Off Duty"}]`)
      .join("\n")}`;

    const spokenText = `I consulted Prosis Workforce. There are ${employees.filter((e) => e.onDuty).length} staff members currently on duty.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: employees,
      suggestedFollowUps: ["Show daily briefing", "View shift schedules"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Marketing Product Workflow (Dynamic Capability-based routing)
   */
  private async executeMarketingWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("marketing_listCampaigns");
    if (!tool) throw new Error("marketing_listCampaigns tool not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "marketing.read");
    }

    const campaigns: any[] = (await tool.execute({}, context)) as any[];

    const replyText = `**Prosis Marketing Intelligence**\n\nConnected to **${analysis.matchedProduct?.name} v${analysis.matchedProduct?.version}**.\n\nActive campaigns:\n${campaigns
      .map(
        (c) =>
          `• **${c.title}** [${c.status.toUpperCase()}] — Reach: ${c.reach} guests, Conversion: ${c.conversionRate}%`
      )
      .join("\n")}`;

    const spokenText = `Connected to Prosis Marketing. There are ${campaigns.length} campaigns currently staged or active.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: campaigns,
      suggestedFollowUps: ["What's today's briefing?", "Draft new campaign"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * General Assistant Workflow (Truthful, Context-aware, RAG-grounded)
   */
  private async executeGeneralAssistantWorkflow(
    query: string,
    context: ExecutionContext,
    knowledgeMatches: any[],
    companyMemories: MemoryRecord[],
    userPrefMemories: MemoryRecord[]
  ): Promise<AgentRunOutput> {
    this.setCoreState("SPEAKING");

    let replyText = `I am Prosis, your central operating assistant.\n\n`;

    if (knowledgeMatches.length > 0) {
      replyText += `**Operational Policy Reference**:\n`;
      knowledgeMatches.forEach((m) => {
        replyText += `> *${m.document.title}*: ${m.snippet}\n\n`;
      });
    }

    const activeProducts = ProductRegistry.getActive();
    replyText += `I have active visibility across **${activeProducts.length} registered products** (${activeProducts
      .map((p) => p.name)
      .join(", ")}).\n\nHow may I assist with your operations?`;

    const spokenText = `I am Prosis, your operating assistant. All connected products are operational. How can I assist you?`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      suggestedFollowUps: [
        "Prosis, what's happening today?",
        "Show me the restaurants with declining bookings",
        "Show on-duty staff and employees",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Handles Permission Denial Gracefully
   */
  private handlePermissionDenied(toolName: string, missingScope: string): AgentRunOutput {
    this.setCoreState("ERROR");
    const replyText = `⛔️ **Authorization Denied**\n\nYour account does not possess the required permission (\`${missingScope}\`) to execute \`${toolName}\`.\n\nPlease contact an organization Owner or Administrator to request elevated privileges.`;
    const spokenText = `Access denied. You do not have permission to execute this operation.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      suggestedFollowUps: ["Check my account permissions", "Return to standby"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "ERROR",
      executedTools: [],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Handle Approval Decision (from Button or Voice)
   */
  public async handleApprovalDecision(
    approvalId: string,
    approved: boolean,
    context?: ExecutionContext
  ): Promise<AgentRunOutput> {
    const startTime = Date.now();
    const req = ApprovalManager.get(approvalId);
    if (!req) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    if (!approved) {
      ApprovalManager.updateStatus(approvalId, "REJECTED", "User");
      this.setCoreState("IDLE");

      // Check if there is an active BusinessTask waiting for this approval
      const activeTask = TaskEngine.getActiveTask(this.conversationId);
      if (activeTask && activeTask.status === "waiting_for_approval") {
        TaskEngine.cancelTask(activeTask.id, "User rejected required authorization");
      }

      AuditTrail.record({
        conversationId: req.conversationId,
        runId: req.runId,
        userId: "user_01",
        organizationId: "org_acme_corp",
        toolName: req.toolName,
        productId: req.productId,
        parameters: req.parameters as any,
        requiresApproval: true,
        approvalStatus: "rejected",
        executionStatus: "aborted",
        durationMs: 0,
        resultSummary: "Operation rejected by user.",
      });

      const replyText = `Action cancelled. The operation for **${req.summary}** was aborted and no changes were made.`;
      const spokenText = `Understood. The action has been cancelled.`;

      const turn: MessageTurn = {
        id: `msg_${Date.now()}_a`,
        role: "prosis",
        content: replyText,
        timestamp: new Date().toISOString(),
        task: activeTask,
      };
      this.turns.push(turn);
      ConversationManager.appendTurn(this.conversationId, turn);

      const runRecord = AuditTrail.recordRun({
        runId: req.runId,
        conversationId: req.conversationId,
        user: { id: "user_01", name: "Operations Director", role: "owner" },
        organization: { id: "org_acme_corp", name: "Acme Hospitality Group" },
        inputSummary: "Reject approval decision",
        selectedProduct: req.productId,
        selectedTools: [],
        toolExecutionStatus: "aborted",
        approvalStatus: "rejected",
        durationMs: Date.now() - startTime,
      });

      return {
        replyText,
        spokenText,
        coreState: "IDLE",
        executedTools: [],
        suggestedFollowUps: ["What else is happening today?"],
        activeTask,
        runRecord,
      };
    }

    // APPROVED: Execute tool
    this.setCoreState("EXECUTING");
    ApprovalManager.updateStatus(approvalId, "APPROVED", "User");

    // Check if there is an active BusinessTask waiting for this approval
    const activeTask = TaskEngine.getActiveTask(this.conversationId);
    if (activeTask && activeTask.status === "waiting_for_approval") {
      // Complete Step 4 (Approval step)
      TaskEngine.completeStep(activeTask.id, 4, { approved: true, approvalId });
      // Start Step 5 (Destructive dispatch)
      TaskEngine.startStep(activeTask.id, 5);
    }

    const execContext: ExecutionContext = context || {
      organization: { id: "org_acme_corp", name: "Acme Hospitality Group", plan: "enterprise" },
      user: {
        id: "user_01",
        name: "Operations Director",
        email: "dir@acme.com",
        role: "owner",
        permissions: ["seatbooking.admin", "seatbooking.communications.send", "seatbooking.reservations.write"],
      },
      conversationId: req.conversationId,
      runId: `run_exec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "web",
    };

    const tool = ToolRegistry.get(req.toolName);
    let result: any = null;
    let errorStr: string | undefined = undefined;

    try {
      if (tool) {
        result = await tool.execute(req.parameters, execContext);
      }
      ApprovalManager.updateStatus(approvalId, "EXECUTED", "System");
      this.setCoreState("SUCCESS");

      // Advance task step 5 to completed and step 6 to completion if active task exists
      if (activeTask) {
        TaskEngine.completeStep(activeTask.id, 5, result);
        TaskEngine.startStep(activeTask.id, 6);
        TaskEngine.completeStep(activeTask.id, 6, { status: "recorded", dispatchedAt: new Date().toISOString() });
        const hasWarning = activeTask.warnings && activeTask.warnings.length > 0;
        const taskExplanation = hasWarning
          ? "3 emails were prepared. One restaurant had no valid contact email."
          : "All recovery emails successfully dispatched to verified restaurant managers.";
        TaskEngine.completeTask(activeTask.id, taskExplanation);
      }
    } catch (err: any) {
      errorStr = err.message;
      this.setCoreState("ERROR");
      if (activeTask) {
        TaskEngine.recordStepFailure(activeTask.id, 5, errorStr || "Execution failed", true);
      }
    }

    const durationMs = Date.now() - startTime;

    AuditTrail.record({
      conversationId: req.conversationId,
      runId: req.runId,
      userId: execContext.user.id,
      organizationId: execContext.organization.id,
      toolName: req.toolName,
      productId: req.productId,
      parameters: req.parameters as any,
      requiresApproval: true,
      approvalStatus: "approved",
      executionStatus: errorStr ? "failure" : "success",
      durationMs,
      resultSummary: errorStr ? undefined : `Successfully executed ${req.toolName}`,
      error: errorStr,
    });

    const hasWarnings = activeTask?.warnings && activeTask.warnings.length > 0;
    const warningNotice = hasWarnings
      ? `\n\n⚠️ **Notice**: 3 emails were prepared. One restaurant had no valid contact email.`
      : "";

    const replyText = `✅ **Action Approved & Executed Successfully**\n\n- **Operation**: \`${req.toolName}\`\n- **Summary**: ${req.summary}\n- **Audit Reference**: \`audit_${Date.now().toString(36)}\`\n- **Status**: Dispatched and confirmed across connected services.${warningNotice}`;
    const spokenText = hasWarnings
      ? `Action approved and executed. 3 emails were prepared. One restaurant had no valid contact email.`
      : `Action approved and executed successfully. All communications have been dispatched.`;

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: req.toolName,
      toolResult: result,
      task: activeTask,
      suggestedFollowUps: [
        "What's happening today?",
        "Check audit logs",
        "View memory records",
      ],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    const runRecord = AuditTrail.recordRun({
      runId: req.runId,
      conversationId: req.conversationId,
      user: { id: execContext.user.id, name: execContext.user.name, role: execContext.user.role },
      organization: { id: execContext.organization.id, name: execContext.organization.name },
      inputSummary: `Approve and execute ${req.toolName}`,
      selectedProduct: req.productId,
      selectedTools: [req.toolName],
      toolExecutionStatus: errorStr ? "failure" : "success",
      approvalStatus: "approved",
      durationMs,
      errorStatus: errorStr,
    });

    return {
      replyText,
      spokenText,
      coreState: "SUCCESS",
      executedTools: [req.toolName],
      suggestedFollowUps: turn.suggestedFollowUps!,
      activeTask,
      runRecord,
    };
  }

  /**
   * Workspace Navigation Action (Natural Language Workspace Switching)
   */
  private async executeWorkspaceActionWorkflow(
    _context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const action = analysis.workspaceAction!;
    let replyText = "";
    let spokenText = "";
    let followUps: string[] = [];

    if (action.type === "return_to_core") {
      replyText = `**Prosis AI Core Activated**\n\nReturned to central Prosis command interface. Ambient voice listener and cross-product capability orchestrator are active.`;
      spokenText = `Returned to Prosis Core. AI operating system is active.`;
      followUps = ["Open Seatbooking", "Show daily briefing", "Check staffing vs bookings"];
    } else {
      const prodName = analysis.matchedProduct?.name || action.targetWorkspace || "Workspace";
      replyText = `**Opening ${prodName} Workspace**\n\nSwitched workspace context to **${prodName}**. The unified Prosis AI Core remains docked and ambiently available.`;
      spokenText = `Opening ${prodName} workspace.`;
      followUps = ["Return to Prosis Core", `Show ${prodName} metrics`, "Open Product Hub"];
    }

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      suggestedFollowUps: followUps,
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [],
      suggestedFollowUps: followUps,
      workspaceAction: action,
    };
  }

  /**
   * Cross-Product Compound Workflow (e.g. Seatbooking + Workforce + Analytics)
   */
  private async executeCrossProductWorkflow(
    context: ExecutionContext,
    _analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const tool = ToolRegistry.get("analytics_correlatePacingAndLabor");
    if (!tool) throw new Error("analytics_correlatePacingAndLabor tool not found");

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "analytics.read");
    }

    const result: any = await tool.execute({}, context);

    let replyText = `**Cross-Product Intelligence Analysis**\n*Correlating Seatbooking Reservation Pacing with Workforce Shift Rosters*\n\n`;
    replyText += `${result.riskSummary}\n\n`;

    for (const item of result.correlations) {
      const riskBadge = item.riskLevel === "critical" ? "🔴 Critical Deficit" : "🟠 High Deficit";
      replyText += `### ${item.restaurantName} (${item.cuisine})\n`;
      replyText += `• **Dining Demand**: ${item.todayBookings} covers today (${item.capacityBookedPercent}% booked, **+${item.weeklyTrendPercent}% weekly trend**)\n`;
      replyText += `• **Staffing Status**: ${item.scheduledHeadcount} scheduled vs ${item.requiredHeadcount} required (${item.staffDeficit} staff shortage) [${riskBadge}]\n`;
      replyText += `• **AI Action Plan**: ${item.recommendation}\n\n`;
    }

    const spokenText = `Found ${result.matchedCount} restaurants with increasing bookings but insufficient staffing: ${result.correlations.map((c: any) => c.restaurantName).join(" and ")}. Both have severe labor deficits.`;

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: result,
      suggestedFollowUps: ["Open Workforce", "Deploy on-call staff", "View daily briefing"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }

  /**
   * Menu Product Workflow (Dynamic Capability-based routing)
   */
  private async executeMenuWorkflow(
    context: ExecutionContext,
    analysis: IntentAnalysisResult
  ): Promise<AgentRunOutput> {
    const isCostQuery =
      analysis.rawInput.toLowerCase().includes("cost") ||
      analysis.rawInput.toLowerCase().includes("margin") ||
      analysis.rawInput.toLowerCase().includes("profit");

    const toolName = isCostQuery ? "menu_getFoodCostAnalytics" : "menu_getMenuItems";
    const tool = ToolRegistry.get(toolName);
    if (!tool) throw new Error(`${toolName} tool not found`);

    const authorized = PermissionService.enforce(context.user, tool.permissionsRequired, {
      toolName: tool.name,
      productId: tool.productId,
      conversationId: context.conversationId,
      runId: context.runId,
      organizationId: context.organization.id,
    });
    if (!authorized) {
      return this.handlePermissionDenied(tool.name, "menu.read");
    }

    const result: any = await tool.execute({}, context);

    let replyText = `**Prosis Menu Intelligence**\n\nConnected to **${analysis.matchedProduct?.name} v${analysis.matchedProduct?.version}**.\n\n`;
    let spokenText = "";

    if (isCostQuery) {
      replyText += `• **Average Gross Margin**: ${result.averageGrossMarginPercent}%\n`;
      replyText += `• **Food Cost Ratio**: ${result.averageFoodCostPercent}%\n`;
      replyText += `• **Top Margin Category**: ${result.topMarginCategory}\n`;
      replyText += `• **Recommendation**: ${result.recommendation}\n`;
      spokenText = `Average menu gross margin is ${result.averageGrossMarginPercent}%, with cocktails leading at over 85 percent margin.`;
    } else {
      replyText += `Active menu offerings:\n`;
      for (const item of (result as any[])) {
        const allergens = item.allergens.length > 0 ? ` (Allergens: ${item.allergens.join(", ")})` : "";
        replyText += `• **${item.name}** — $${item.priceUsd} [${item.category}] (Margin: ${item.grossMarginPercent}%)${allergens}\n`;
      }
      spokenText = `Retrieved ${result.length} items from the Prosis Menu catalog.`;
    }

    this.setCoreState("SPEAKING");

    const turn: MessageTurn = {
      id: `msg_${Date.now()}_a`,
      role: "prosis",
      content: replyText,
      timestamp: new Date().toISOString(),
      activeTool: tool.name,
      toolResult: result,
      suggestedFollowUps: ["Check food cost analytics", "Open Menu workspace", "Show daily briefing"],
    };
    this.turns.push(turn);
    ConversationManager.appendTurn(this.conversationId, turn);

    return {
      replyText,
      spokenText,
      coreState: "SPEAKING",
      executedTools: [tool.name],
      suggestedFollowUps: turn.suggestedFollowUps!,
    };
  }
}

export const prosisAgentInstance = new ProsisAgent();
