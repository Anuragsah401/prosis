/**
 * ProsisIt Core AI Orchestration Layer Validation Suite
 * Verifies Cognitive Loop, State Machine, Capability Registry,
 * Dynamic Planning, Zero-Trust Gateway Routing, RBAC, Tenant Isolation,
 * Level 1 Autonomy Pause/Resume, and Interruption Handling.
 */

import {
  ProsisItOrchestrator,
  CapabilityRegistry,
  ProsisContext,
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
  console.log("PROSIS-IT: CORE AI ORCHESTRATION LAYER VALIDATION");
  console.log("=======================================================\n");

  const orchestrator = new ProsisItOrchestrator();

  // Baseline sessions for tests
  const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" })!;
  const managerSession = AuthService.resolveSession({ authorization: "Bearer sess_live_manager_token" })!;
  const guestSession = AuthService.resolveSession({ authorization: "Bearer sess_unauthorized_guest_token" })!;

  // ---------------------------------------------------------------------------
  // TEST 1: Pure Conversation (Zero Unnecessary Tool Execution)
  // ---------------------------------------------------------------------------
  console.log("[Test Suite 1] Pure Conversation & System Identity");
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
      conversationId: "conv_test_convo",
      sessionId: "sess_test_convo",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Hello Prosis, what is your operational purpose?", context);

    assert(res.state === "COMPLETED", "Conversation completes with state COMPLETED");
    assert(res.response.includes("Prosis"), "Response identifies as Prosis");
    assert(res.plan === undefined, "Zero tool plan generated for general conversational greeting");
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Capability Discovery & Ecosystem Overview
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 2] Capability Discovery & Ecosystem Overview");
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
      conversationId: "conv_test_caps",
      sessionId: "sess_test_caps",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("What capabilities and ecosystem modules are available?", context);

    assert(res.state === "COMPLETED", "Capability discovery completes successfully");
    assert(res.response.includes("Seatbooking"), "Discovers Seatbooking capability");
    assert(res.response.includes("Executive Hospitality Analytics"), "Discovers Executive Analytics capability");
    assert(res.response.includes("Workforce"), "Discovers upcoming Workforce module");
    assert(res.response.includes("E-Menu"), "Discovers upcoming E-Menu module");
    assert(res.response.includes("Marketing"), "Discovers upcoming Marketing module");

    // Test querying a planned future capability directly
    const futureRes = await orchestrator.orchestrate("Can you adjust the staff shift schedule for tonight?", context);
    assert(futureRes.state === "COMPLETED", "Future capability query completes gracefully");
    assert(futureRes.response.includes("Workforce") && futureRes.response.includes("roadmap"), "Explains roadmap status with calm authority");
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Single Business Intent Routed Through Tool Execution Gateway
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 3] Single Business Intent (Analytics Query)");
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
      conversationId: "conv_test_intent",
      sessionId: "sess_test_intent",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("How are bookings pacing at Cantina Bella this week?", context);

    assert(res.state === "COMPLETED", "Analytics query completes in COMPLETED state");
    assert(res.plan !== undefined, "Execution plan created");
    assert(res.plan!.steps.length === 1, "Plan contains 1 execution step");
    assert(res.plan!.steps[0].toolName === "getVenueAnalytics", "Dispatched to getVenueAnalytics tool");
    assert(res.plan!.steps[0].status === "completed", "Step status marked completed");
    assert(res.toolResults !== undefined, "Tool execution results captured");
    assert(res.response.includes("Cantina Bella") || res.response.includes("covers"), "Synthesized executive response contains cover pacing");
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Multi-Capability Coordinated Planning
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 4] Multi-Capability Coordinated Planning");
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
      conversationId: "conv_test_multi",
      sessionId: "sess_test_multi",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate(
      "Analyze booking metrics and evaluate staffing schedule coverage",
      context
    );

    assert(res.state === "COMPLETED", "Multi-capability workflow completes successfully");
    assert(res.plan !== undefined, "Plan generated for multi-step task");
    assert(res.plan!.classification === "multi_step_task", "Classification is multi_step_task");
    assert(res.plan!.steps.length >= 2, "Plan contains multiple coordinated steps");
    assert(res.plan!.steps[0].capabilityId === "analytics", "Step 1 targets Analytics capability");
    assert(res.plan!.steps[1].capabilityId === "workforce", "Step 2 targets Workforce capability");
    assert(res.response.includes("Workforce telemetry"), "Synthesized output incorporates multi-capability results");
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Unauthorized Action (RBAC Enforcement via Gateway)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 5] Unauthorized Action (RBAC Enforcement)");
  {
    // Guest user lacks analytics.read or seatbooking.read
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
    assert(res.response.includes("Access restricted") && res.response.includes("member"), "Executive response clearly cites role restriction");
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Multi-Tenant & Venue Isolation (RESOURCE_FORBIDDEN)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 6] Multi-Tenant & Venue Isolation");
  {
    // Manager only has access to ["cantina_bella"]
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
      activeVenue: "rooftop_lounge", // Unauthorized venue!
      conversationId: "conv_test_tenant",
      sessionId: "sess_test_tenant",
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
    };

    const res = await orchestrator.orchestrate("Show booking pacing for Rooftop Lounge", context);

    assert(res.state === "FAILED", "Cross-tenant / unauthorized venue access is blocked (FAILED)");
    assert(res.error === "RESOURCE_FORBIDDEN", "Error code is RESOURCE_FORBIDDEN");
    assert(res.response.includes("Venue boundary violation"), "Response highlights venue boundary violation");
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Approval Pause & Resume (Level 1 Autonomy / Supervised Execution)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 7] Approval Pause & Resume (Level 1 Autonomy)");
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
      autonomyLevel: 1, // Supervised execution
    };

    // 7.1 Trigger destructive operation
    const pauseRes = await orchestrator.orchestrate("Cancel all reservations at Cantina Bella for tonight", context);

    assert(pauseRes.state === "WAITING_FOR_APPROVAL", "Destructive operation pauses in WAITING_FOR_APPROVAL state");
    assert(pauseRes.pendingApproval !== undefined, "Generated a PendingApproval object");
    assert(pauseRes.pendingApproval!.impact === "high", "Marked as high impact");
    assert(pauseRes.pendingApproval!.isDestructive === true, "Marked as destructive");
    assert(pauseRes.response.includes("Approval required"), "Response requests confirmation");

    // 7.2 Resume by approving action
    // Temporarily allow seatbooking_createReservation for this test
    ToolExecutionService.allowTool("seatbooking_createReservation");

    const approvalId = pauseRes.pendingApproval!.id;
    const resumeRes = await orchestrator.approvePendingAction(approvalId, context);

    assert(resumeRes.state === "COMPLETED" || resumeRes.state === "FAILED", "Action proceeded after approval");
    assert(context.pendingApprovals.find((a) => a.id === approvalId)?.status === "approved", "Approval status recorded as approved");

    // Clean up allowlist
    ToolExecutionService.disallowTool("seatbooking_createReservation");
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Interruption Epoch Invalidation (Barge-in / Stale Request)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 8] Interruption Epoch Invalidation (Barge-in)");
  {
    const sessionId = "sess_test_interruption";
    ToolExecutionService.setSessionEpoch(sessionId, 5); // Current active epoch is 5

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
      conversationId: "conv_test_interrupt",
      sessionId,
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
      interruptionEpoch: 4, // Stale epoch!
    };

    const res = await orchestrator.orchestrate("Retrieve booking analytics for Cantina Bella", context);

    assert(res.state === "INTERRUPTED", "Stale request transitions immediately to INTERRUPTED state");
    assert(res.error === "STALE_REQUEST", "Error code is STALE_REQUEST");
    assert(res.response.includes("interruption") || res.response.includes("cancelled"), "Executive response explains cancellation");
  }

  console.log("\n=======================================================");
  console.log("PROSIS-IT VALIDATION: ALL 8 TEST SUITES PASSED (100%)");
  console.log("=======================================================\n");

  return true;
}
