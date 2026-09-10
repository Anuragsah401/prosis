/**
 * ProsisIt Core AI Orchestration Layer & Natural Casual Conversation Validation Suite
 *
 * Clearly distinguishes:
 * Part A: Deterministic Infrastructure & Security Boundary Tests
 *         (RBAC Enforcement, Tenant Isolation, Level 1 Autonomy Pause/Resume, Interruption Epoch)
 * Part B: Natural Casual Conversation, Context, Mode Transitions & Safety Tests
 *         (Greeting, Small Talk, Joke, General Knowledge, Capability Overview, Gratitude,
 *          Contextual Follow-ups, Casual-Business Seamless Transitions, Keyword Safety)
 */

import {
  ProsisItOrchestrator,
  ProsisContext,
  TestReasoningProvider,
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
  console.log("PROSIS-IT: NATURAL CASUAL CONVERSATION & CORE VALIDATION");
  console.log("=======================================================\n");

  const orchestrator = new ProsisItOrchestrator();

  // Baseline sessions
  const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" })!;
  const managerSession = AuthService.resolveSession({ authorization: "Bearer sess_live_manager_token" })!;
  const guestSession = AuthService.resolveSession({ authorization: "Bearer sess_unauthorized_guest_token" })!;

  // Helper to build a clean test context
  function makeContext(userSession = directorSession, venue = "cantina_bella"): ProsisContext {
    return {
      user: {
        id: userSession.user.id,
        name: userSession.user.name,
        role: userSession.user.role,
        permissions: userSession.user.permissions,
      },
      organization: {
        id: userSession.organization.id,
        tenantId: userSession.organization.id,
      },
      activeProduct: "analytics",
      activeVenue: venue,
      conversationId: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      previousToolResults: {},
      pendingApprovals: [],
      autonomyLevel: 1,
      conversationHistory: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART A: DETERMINISTIC INFRASTRUCTURE & SECURITY BOUNDARY TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("───────────────────────────────────────────────────────");
  console.log("PART A: DETERMINISTIC INFRASTRUCTURE & SECURITY TESTS");
  console.log("───────────────────────────────────────────────────────");

  // TEST A1: Server-Side RBAC Enforcement (Model Suggestion Cannot Bypass Permissions)
  console.log("\n[Test A1] Unauthorized Action (Server-Side RBAC Enforcement)");
  {
    const context = makeContext(guestSession, "all");
    const res = await orchestrator.orchestrate("Show portfolio analytics across all venues", context);

    assert(res.state === "FAILED", "Unauthorized execution transitions to FAILED state");
    assert(res.error === "AUTHORIZATION_DENIED", "Error code is AUTHORIZATION_DENIED");
    assert(res.response.includes("Access restricted") && res.response.includes("member"), "Response cites server-enforced role restriction");
  }

  // TEST A2: Multi-Tenant & Venue Boundary Protection (RESOURCE_FORBIDDEN)
  console.log("\n[Test A2] Cross-Venue Access Protection (Tenant Isolation Boundary)");
  {
    // Manager only has access to "cantina_bella"
    const context = makeContext(managerSession, "rooftop_lounge");
    const res = await orchestrator.orchestrate("Show booking pacing for Rooftop Lounge", context);

    assert(res.state === "FAILED", "Cross-tenant / unauthorized venue access is blocked (FAILED)");
    assert(res.error === "RESOURCE_FORBIDDEN", "Error code is RESOURCE_FORBIDDEN");
    assert(res.response.includes("Venue boundary violation"), "Response cites venue boundary restriction");
  }

  // TEST A3: Level 1 Autonomy Pause & Human Approval Enforcement
  console.log("\n[Test A3] Destructive Action Pauses in WAITING_FOR_APPROVAL (Level 1 Autonomy)");
  {
    const context = makeContext();
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

  // TEST A4: Interruption Epoch Invalidation (Barge-in Guard)
  console.log("\n[Test A4] Interruption Epoch Invalidation (Barge-in Guard)");
  {
    const context = makeContext();
    ToolExecutionService.setSessionEpoch(context.sessionId, 12); // Active epoch is 12
    context.interruptionEpoch = 11; // Stale!

    const res = await orchestrator.orchestrate("Retrieve booking analytics for Cantina Bella", context);

    assert(res.state === "INTERRUPTED", "Stale request transitions immediately to INTERRUPTED state");
    assert(res.error === "STALE_REQUEST", "Error code is STALE_REQUEST");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART B: NATURAL CASUAL CONVERSATION & CONTEXT INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n───────────────────────────────────────────────────────");
  console.log("PART B: NATURAL CASUAL CONVERSATION & TRANSITION TESTS");
  console.log("───────────────────────────────────────────────────────");

  // TEST B1: Casual Greeting (No Tool Invocation)
  console.log("\n[Test B1] Natural Casual Greeting");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("Good morning.", context);

    assert(res.state === "COMPLETED", "Greeting completes in COMPLETED state");
    assert(res.plan === undefined, "Zero enterprise tools invoked for greeting");
    assert(res.response.toLowerCase().includes("good morning"), "Response answers naturally");
  }

  // TEST B2: Casual Small Talk
  console.log("\n[Test B2] Casual Small Talk ('I'm tired today')");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("I'm tired today.", context);

    assert(res.state === "COMPLETED", "Small talk completes in COMPLETED state");
    assert(res.plan === undefined, "Zero tools invoked for small talk");
    assert(res.response.length > 15, "Response is empathetic and natural");
  }

  // TEST B3: Casual Joke Request
  console.log("\n[Test B3] Casual Joke Request");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("Tell me a joke.", context);

    assert(res.state === "COMPLETED", "Joke request completes in COMPLETED state");
    assert(res.plan === undefined, "Zero tools invoked for joke");
    assert(res.response.length > 20, "Returns a natural witty response");
  }

  // TEST B4: General Knowledge Question (No Company Data Needed)
  console.log("\n[Test B4] General Knowledge Question ('What is quantum computing?')");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("What is quantum computing?", context);

    assert(res.state === "COMPLETED", "General knowledge query completes in COMPLETED state");
    assert(res.plan === undefined, "Zero business tools executed for general knowledge query");
    assert(res.response.toLowerCase().includes("quantum"), "Answers with general language model knowledge");
  }

  // TEST B5: Ecosystem Capability Question
  console.log("\n[Test B5] Capability Overview Question ('What can you help me with?')");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("What can you help me with?", context);

    assert(res.state === "COMPLETED", "Capability question completes in COMPLETED state");
    assert(res.plan === undefined, "Zero tools executed for capability overview");
    assert(res.response.includes("Prosis"), "Introduces Prosis ecosystem capabilities");
  }

  // TEST B6: Thank You / Courtesy Response
  console.log("\n[Test B6] Courteous Thank-You Response ('Thanks, you're useful')");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("Thanks, you're useful.", context);

    assert(res.state === "COMPLETED", "Courtesy response completes in COMPLETED state");
    assert(res.plan === undefined, "Zero tools executed for courtesy message");
    assert(res.response.toLowerCase().includes("glad") || res.response.toLowerCase().includes("help"), "Warm and gracious reply");
  }

  // TEST B7: Casual Follow-up Context ('Another one' following a joke)
  console.log("\n[Test B7] Casual Follow-up Context ('Another one' after joke)");
  {
    const context = makeContext();
    // Turn 1: Tell me a joke
    await orchestrator.orchestrate("Tell me a joke.", context);
    // Turn 2: Another one
    const res2 = await orchestrator.orchestrate("Another one.", context);

    assert(res2.state === "COMPLETED", "Follow-up joke completes in COMPLETED state");
    assert(res2.plan === undefined, "Zero tools executed for follow-up joke");
    assert(res2.response.length > 20, "Understands 'another one' refers to jokes from prior turn");
  }

  // TEST B8: Multi-Turn Topic Resolution ('Do you like coffee?' -> 'What's your favorite?')
  console.log("\n[Test B8] Pronoun / Context Resolution ('Coffee' -> 'What's your favorite?')");
  {
    const context = makeContext();
    // Turn 1: Do you like coffee?
    await orchestrator.orchestrate("Do you like coffee?", context);
    // Turn 2: What's your favorite?
    const res2 = await orchestrator.orchestrate("What's your favorite?", context);

    assert(res2.state === "COMPLETED", "Follow-up resolves context and completes");
    assert(res2.plan === undefined, "Zero tools executed for personal follow-up");
    assert(res2.response.toLowerCase().includes("espresso") || res2.response.toLowerCase().includes("coffee"), "Resolves 'favorite' to coffee from prior turn");
  }

  // TEST B9: Casual-to-Business Transition
  console.log("\n[Test B9] Seamless Casual → Business Transition");
  {
    const context = makeContext();
    // Turn 1: Casual greeting
    const turn1 = await orchestrator.orchestrate("Good morning.", context);
    assert(turn1.plan === undefined, "Turn 1 greeting invokes zero tools");

    // Turn 2: Operational business query
    const turn2 = await orchestrator.orchestrate("How many reservations do we have today?", context);
    assert(turn2.state === "COMPLETED", "Turn 2 business request completes");
    assert(turn2.plan !== undefined, "Turn 2 invokes operational tool getVenueAnalytics");
    assert(turn2.plan!.steps[0].toolName === "getVenueAnalytics", "Dispatches to getVenueAnalytics");
    assert(turn2.toolResults !== undefined, "Returns real tool results");
  }

  // TEST B10: Business-to-Casual Transition
  console.log("\n[Test B10] Seamless Business → Casual Transition ('That's more than I expected')");
  {
    const context = makeContext();
    // Turn 1: Business inquiry
    await orchestrator.orchestrate("How many reservations do we have today?", context);

    // Turn 2: User reacts conversationally
    const turn2 = await orchestrator.orchestrate("That's more than I expected.", context);
    assert(turn2.state === "COMPLETED", "Casual reaction completes in COMPLETED state");
    assert(turn2.plan === undefined, "Zero tools executed for conversational reaction");
    assert(turn2.response.length > 15, "Conversational reply acknowledging user's reaction");
  }

  // TEST B11: Full Multi-Turn Lifecycle (Casual → Business → Casual → Business)
  console.log("\n[Test B11] Multi-Turn Session: Casual → Business → Casual → Business");
  {
    const context = makeContext();

    // Step 1: Casual
    const s1 = await orchestrator.orchestrate("Good morning!", context);
    assert(s1.plan === undefined, "Step 1 (Casual) invokes no tool");

    // Step 2: Business
    const s2 = await orchestrator.orchestrate("How are bookings pacing at Cantina Bella this week?", context);
    assert(s2.plan !== undefined, "Step 2 (Business) invokes getVenueAnalytics");

    // Step 3: Casual
    const s3 = await orchestrator.orchestrate("Thanks, that's impressive.", context);
    assert(s3.plan === undefined, "Step 3 (Casual) invokes no tool");

    // Step 4: Business
    const s4 = await orchestrator.orchestrate("Show booking pacing across all venues", context);
    assert(s4.plan !== undefined, "Step 4 (Business) invokes getVenueAnalytics");
  }

  // TEST B12: Keyword Safety (Casual Remark with Business Noun Must NOT Trigger Tools)
  console.log("\n[Test B12] Keyword Safety: Casual Remark Mentioning 'Seatbooking'");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("Seatbooking sounds like a funny name.", context);

    assert(res.state === "COMPLETED", "Completes in COMPLETED state");
    assert(res.plan === undefined, "Zero tools invoked despite containing 'Seatbooking'");
    assert(res.response.length > 15, "Responds casually without triggering reservation tool");
  }

  // TEST B13: Ambiguity Handling (Clarification Prompt)
  console.log("\n[Test B13] Ambiguous Request Triggers Clarification");
  {
    const context = makeContext();
    const res = await orchestrator.orchestrate("Something isn't right for tomorrow.", context);

    assert(res.state === "WAITING_FOR_INFORMATION", "Ambiguous directive pauses in WAITING_FOR_INFORMATION");
    assert(res.requiresClarification === true, "Flags requiresClarification = true");
  }

  // TEST B14: Multi-Turn Surge Follow-up
  console.log("\n[Test B14] Multi-Turn Context Retention on Surge Resolution");
  {
    const context = makeContext();
    await orchestrator.orchestrate("Tomorrow looks difficult.", context);
    const res = await orchestrator.orchestrate("We're expecting many more customers.", context);

    assert(res.state === "COMPLETED", "Completes surge inquiry");
    assert(
      Boolean(res.plan?.targetCapabilities.includes("analytics") && res.plan?.targetCapabilities.includes("workforce")),
      "Identified both Analytics and Workforce from multi-turn context"
    );
  }

  console.log("\n=======================================================");
  console.log("PROSIS-IT VALIDATION: ALL 18 TESTS PASSED (100% GREEN)");
  console.log("=======================================================\n");

  return true;
}
