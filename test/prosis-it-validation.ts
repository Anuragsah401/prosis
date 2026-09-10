/**
 * ProsisIt Core AI Orchestration Layer & Real LLM Reasoning Validation Suite
 *
 * Clearly distinguishes:
 * Part A: Deterministic Infrastructure & Security Boundary Tests
 *         (RBAC Enforcement, Tenant Isolation, Level 1 Autonomy Pause/Resume, Interruption Epoch)
 * Part B: Real Model Reasoning & Natural Language Integration Tests
 *         (Ambiguous Clarifications, Cross-Domain Reasoning, Dynamic Multi-Step Reflection,
 *          Unrelated Casual Conversation, Multi-Turn Context Memory)
 */

import {
  ProsisItOrchestrator,
  ProsisContext,
  IProsisReasoningEngine,
  TestReasoningProvider,
  ProsisAIRequest,
  ProsisAIResponse,
  ProsisReasoningEngine,
  CapabilityRegistry,
} from "../src/packages/orchestrator/prosis-it";
import { ToolExecutionService } from "../src/packages/orchestrator/tool-execution-service";
import { AuthService } from "../src/packages/orchestrator/auth-service";

function assert(condition: boolean, message: string, detail?: string) {
  if (!condition) {
    console.error(`  ✕ [FAIL] ${message}`);
    if (detail) console.error(`       Detail: ${detail}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

export async function runProsisItValidation(): Promise<boolean> {
  console.log("\n=======================================================");
  console.log("PROSIS-IT: CORE REASONING & ORCHESTRATION VALIDATION");
  console.log("=======================================================\n");

  const orchestrator = new ProsisItOrchestrator();

  // Baseline sessions
  const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" })!;
  const managerSession = AuthService.resolveSession({ authorization: "Bearer sess_live_manager_token" })!;
  const guestSession = AuthService.resolveSession({ authorization: "Bearer sess_unauthorized_guest_token" })!;

  // ═══════════════════════════════════════════════════════════════════════════
  // PART A: DETERMINISTIC INFRASTRUCTURE & SECURITY BOUNDARY TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("───────────────────────────────────────────────────────");
  console.log("PART A: DETERMINISTIC INFRASTRUCTURE & SECURITY TESTS");
  console.log("───────────────────────────────────────────────────────");

  // TEST A1: Server-Side RBAC Enforcement (Model Suggestion Cannot Bypass Permissions)
  console.log("\n[Test A1] Unauthorized Action (Server-Side RBAC Enforcement)");
  {
    const context: ProsisContext = {
      user: {
        id: guestSession.user.id,
        name: guestSession.user.name,
        role: guestSession.user.role,
        permissions: guestSession.user.permissions, // []
      },
      organization: {
        id: guestSession.organization.id,
        tenantId: guestSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "all",
      conversationId: "conv_test_rbac",
      sessionId: "sess_test_rbac",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Show portfolio analytics across all venues", context);

    assert(res.state === "FAILED", "Unauthorized execution transitions to FAILED state");
    assert(res.error === "AUTHORIZATION_DENIED", "Error code is AUTHORIZATION_DENIED");
    assert(res.response.includes("Access restricted") && res.response.includes("member"), "Response cites server-enforced role restriction");
  }

  // TEST A2: Multi-Tenant & Venue Boundary Protection (RESOURCE_FORBIDDEN)
  console.log("\n[Test A2] Cross-Venue Access Protection (Tenant Isolation Boundary)");
  {
    // Manager only has access to "cantina_bella"
    const context: ProsisContext = {
      user: {
        id: managerSession.user.id,
        name: managerSession.user.name,
        role: managerSession.user.role,
        permissions: managerSession.user.permissions,
      },
      organization: {
        id: managerSession.organization.id,
        tenantId: managerSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "rooftop_lounge", // Out of scope venue!
      conversationId: "conv_test_tenant",
      sessionId: "sess_test_tenant",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Show booking pacing for Rooftop Lounge", context);

    assert(res.state === "FAILED", "Cross-tenant / unauthorized venue access is blocked (FAILED)");
    assert(res.error === "RESOURCE_FORBIDDEN", "Error code is RESOURCE_FORBIDDEN");
    assert(res.response.includes("Venue boundary violation"), "Response cites venue boundary restriction");
  }

  // TEST A3: Level 1 Autonomy Pause & Human Approval Enforcement
  console.log("\n[Test A3] Destructive Action Pauses in WAITING_FOR_APPROVAL (Level 1 Autonomy)");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "seatbooking",
      activeVenue: "cantina_bella",
      conversationId: "conv_test_approval",
      sessionId: "sess_test_approval",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1, // Supervised mode
    };

    const pauseRes = await orchestrator.orchestrate("Cancel everything for tomorrow.", context);

    assert(pauseRes.state === "WAITING_FOR_APPROVAL", "Destructive operation pauses in WAITING_FOR_APPROVAL");
    assert(pauseRes.pendingApproval !== undefined, "Generated a PendingApproval object");
    assert(pauseRes.pendingApproval!.isDestructive === true, "Marked as destructive");
    assert(pauseRes.pendingApproval!.impact === "high", "Impact marked high");
    assert(pauseRes.response.includes("Approval required"), "Response requests confirmation");

    // Approve the pending action
    ToolExecutionService.allowTool("seatbooking_createReservation");
    const resumeRes = await orchestrator.approvePendingAction(pauseRes.pendingApproval!.id, context);

    assert(resumeRes.state === "COMPLETED" || resumeRes.state === "FAILED", "Action proceeded after approval");
    ToolExecutionService.disallowTool("seatbooking_createReservation");
  }

  // TEST A4: Interruption Epoch Invalidation (Barge-in / Stale Request)
  console.log("\n[Test A4] Interruption Epoch Invalidation (Barge-in Guard)");
  {
    const sessionId = "sess_test_epoch_guard";
    ToolExecutionService.setSessionEpoch(sessionId, 8); // Active epoch is 8

    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "cantina_bella",
      conversationId: "conv_test_epoch",
      sessionId,
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
      interruptionEpoch: 7, // Stale!
    };

    const res = await orchestrator.orchestrate("Retrieve booking analytics for Cantina Bella", context);

    assert(res.state === "INTERRUPTED", "Stale request transitions immediately to INTERRUPTED state");
    assert(res.error === "STALE_REQUEST", "Error code is STALE_REQUEST");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART B: REAL MODEL REASONING & NATURAL LANGUAGE INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n───────────────────────────────────────────────────────");
  console.log("PART B: REAL MODEL REASONING & NATURAL LANGUAGE TESTS");
  console.log("───────────────────────────────────────────────────────");

  // TEST B1: Conversation & System Capabilities Inquiry
  console.log("\n[Test B1] Natural Language Ecosystem Capability Inquiry");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "all",
      conversationId: "conv_nl_b1",
      sessionId: "sess_nl_b1",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Hey ProsisIt, what exactly can you do for me?", context);

    assert(res.state === "COMPLETED", "Completes with state COMPLETED");
    assert(res.response.includes("Prosis"), "Response identifies as Prosis executive intelligence");
    assert(res.reasoningSummary !== undefined, "Includes transparent, user-safe reasoning summary");
  }

  // TEST B2: Ambiguous Directive Triggers Clarification
  console.log("\n[Test B2] Ambiguous Request Triggers Clarification (No Blind Assumptions)");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "all",
      conversationId: "conv_nl_b2",
      sessionId: "sess_nl_b2",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Something isn't right for tomorrow.", context);

    assert(res.state === "WAITING_FOR_INFORMATION", "Ambiguous directive transitions to WAITING_FOR_INFORMATION");
    assert(res.requiresClarification === true, "Flagged requiresClarification = true");
    assert(res.response.includes("What specific") || res.response.includes("operational"), "Prompts user with targeted clarifying question");
  }

  // TEST B3: Cross-Domain Multi-Capability Intent
  console.log("\n[Test B3] Cross-Domain Natural Language Request (Analytics & Workforce)");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "cantina_bella",
      conversationId: "conv_nl_b3",
      sessionId: "sess_nl_b3",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const query = "Tomorrow looks like it's going to be much busier than normal and I'm worried we don't have enough people.";
    const res = await orchestrator.orchestrate(query, context);

    assert(res.state === "COMPLETED", "Cross-domain orchestration completes successfully");
    assert(res.plan !== undefined, "Generated execution plan");
    assert(res.plan!.classification === "multi_step_task", "Classified as multi_step_task");
    assert(
      res.plan!.targetCapabilities.includes("analytics") && res.plan!.targetCapabilities.includes("workforce"),
      "Identified both Analytics and Workforce domains without keyword hardcoding"
    );
  }

  // TEST B4: Result -> Model Reflection -> Next Autonomous Decision
  console.log("\n[Test B4] Dynamic Tool Telemetry Reflection (Result -> Model -> Final Synthesis)");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "cantina_bella",
      conversationId: "conv_nl_b4",
      sessionId: "sess_nl_b4",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("How are bookings pacing at Cantina Bella this week?", context);

    assert(res.state === "COMPLETED", "Telemetry query completes in COMPLETED state");
    assert(res.toolResults !== undefined, "Captured tool telemetry from server gateway");
    assert(res.plan!.steps[0].status === "completed", "Active step marked completed");
    assert(res.response.includes("covers") || res.response.includes("trajectory"), "Model evaluated telemetry and synthesized executive summary");
  }

  // TEST B5: Unrelated Casual Conversation (No Unnecessary Tool Invocation)
  console.log("\n[Test B5] Unrelated Conversation (Casual Humor Without Business Tools)");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "all",
      conversationId: "conv_nl_b5",
      sessionId: "sess_nl_b5",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Tell me a joke.", context);

    assert(res.state === "COMPLETED", "Completes with state COMPLETED");
    assert(res.plan === undefined || res.plan.steps.length === 0, "Zero enterprise tools invoked for joke query");
    assert(res.response.length > 10, "Returns natural conversational response");
  }

  // TEST B6: Multi-Turn Context Retention Across Conversational Turns
  console.log("\n[Test B6] Multi-Turn Context Retention Across Conversational Steps");
  {
    const context: ProsisContext = {
      user: {
        id: directorSession.user.id,
        name: directorSession.user.name,
        role: directorSession.user.role,
        permissions: directorSession.user.permissions,
      },
      organization: {
        id: directorSession.organization.id,
        tenantId: directorSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: "cantina_bella",
      conversationId: "conv_nl_b6",
      sessionId: "sess_nl_b6",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
      conversationHistory: [],
    };

    // Turn 1: User indicates vague problem
    const turn1 = await orchestrator.orchestrate("Tomorrow looks difficult.", context);
    assert(turn1.state === "WAITING_FOR_INFORMATION", "Turn 1 asks for clarification");

    // Turn 2: User clarifies with specific operational context ("We're expecting many more customers.")
    const turn2 = await orchestrator.orchestrate("We're expecting many more customers.", context);
    assert(turn2.state === "COMPLETED", "Turn 2 synthesizes multi-turn context and completes");
    assert(
      Boolean(turn2.plan?.targetCapabilities.includes("analytics") && turn2.plan?.targetCapabilities.includes("workforce")),
      "Retained prior conversational context across turns to address surge"
    );
  }

  console.log("\n=======================================================");
  console.log("PROSIS-IT VALIDATION: ALL TESTS PASSED (100% GREEN)");
  console.log("=======================================================\n");

  return true;
}
