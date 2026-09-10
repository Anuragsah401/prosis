/**
 * @prosis/orchestrator - Agent Router & Dynamic Capability Matching
 * @deprecated Legacy REST & Typed Chat Intent Router.
 * IMPORTANT: This class is strictly isolated from the Realtime AI voice pipeline (@openai/agents/realtime).
 * The realtime voice system communicates directly with OpenAI Realtime via WebRTC and must NEVER invoke this router.
 * This router remains active exclusively for legacy typed chat and historical scenario tests.
 */

import { ProductRegistry, ProductManifest, ProductCapability } from "../sdk";
import { ToolRegistry, ToolDefinition } from "../tools";
import { CapabilityDiscoveryEngine, CapabilityDiscoveryResult } from "./capability-discovery";
import { ApprovalManager } from "./approval-manager";

export interface IntentAnalysisResult {
  rawInput: string;
  intentCategory:
    | "briefing"
    | "proactive_briefing"
    | "investigate_anomaly"
    | "autonomy_management"
    | "comparison_query"
    | "email_action"
    | "analytics_query"
    | "reservation_management"
    | "restaurant_query"
    | "customer_query"
    | "workforce_management"
    | "menu_query"
    | "marketing_campaign"
    | "cross_product_operation"
    | "workspace_action"
    | "multi_step_recovery"
    | "policy_knowledge"
    | "approval_decision"
    | "general_inquiry";
  targetEntities: {
    restaurantId?: string;
    restaurantName?: string;
    reservationId?: string;
    customerName?: string;
    customerEmail?: string;
    employeeName?: string;
    date?: string;
    timeSlot?: string;
    partySize?: number;
    action?: "create" | "update" | "cancel" | "query";
    anomalyId?: string;
    requestedAutonomyLevel?: number;
  };
  matchedProduct?: ProductManifest;
  matchedCapability?: ProductCapability;
  participatingProducts?: ProductManifest[];
  candidateTools: ToolDefinition[];
  workspaceAction?: CapabilityDiscoveryResult["workspaceAction"];
  isCrossProduct?: boolean;
  crossProductContext?: CapabilityDiscoveryResult["crossProductContext"];
  requiresKnowledgeRetrieval: boolean;
  requiresMultiStepPlan: boolean;
  isApprovalDecision: boolean;
  approvalApproved?: boolean;
  isAmbiguous?: boolean;
}

export class AgentRouter {
  /**
   * Main routing analysis: determines intent, product relevance, and required tools dynamically.
   */
  public static analyze(
    input: string,
    activeProductId?: string,
    hasPendingApproval = false
  ): IntentAnalysisResult {
    const normalized = input.trim().toLowerCase();

    // 1. Check for approval confirmation or rejection
    const hasActivePending = hasPendingApproval || ApprovalManager.getPending().length > 0;
    if (hasActivePending) {
      const isAffirmative =
        /^(yes|proceed|approve|confirm|send it|do it|go ahead|authorized|yep|sure)/i.test(normalized) ||
        normalized.includes("yes, proceed") ||
        normalized.includes("approve") ||
        normalized.includes("go ahead") ||
        normalized.includes("prosis, go ahead");

      const isNegative =
        /^(no|cancel|abort|reject|stop|don't|deny|wait)/i.test(normalized) ||
        normalized.includes("no, abort") ||
        normalized.includes("reject") ||
        normalized.includes("cancel task");

      if (isAffirmative || isNegative) {
        return {
          rawInput: input,
          intentCategory: "approval_decision",
          targetEntities: {},
          candidateTools: [],
          requiresKnowledgeRetrieval: false,
          requiresMultiStepPlan: false,
          isApprovalDecision: true,
          approvalApproved: isAffirmative,
        };
      }
    }

    // 2. Dynamic Discovery via CapabilityDiscoveryEngine (No huge hardcoded if/else)
    const discovery = CapabilityDiscoveryEngine.discover(input, activeProductId);

    // 2a. Workspace Navigation Actions ("Open Seatbooking", "Go back to Prosis", etc.)
    if (discovery.workspaceAction) {
      return {
        rawInput: input,
        intentCategory: "workspace_action",
        targetEntities: {},
        matchedProduct: discovery.primaryProduct,
        participatingProducts: discovery.participatingProducts,
        candidateTools: discovery.candidateTools,
        workspaceAction: discovery.workspaceAction,
        requiresKnowledgeRetrieval: false,
        requiresMultiStepPlan: false,
        isApprovalDecision: false,
      };
    }

    // 2b. Cross-Product Compound Operations (e.g. Seatbooking + Workforce + Analytics)
    if (discovery.isCrossProduct) {
      return {
        rawInput: input,
        intentCategory: "cross_product_operation",
        targetEntities: {},
        matchedProduct: discovery.primaryProduct,
        participatingProducts: discovery.participatingProducts,
        candidateTools: discovery.candidateTools,
        isCrossProduct: true,
        crossProductContext: discovery.crossProductContext,
        requiresKnowledgeRetrieval: false,
        requiresMultiStepPlan: false,
        isApprovalDecision: false,
      };
    }

    // 3. Check for multi-step task trigger
    const isMultiStepRecovery =
      (normalized.includes("declined") || normalized.includes("declining") || normalized.includes("drop")) &&
      (normalized.includes("email") || normalized.includes("campaign") || normalized.includes("follow-up") || normalized.includes("prepare"));

    // 4. Check for knowledge/policy queries
    const requiresKnowledge =
      normalized.includes("policy") ||
      normalized.includes("sop") ||
      normalized.includes("protocol") ||
      normalized.includes("rule") ||
      normalized.includes("guideline") ||
      normalized.includes("threshold") ||
      normalized.includes("cancellation fee");

    // 5. Dynamic Product Capability Matching
    const products = ProductRegistry.getActive();
    let bestProduct: ProductManifest | undefined = discovery.primaryProduct;
    let bestCapability: ProductCapability | undefined = discovery.primaryCapability;
    let highestScore = 0;

    // Tokenize query
    const tokens = normalized.split(/[^a-z0-9_]+/).filter((t) => t.length > 2);

    for (const prod of products) {
      for (const cap of prod.capabilities) {
        let score = 0;
        const capText = `${prod.name} ${prod.description} ${cap.name} ${cap.description} ${cap.operations.join(" ")}`.toLowerCase();

        for (const token of tokens) {
          if (capText.includes(token)) {
            score += 1.5;
          }
        }

        // Domain-specific synonym boosts
        if (
          (cap.id.includes("reservation") || cap.id.includes("restaurant")) &&
          (normalized.includes("table") ||
            normalized.includes("booking") ||
            normalized.includes("bookings") ||
            normalized.includes("cover") ||
            normalized.includes("covers") ||
            normalized.includes("reservation") ||
            normalized.includes("reservations") ||
            normalized.includes("seat") ||
            normalized.includes("restaurant") ||
            normalized.includes("restaurants") ||
            normalized.includes("dining"))
        ) {
          score += 4.0;
        }

        if (
          (cap.id.includes("customer") || cap.id.includes("crm")) &&
          (normalized.includes("customer") ||
            normalized.includes("guest") ||
            normalized.includes("vip") ||
            normalized.includes("dietary"))
        ) {
          score += 3.5;
        }

        if (
          (cap.id.includes("employee") || cap.id.includes("workforce") || cap.id.includes("shift")) &&
          (normalized.includes("employee") ||
            normalized.includes("shift") ||
            normalized.includes("staff") ||
            normalized.includes("worker") ||
            normalized.includes("schedule") ||
            normalized.includes("payroll"))
        ) {
          score += 4.0;
        }

        if (
          (cap.id.includes("marketing") || cap.id.includes("campaign")) &&
          (normalized.includes("campaign") ||
            normalized.includes("newsletter") ||
            normalized.includes("broadcast") ||
            normalized.includes("marketing") ||
            normalized.includes("audience"))
        ) {
          score += 4.0;
        }

        if (score > highestScore) {
          highestScore = score;
          bestProduct = prod;
          bestCapability = cap;
        }
      }
    }

    // Context-driven product inference:
    // If active product context is set (e.g. seatbooking), boost or fallback to that product
    if (activeProductId) {
      const activeProd = ProductRegistry.get(activeProductId);
      if (activeProd) {
        if (!bestProduct || highestScore < 2) {
          bestProduct = activeProd;
        }
      }
    }

    if (!bestProduct && products.length > 0) {
      bestProduct = products[0];
    }

    // 5. Candidate Tool Identification
    const candidateTools: ToolDefinition[] = [];
    if (bestProduct) {
      const productTools = ToolRegistry.getByProduct(bestProduct.id);
      candidateTools.push(...productTools);
    }

    // 6. Entity Extraction
    const targetEntities: IntentAnalysisResult["targetEntities"] = {};

    // Date extraction: "tomorrow", "today", or specific dates
    if (normalized.includes("tomorrow")) {
      targetEntities.date = "Tomorrow";
    } else if (normalized.includes("today")) {
      targetEntities.date = "Today";
    }

    // Reservation ID (e.g., "res-901")
    const resIdMatch = input.match(/\b(res-\d+)\b/i);
    if (resIdMatch) {
      targetEntities.reservationId = resIdMatch[1];
    }

    // Party size (e.g., "party of 4", "4 guests", "4 people")
    const partyMatch = input.match(/(?:party of|party|for)\s+(\d+)|(\d+)\s+(?:guests|people|covers|seats)/i);
    if (partyMatch) {
      targetEntities.partySize = parseInt(partyMatch[1] || partyMatch[2], 10);
    }

    // Time slot (e.g., "19:30", "7:30pm", "20:00")
    const timeMatch = input.match(/\b(\d{1,2}:\d{2})\b/);
    if (timeMatch) {
      targetEntities.timeSlot = timeMatch[1];
    }

    // Customer names
    if (normalized.includes("john smith")) {
      targetEntities.customerName = "John Smith";
      targetEntities.customerEmail = "john.smith@acme-global.com";
    } else if (normalized.includes("sarah lin")) {
      targetEntities.customerName = "Sarah Lin";
      targetEntities.customerEmail = "sarah.lin@creatives.co";
    } else if (normalized.includes("arthur pendelton") || normalized.includes("pendelton")) {
      targetEntities.customerName = "Arthur Pendelton";
      targetEntities.customerEmail = "pendelton@capitalgroup.org";
    } else if (normalized.includes("elena rostova")) {
      targetEntities.customerName = "Dr. Elena Rostova";
      targetEntities.customerEmail = "elena.rostova@neurotech.io";
    } else {
      const customerMatch = input.match(/(?:for|guest|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (customerMatch) {
        targetEntities.customerName = customerMatch[1];
      }
    }

    // Restaurant detection
    if (normalized.includes("cantina bella")) {
      targetEntities.restaurantName = "Cantina Bella";
      targetEntities.restaurantId = "rest-02";
    } else if (normalized.includes("verdant bistro")) {
      targetEntities.restaurantName = "Verdant Bistro";
      targetEntities.restaurantId = "rest-03";
    } else if (normalized.includes("atelier lumiere") || normalized.includes("l'atelier lumiere")) {
      targetEntities.restaurantName = "L'Atelier Lumière";
      targetEntities.restaurantId = "rest-01";
    } else if (normalized.includes("kuro omakase") || normalized.includes("kuro")) {
      targetEntities.restaurantName = "Kuro Omakase";
      targetEntities.restaurantId = "rest-04";
    } else if (normalized.includes("aura rooftop") || /\baura\b/.test(normalized)) {
      targetEntities.restaurantName = "Aura Rooftop Lounge";
      targetEntities.restaurantId = "rest-05";
    }

    // Action detection
    if (normalized.includes("cancel") || normalized.includes("void")) {
      targetEntities.action = "cancel";
    } else if (
      normalized.includes("create") ||
      normalized.includes("book a") ||
      normalized.includes("make a reservation") ||
      normalized.includes("new reservation") ||
      normalized.includes("new booking") ||
      (/\bbook\b/i.test(normalized) &&
        !normalized.includes("show") &&
        !normalized.includes("view") &&
        !normalized.includes("get") &&
        !normalized.includes("list"))
    ) {
      targetEntities.action = "create";
    } else if (
      normalized.includes("update") ||
      normalized.includes("modify") ||
      normalized.includes("reschedule") ||
      normalized.includes("change")
    ) {
      targetEntities.action = "update";
    } else {
      targetEntities.action = "query";
    }

    // Determine category
    let intentCategory: IntentAnalysisResult["intentCategory"] = "general_inquiry";

    if (isMultiStepRecovery) {
      intentCategory = "multi_step_recovery";
    } else if (
      normalized.includes("three things need your attention") ||
      normalized.includes("proactive briefing") ||
      normalized.includes("what needs my attention") ||
      normalized.includes("what needs attention") ||
      normalized.includes("show anomalies") ||
      normalized.includes("proactive intelligence")
    ) {
      intentCategory = "proactive_briefing";
    } else if (normalized.includes("investigate")) {
      intentCategory = "investigate_anomaly";
      if (normalized.includes("cantina bella")) targetEntities.restaurantId = "rest-02";
      if (normalized.includes("verdant bistro")) targetEntities.restaurantId = "rest-03";
    } else if (
      normalized.includes("compare these two") ||
      normalized.includes("compare them") ||
      (normalized.includes("compare") &&
        (normalized.includes("cantina") ||
          normalized.includes("verdant") ||
          normalized.includes("restaurant") ||
          normalized.includes("two") ||
          normalized.includes("venues")))
    ) {
      intentCategory = "comparison_query";
    } else if (
      normalized.includes("email the owner") ||
      normalized.includes("email elena") ||
      normalized.includes("email marcus") ||
      normalized.includes("email manager") ||
      normalized.includes("email the manager") ||
      (normalized.startsWith("email ") && !normalized.includes("draft emails") && !normalized.includes("prepare email"))
    ) {
      intentCategory = "email_action";
    } else if (
      normalized.includes("autonomy") &&
      (normalized.includes("level") || normalized.includes("set") || normalized.includes("change"))
    ) {
      intentCategory = "autonomy_management";
      const levelMatch = normalized.match(/level\s*([0-4])/i);
      if (levelMatch) {
        targetEntities.requestedAutonomyLevel = parseInt(levelMatch[1], 10);
      }
    } else if (
      normalized.includes("briefing") ||
      normalized.includes("what's happening today") ||
      normalized.includes("what is happening today") ||
      normalized.includes("today's briefing")
    ) {
      intentCategory = "briefing";
    } else if (
      normalized.includes("restaurant performance") ||
      normalized.includes("show performance") ||
      normalized.includes("portfolio performance") ||
      normalized.includes("cancellation rate") ||
      normalized.includes("how many bookings did") ||
      normalized.includes("analytics for") ||
      normalized.includes("reservation analytics") ||
      normalized.includes("declining") ||
      normalized.includes("decreasing") ||
      normalized.includes("trends") ||
      normalized.includes("drop")
    ) {
      intentCategory = "analytics_query";
    } else if (
      (normalized.includes("restaurant") || normalized.includes("restaurants") || normalized.includes("venues")) &&
      (normalized.includes("show") || normalized.includes("list") || normalized.includes("get") || normalized.includes("all"))
    ) {
      intentCategory = "restaurant_query";
    } else if (
      normalized.includes("customer") ||
      normalized.includes("guest profile") ||
      normalized.includes("who is") ||
      normalized.includes("lookup guest")
    ) {
      intentCategory = "customer_query";
    } else if (
      targetEntities.action === "create" ||
      targetEntities.action === "update" ||
      targetEntities.action === "cancel" ||
      normalized.includes("reservation") ||
      normalized.includes("reservations") ||
      normalized.includes("booking") ||
      normalized.includes("bookings") ||
      normalized.includes("book") ||
      normalized.includes("table")
    ) {
      intentCategory = "reservation_management";
    } else if (bestProduct?.slug === "workforce") {
      intentCategory = "workforce_management";
    } else if (bestProduct?.slug === "marketing") {
      intentCategory = "marketing_campaign";
    } else if (bestProduct?.slug === "menu") {
      intentCategory = "menu_query";
    } else if (bestProduct?.slug === "analytics") {
      intentCategory = "analytics_query";
    } else if (requiresKnowledge) {
      intentCategory = "policy_knowledge";
    }

    return {
      rawInput: input,
      intentCategory,
      targetEntities,
      matchedProduct: bestProduct,
      matchedCapability: bestCapability,
      candidateTools,
      requiresKnowledgeRetrieval: requiresKnowledge,
      requiresMultiStepPlan: isMultiStepRecovery,
      isApprovalDecision: false,
    };
  }
}

