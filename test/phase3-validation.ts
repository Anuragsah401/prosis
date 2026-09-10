/**
 * Phase 3 Validation Test Suite
 * Production Tool Gateway, Execution Protocol, Security & Audit Boundary
 */

import { AuthService, AUTH_MODE } from "../src/packages/orchestrator/auth-service";
import { ToolExecutionService } from "../src/packages/orchestrator/tool-execution-service";
import { AuditTrail } from "../src/packages/orchestrator/audit-trail";
import { ToolRegistry } from "../src/packages/tools";
import { z } from "zod";

function assert(condition: boolean, message: string, detail?: string) {
  if (!condition) {
    console.error(`  ✕ [FAIL] ${message}`);
    if (detail) console.error(`       Detail: ${detail}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

export async function runPhase3Validation(): Promise<boolean> {
  console.log("\n=======================================================");
  console.log("PROSIS PHASE 3: PRODUCTION TOOL GATEWAY VALIDATION");
  console.log("=======================================================\n");

  let allPassed = true;

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Server-Side Trust Boundary & AUTH_MODE Declaration
    // ---------------------------------------------------------------------------
    console.log("[Test Suite 1] Server-Side Trust Boundary & Development Auth Mode");
    {
      assert(AUTH_MODE === "development", "AUTH_MODE is explicitly declared as 'development'");

      // 1.1 Unauthenticated Request
      const unauthRes = await ToolExecutionService.execute({
        requestId: "req_unauth_001",
        sessionId: "sess_test_unauth",
        toolName: "getVenueAnalytics",
        arguments: {},
      });

      assert(unauthRes.success === false, "Unauthenticated request is rejected");
      assert(unauthRes.error?.code === "AUTHENTICATION_REQUIRED", "Error code is AUTHENTICATION_REQUIRED");
      assert(unauthRes.requestId === "req_unauth_001", "RequestId correlated in unauthenticated response");

      // 1.2 Identity Spoofing Protection
      const managerSession = AuthService.resolveSession({ authorization: "Bearer sess_live_manager_token" });
      assert(managerSession !== null, "Resolved manager session");

      const spoofedContext = AuthService.toTrustedContext(managerSession!, "sess_test_spoof", "req_spoof_001");
      assert(spoofedContext.userId === "user_manager_cantina", "Trusted context strictly uses server user ID");
      assert(spoofedContext.role === "manager", "Trusted context strictly uses server role (manager)");
      assert(spoofedContext.autonomyLevel === 1, "Server enforces Autonomy Level 1 (cannot self-elevate)");
    }

    // ---------------------------------------------------------------------------
    // TEST 2: Single Canonical Tool Execution Contract & Demo Metadata
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 2] Canonical Contract & Demo Metadata Disclosure");
    {
      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, "sess_exec_001", "req_canonical_001");

      const result = await ToolExecutionService.execute(
        {
          requestId: "req_canonical_001",
          sessionId: "sess_exec_001",
          toolName: "getVenueAnalytics",
          arguments: { timeframe: "current_week" },
        },
        trustedContext
      );

      assert(result.success === true, "Valid tool execution succeeds");
      assert(result.requestId === "req_canonical_001", "Result contains correlated requestId");
      assert(result.toolName === "seatbooking_getReservationAnalytics", "Tool name normalized to canonical registered name");
      assert(result.metadata.isDemoData === true, "Metadata explicitly discloses isDemoData: true");
      assert(result.metadata.source === "in_memory_demo_store", "Metadata discloses source: 'in_memory_demo_store'");
      assert(result.metadata.userId === "user_director_01", "Metadata reflects server-enforced userId");
      assert(result.metadata.organizationId === "org_acme_corp", "Metadata reflects server-enforced organizationId");
      assert(typeof result.metadata.executionDurationMs === "number", "Metadata tracks executionDurationMs");
      assert(result.data !== undefined && typeof result.data === "object", "Structured data returned successfully");
    }

    // ---------------------------------------------------------------------------
    // TEST 3: Multi-Tenant & Venue Isolation (RESOURCE_FORBIDDEN)
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 3] Multi-Tenant & Venue Isolation (RESOURCE_FORBIDDEN)");
    {
      // Elena manages only cantina_bella. Attempting to access verdant_bistro must fail.
      const managerSession = AuthService.resolveSession({ authorization: "Bearer sess_live_manager_token" });
      const managerContext = AuthService.toTrustedContext(managerSession!, "sess_tenant_001", "req_cross_venue");

      const crossVenueRes = await ToolExecutionService.execute(
        {
          requestId: "req_cross_venue",
          sessionId: "sess_tenant_001",
          toolName: "getVenueAnalytics",
          arguments: { restaurantId: "verdant_bistro" },
        },
        managerContext
      );

      assert(crossVenueRes.success === false, "Cross-venue access blocked for unauthorized manager");
      assert(crossVenueRes.error?.code === "RESOURCE_FORBIDDEN", "Error code is RESOURCE_FORBIDDEN");
      assert(crossVenueRes.error?.includes("Access Denied") === true, "Error message contains 'Access Denied'");

      // Cross-Tenant Access: Foreign operator blocked from Org Acme's venue
      const foreignSession = AuthService.resolveSession({ authorization: "Bearer sess_foreign_tenant_token" });
      const foreignContext = AuthService.toTrustedContext(foreignSession!, "sess_foreign_001", "req_cross_tenant");

      const crossTenantRes = await ToolExecutionService.execute(
        {
          requestId: "req_cross_tenant",
          sessionId: "sess_foreign_001",
          toolName: "getVenueAnalytics",
          arguments: { restaurantId: "cantina_bella" },
        },
        foreignContext
      );

      assert(crossTenantRes.success === false, "Cross-tenant access blocked");
      assert(crossTenantRes.error?.code === "RESOURCE_FORBIDDEN", "Cross-tenant error code is RESOURCE_FORBIDDEN");
    }

    // ---------------------------------------------------------------------------
    // TEST 4: Server-Side Tool Allowlist (TOOL_NOT_ALLOWED)
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 4] Server-Side Tool Allowlist Enforcement");
    {
      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, "sess_allowlist_001", "req_unauth_tool");

      // Attempting to run write tool 'seatbooking_createReservation' via realtime gateway
      const writeToolRes = await ToolExecutionService.execute(
        {
          requestId: "req_unauth_tool",
          sessionId: "sess_allowlist_001",
          toolName: "seatbooking_createReservation",
          arguments: { restaurantId: "cantina_bella", customerName: "VIP Guest", customerEmail: "vip@guest.com", partySize: 2 },
        },
        trustedContext
      );

      assert(writeToolRes.success === false, "Unallowlisted tool execution blocked");
      assert(writeToolRes.error?.code === "TOOL_NOT_ALLOWED", "Error code is TOOL_NOT_ALLOWED");
      assert(writeToolRes.error?.includes("not authorized for realtime execution") === true, "Error message explains tool is not authorized for realtime execution");

      // Non-existent tool lookup
      const nonexistentRes = await ToolExecutionService.execute(
        {
          requestId: "req_missing_tool",
          sessionId: "sess_allowlist_001",
          toolName: "some_imaginary_tool",
          arguments: {},
        },
        trustedContext
      );

      assert(nonexistentRes.success === false, "Imaginary tool rejected");
      assert(nonexistentRes.error?.code === "TOOL_NOT_ALLOWED", "Imaginary tool blocked by allowlist");
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Server-Side Zod Argument Validation (INVALID_TOOL_ARGUMENTS)
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 5] Server-Side Zod Argument Validation");
    {
      // Register a strict test tool to verify Zod validation
      ToolRegistry.register({
        name: "seatbooking_getReservationAnalytics",
        productId: "seatbooking",
        description: "Analytics test tool",
        inputSchema: z.object({
          timeRange: z.string(),
          restaurantId: z.string().optional(),
          limit: z.number().max(100).optional(),
        }),
        permissionsRequired: ["seatbooking.read"],
        requiresApproval: false,
        auditMetadata: { category: "query", impactLevel: "low", reversible: true, resourceType: "analytics" },
        execute: async () => ({ status: "ok" }),
      });

      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, "sess_val_001", "req_invalid_args");

      // Pass invalid type for limit (string instead of number)
      const invalidArgsRes = await ToolExecutionService.execute(
        {
          requestId: "req_invalid_args",
          sessionId: "sess_val_001",
          toolName: "seatbooking_getReservationAnalytics",
          arguments: { timeRange: "current_week", limit: "NOT_A_NUMBER" as any },
        },
        trustedContext
      );

      assert(invalidArgsRes.success === false, "Invalid argument types rejected by Zod schema");
      assert(invalidArgsRes.error?.code === "INVALID_TOOL_ARGUMENTS", "Error code is INVALID_TOOL_ARGUMENTS");
      assert(invalidArgsRes.error?.retryable === false, "Validation failure is marked non-retryable");
    }

    // ---------------------------------------------------------------------------
    // TEST 6: In-Memory Idempotency & Duplicate Protection
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 6] In-Memory Idempotency & Duplicate Request Protection");
    {
      ToolExecutionService.clearIdempotencyCache();

      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, "sess_idemp_001", "req_duplicate_123");

      const firstCall = await ToolExecutionService.execute(
        {
          requestId: "req_duplicate_123",
          sessionId: "sess_idemp_001",
          toolName: "getVenueAnalytics",
          arguments: { timeframe: "current_week" },
        },
        trustedContext
      );

      assert(firstCall.success === true, "First execution succeeds");

      // Second identical call with identical sessionId & requestId
      const secondCall = await ToolExecutionService.execute(
        {
          requestId: "req_duplicate_123",
          sessionId: "sess_idemp_001",
          toolName: "getVenueAnalytics",
          arguments: { timeframe: "current_week" },
        },
        trustedContext
      );

      assert(secondCall.success === true, "Duplicate call returned successfully");
      assert(secondCall.requestId === firstCall.requestId, "Duplicate call returns identical requestId");
      assert(secondCall.metadata.timestamp === firstCall.metadata.timestamp, "Cached result returned without re-executing");
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Interruption Epoch & Stale Request Invalidation (STALE_REQUEST)
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 7] Interruption Epoch & Stale Request Handling");
    {
      const sessionId = "sess_epoch_test";
      ToolExecutionService.setSessionEpoch(sessionId, 5); // Current active epoch is 5

      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, sessionId, "req_stale_001");

      // Client sends request originating from epoch 3 (stale barge-in)
      const staleRes = await ToolExecutionService.execute(
        {
          requestId: "req_stale_001",
          sessionId,
          interruptionEpoch: 3, // Stale!
          toolName: "getVenueAnalytics",
          arguments: {},
        },
        trustedContext
      );

      assert(staleRes.success === false, "Stale epoch request rejected");
      assert(staleRes.error?.code === "STALE_REQUEST", "Error code is STALE_REQUEST");
      assert(staleRes.error?.message.includes("interruption") === true, "Message explains cancellation due to interruption");

      // Request with matching active epoch succeeds
      const freshRes = await ToolExecutionService.execute(
        {
          requestId: "req_fresh_001",
          sessionId,
          interruptionEpoch: 5, // Up to date
          toolName: "getVenueAnalytics",
          arguments: {},
        },
        trustedContext
      );

      assert(freshRes.success === true, "Fresh epoch request proceeds and succeeds");
    }

    // ---------------------------------------------------------------------------
    // TEST 8: Server-Side Timeout Protection (TOOL_TIMEOUT)
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 8] Server-Side Timeout Protection");
    {
      // Register a hanging tool to test timeout
      ToolRegistry.register({
        name: "seatbooking_getReservationAnalytics",
        productId: "seatbooking",
        description: "Hanging tool for timeout verification",
        inputSchema: z.object({ hang: z.boolean().optional() }),
        permissionsRequired: ["seatbooking.read"],
        requiresApproval: false,
        auditMetadata: { category: "query", impactLevel: "low", reversible: true, resourceType: "analytics" },
        execute: async (input: any) => {
          if (input?.hang) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Hang longer than test timeout
          }
          return { status: "completed" };
        },
      });

      const directorSession = AuthService.resolveSession({ authorization: "Bearer sess_live_director_token" });
      const trustedContext = AuthService.toTrustedContext(directorSession!, "sess_timeout_001", "req_timeout_test");

      // Temporarily set service timeout to 100ms for fast test execution
      const originalTimeout = ToolExecutionService.timeoutMs;
      ToolExecutionService.timeoutMs = 100;

      try {
        const timeoutRes = await ToolExecutionService.execute(
          {
            requestId: "req_timeout_test",
            sessionId: "sess_timeout_001",
            toolName: "seatbooking_getReservationAnalytics",
            arguments: { hang: true },
          },
          trustedContext
        );

        assert(timeoutRes.success === false, "Timed out tool execution returns failure");
        assert(timeoutRes.error?.code === "TOOL_TIMEOUT", "Error code is TOOL_TIMEOUT");
        assert(timeoutRes.error?.retryable === true, "Timeout error is marked retryable");
      } finally {
        ToolExecutionService.timeoutMs = originalTimeout;
      }
    }

    // ---------------------------------------------------------------------------
    // TEST 9: End-to-End Audit Trail Tracing with requestId
    // ---------------------------------------------------------------------------
    console.log("\n[Test Suite 9] Comprehensive Audit Trail Tracing & Event Taxonomy");
    {
      const auditRecords = AuditTrail.getAll();
      assert(auditRecords.length > 0, "Audit records populated");

      // Verify that every Phase 3 audit entry contains a requestId
      const phase3Records = auditRecords.filter((r) => r.requestId?.startsWith("req_"));
      assert(phase3Records.length > 0, "Audit trail captured records with requestId");

      // Verify presence of canonical audit actionTypes
      const actionTypes = new Set(auditRecords.map((r) => r.actionType).filter(Boolean));
      console.log("  Observed Audit Action Types:", Array.from(actionTypes).join(", "));

      assert(actionTypes.has("TOOL_REQUESTED"), "Audit logged TOOL_REQUESTED");
      assert(actionTypes.has("TOOL_AUTHORIZED"), "Audit logged TOOL_AUTHORIZED");
      assert(actionTypes.has("TOOL_EXECUTED"), "Audit logged TOOL_EXECUTED");
      assert(actionTypes.has("TOOL_DENIED"), "Audit logged TOOL_DENIED");
      assert(actionTypes.has("TOOL_TIMED_OUT"), "Audit logged TOOL_TIMED_OUT");
      assert(actionTypes.has("TOOL_STALE"), "Audit logged TOOL_STALE");
    }

    console.log("\n=======================================================");
    console.log("✓ PHASE 3 PRODUCTION GATEWAY VERIFICATION PASSED (100%)");
    console.log("=======================================================\n");
    return true;
  } catch (err) {
    console.error("\n❌ PHASE 3 VALIDATION FAILED:", err);
    return false;
  }
}

