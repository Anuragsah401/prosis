/**
 * @prosis/orchestrator - Server-Side Tool Execution Service & Production Gateway
 * Acts as the authoritative, hardened boundary between AI/client requests and business operations.
 * Enforces:
 * 1. Authenticated session validation & TrustedExecutionContext (no client identity trust)
 * 2. Multi-tenant and venue scoping with RESOURCE_FORBIDDEN taxonomy
 * 3. Role-Based Access Control (RBAC) & server-enforced autonomy levels
 * 4. Zod argument validation (INVALID_TOOL_ARGUMENTS)
 * 5. Strict tool allowlist (TOOL_NOT_ALLOWED)
 * 6. Server-side timeout protection (TOOL_TIMEOUT - 5000ms)
 * 7. In-memory duplicate request protection (Idempotency cache)
 * 8. Interruption epoch invalidation (STALE_REQUEST)
 * 9. Immutable audit telemetry across all phases
 * 10. Normalized output contract with explicit data-source disclosure
 */

import { ToolRegistry } from "../tools";
import { PermissionService } from "./permission-service";
import { AuditTrail } from "./audit-trail";
import { AuthService, AuthenticatedSession } from "./auth-service";
import { ExecutionContext } from "../sdk";
import {
  ToolExecutionRequest,
  TrustedExecutionContext,
  ToolExecutionResult,
  ToolExecutionError,
  ToolErrorCode,
} from "./tool-gateway-types";

// Re-export canonical types
export * from "./tool-gateway-types";

// Allowlist of tools authorized for Realtime AI execution in Phase 3
const REALTIME_TOOL_ALLOWLIST = new Set([
  "getVenueAnalytics",
  "seatbooking_getReservationAnalytics",
]);

// Canonical name normalization
function normalizeToolName(name: string): string {
  if (name === "getVenueAnalytics") return "seatbooking_getReservationAnalytics";
  return name;
}

// In-Memory Idempotency Cache: sessionId:requestId -> { result, timestamp }
const IDEMPOTENCY_CACHE = new Map<string, { result: ToolExecutionResult; timestamp: number }>();
const IDEMPOTENCY_TTL_MS = 60_000; // 60 seconds

// Session Interruption Epochs: sessionId -> activeEpoch
const SESSION_EPOCHS = new Map<string, number>();

export class ToolExecutionService {
  public static timeoutMs = 5000;

  /**
   * Sets or updates the active interruption epoch for a voice session.
   * Any subsequent or in-flight requests with an older epoch will be rejected as STALE_REQUEST.
   */
  public static setSessionEpoch(sessionId: string, epoch: number): void {
    SESSION_EPOCHS.set(sessionId, epoch);
  }

  /**
   * Retrieves the active epoch for a voice session.
   */
  public static getSessionEpoch(sessionId: string): number {
    return SESSION_EPOCHS.get(sessionId) ?? 0;
  }

  /**
   * Clears the idempotency cache (useful for testing).
   */
  public static clearIdempotencyCache(): void {
    IDEMPOTENCY_CACHE.clear();
  }

  /**
   * Executes a tool strictly through the server-side authorization and tenant boundary.
   * Supports both explicit TrustedExecutionContext or backward-compatible request.session.
   */
  public static async execute(
    request: ToolExecutionRequest,
    contextOverride?: TrustedExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const rawArgs = request.arguments !== undefined ? request.arguments : (request.parameters || {});
    const parameters: Record<string, any> = typeof rawArgs === "object" && rawArgs !== null ? (rawArgs as Record<string, any>) : {};
    const toolName = request.toolName;
    const conversationId = request.conversationId || "conv_realtime";
    const sessionId = request.sessionId || "sess_default";
    const requestId = request.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Resolve Trusted Execution Context
    let trustedContext: TrustedExecutionContext;
    let authSession: AuthenticatedSession | null = null;

    if (contextOverride) {
      trustedContext = contextOverride;
      authSession = AuthService.authenticateById(contextOverride.userId);
    } else if (request.session) {
      authSession = request.session;
      trustedContext = AuthService.toTrustedContext(request.session, sessionId, requestId);
    } else {
      const error = new ToolExecutionError(
        "AUTHENTICATION_REQUIRED",
        "Authentication required to execute enterprise tools.",
        false
      );
      return {
        requestId,
        toolName: toolName || "unknown",
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName: toolName || "unknown",
          executionDurationMs: Date.now() - startTime,
          organizationId: "unknown",
          userId: "unknown",
        },
      };
    }

    const { userId, organizationId } = trustedContext;

    // 1. In-Memory Idempotency Check
    const idempotencyKey = `${sessionId}:${requestId}`;
    const cachedEntry = IDEMPOTENCY_CACHE.get(idempotencyKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < IDEMPOTENCY_TTL_MS) {
      return cachedEntry.result;
    }

    // 2. Interruption Epoch & Stale Request Check
    const currentEpoch = SESSION_EPOCHS.get(sessionId) ?? 0;
    if (request.interruptionEpoch !== undefined && request.interruptionEpoch < currentEpoch) {
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_STALE",
        userId,
        organizationId,
        toolName,
        parameters,
        executionStatus: "aborted",
        durationMs: Date.now() - startTime,
        error: `Request epoch ${request.interruptionEpoch} is stale (current session epoch is ${currentEpoch}).`,
        errorCode: "STALE_REQUEST",
      });

      const error = new ToolExecutionError(
        "STALE_REQUEST",
        `Request was cancelled due to user interruption or superseded by epoch ${currentEpoch}.`,
        false
      );

      return {
        requestId,
        toolName,
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName,
          executionDurationMs: Date.now() - startTime,
          organizationId,
          userId,
        },
      };
    }

    // Record initial TOOL_REQUESTED audit event
    AuditTrail.recordAction({
      conversationId,
      runId: `run_${requestId}`,
      requestId,
      actionType: "TOOL_REQUESTED",
      userId,
      organizationId,
      toolName,
      parameters,
      executionStatus: "pending",
    });

    // 3. Tool Allowlist Check
    const canonicalName = normalizeToolName(toolName);
    if (!REALTIME_TOOL_ALLOWLIST.has(toolName) && !REALTIME_TOOL_ALLOWLIST.has(canonicalName)) {
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_DENIED",
        userId,
        organizationId,
        toolName,
        parameters,
        executionStatus: "aborted",
        durationMs: Date.now() - startTime,
        error: `Tool '${toolName}' is not authorized for realtime execution in this environment.`,
        errorCode: "TOOL_NOT_ALLOWED",
      });

      const error = new ToolExecutionError(
        "TOOL_NOT_ALLOWED",
        `Tool '${toolName}' is not authorized for realtime execution in this environment.`,
        false
      );

      return {
        requestId,
        toolName,
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName,
          executionDurationMs: Date.now() - startTime,
          organizationId,
          userId,
        },
      };
    }

    // 4. Tool Registry Lookup
    const tool = ToolRegistry.get(canonicalName) || ToolRegistry.get(toolName);
    if (!tool) {
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_FAILED",
        userId,
        organizationId,
        toolName,
        parameters,
        executionStatus: "aborted",
        durationMs: Date.now() - startTime,
        error: `Tool '${toolName}' not found in registry.`,
        errorCode: "TOOL_NOT_FOUND",
      });

      const error = new ToolExecutionError(
        "TOOL_NOT_FOUND",
        `Tool '${toolName}' not found in registry.`,
        false
      );

      return {
        requestId,
        toolName,
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName,
          executionDurationMs: Date.now() - startTime,
          organizationId,
          userId,
        },
      };
    }

    // 5. Tenant & Venue Scope Validation
    let requestedVenue = parameters.restaurantId || parameters.venueId;
    if (requestedVenue && typeof requestedVenue === "string") {
      const normalizedVenue = requestedVenue.trim().toLowerCase();
      if (["all", "all_venues", "portfolio", "global", "any", "*"].includes(normalizedVenue)) {
        requestedVenue = undefined;
      } else {
        let allowed = false;
        if (authSession) {
          allowed = AuthService.canAccessVenue(authSession, requestedVenue);
        } else if (trustedContext.allowedVenues) {
          allowed = trustedContext.allowedVenues.includes(requestedVenue);
        }

        if (!allowed) {
          console.warn(`[ToolExecutionService] Access Denied: User ${userId} cannot access venue ${requestedVenue}`);
        AuditTrail.recordAction({
          conversationId,
          runId: `run_${requestId}`,
          requestId,
          actionType: "TOOL_DENIED",
          userId,
          organizationId,
          toolName,
          parameters,
          executionStatus: "aborted",
          durationMs: Date.now() - startTime,
          error: `Access Denied: You do not have authorization to access venue '${requestedVenue}'.`,
          errorCode: "RESOURCE_FORBIDDEN",
        });

        const error = new ToolExecutionError(
          "RESOURCE_FORBIDDEN",
          `Access Denied: You do not have authorization to access venue '${requestedVenue}'.`,
          false
        );

        return {
          requestId,
          toolName,
          success: false,
          error,
          metadata: {
            source: "server_boundary",
            isDemoData: false,
            timestamp: new Date().toISOString(),
            toolName,
            executionDurationMs: Date.now() - startTime,
            organizationId,
            userId,
          },
        };
      }
    }
  }

    // 6. RBAC Permission Enforcement (Server Session Context, Never Client Payload)
    const isAuthorized = PermissionService.enforce(
      {
        id: userId,
        role: trustedContext.role as any,
        permissions: trustedContext.permissions,
        name: authSession?.user.name || userId,
        email: authSession?.user.email || `${userId}@internal.prosis.system`,
      },
      tool.permissionsRequired,
      {
        toolName: tool.name,
        productId: tool.productId,
        conversationId,
        runId: `run_${requestId}`,
        organizationId,
      }
    );

    if (!isAuthorized) {
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_DENIED",
        userId,
        organizationId,
        toolName: tool.name,
        parameters,
        executionStatus: "aborted",
        durationMs: Date.now() - startTime,
        error: `Permission Denied: User '${authSession?.user.name || userId}' (${trustedContext.role}) lacks required scope [${tool.permissionsRequired.join(", ")}].`,
        errorCode: "AUTHORIZATION_DENIED",
      });

      const error = new ToolExecutionError(
        "AUTHORIZATION_DENIED",
        `Permission Denied: User '${authSession?.user.name || userId}' (${trustedContext.role}) lacks required scope [${tool.permissionsRequired.join(", ")}].`,
        false
      );

      return {
        requestId,
        toolName: tool.name,
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName: tool.name,
          executionDurationMs: Date.now() - startTime,
          organizationId,
          userId,
        },
      };
    }

    // 7. Autonomy Protection (Model cannot bypass approval or self-elevate beyond server Level 1)
    if (tool.requiresApproval && trustedContext.autonomyLevel < 3) {
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_DENIED",
        userId,
        organizationId,
        toolName: tool.name,
        parameters,
        executionStatus: "aborted",
        durationMs: Date.now() - startTime,
        error: `Operation requires explicit human approval at current autonomy level (${trustedContext.autonomyLevel}).`,
        errorCode: "AUTHORIZATION_DENIED",
      });

      const error = new ToolExecutionError(
        "AUTHORIZATION_DENIED",
        `Operation requires explicit human approval at current autonomy level (${trustedContext.autonomyLevel}).`,
        false
      );

      return {
        requestId,
        toolName: tool.name,
        success: false,
        error,
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName: tool.name,
          executionDurationMs: Date.now() - startTime,
          organizationId,
          userId,
        },
      };
    }

    // 8. Server-Side Zod Argument Validation
    let validatedParams = { ...parameters };
    if (tool.inputSchema) {
      // Normalize parameter names for getReservationAnalytics before validation if needed
      const preNormalized = {
        ...parameters,
        timeRange: parameters.timeframe || parameters.timeRange || "current_week",
        restaurantId: requestedVenue,
      };

      const parseResult = tool.inputSchema.safeParse(preNormalized);
      if (!parseResult.success) {
        const errorMsg = `Invalid arguments for tool '${toolName}': ${parseResult.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ")}`;
        AuditTrail.recordAction({
          conversationId,
          runId: `run_${requestId}`,
          requestId,
          actionType: "TOOL_DENIED",
          userId,
          organizationId,
          toolName: tool.name,
          parameters,
          executionStatus: "aborted",
          durationMs: Date.now() - startTime,
          error: errorMsg,
          errorCode: "INVALID_TOOL_ARGUMENTS",
        });

        const error = new ToolExecutionError(
          "INVALID_TOOL_ARGUMENTS",
          errorMsg,
          false
        );

        return {
          requestId,
          toolName: tool.name,
          success: false,
          error,
          metadata: {
            source: "server_boundary",
            isDemoData: false,
            timestamp: new Date().toISOString(),
            toolName: tool.name,
            executionDurationMs: Date.now() - startTime,
            organizationId,
            userId,
          },
        };
      }
      validatedParams = parseResult.data as Record<string, any>;
    }

    // Record TOOL_AUTHORIZED audit event
    AuditTrail.recordAction({
      conversationId,
      runId: `run_${requestId}`,
      requestId,
      actionType: "TOOL_AUTHORIZED",
      userId,
      organizationId,
      toolName: tool.name,
      parameters: validatedParams,
      executionStatus: "pending",
    });

    // 9. Build Execution Context
    const context: ExecutionContext = {
      organization: authSession ? { ...authSession.organization } : { id: organizationId, name: organizationId, plan: "enterprise" },
      user: authSession ? { ...authSession.user } : { id: userId, name: userId, email: `${userId}@internal.prosis.system`, role: trustedContext.role as any, permissions: trustedContext.permissions },
      conversationId,
      runId: `run_${requestId}`,
      timestamp: new Date().toISOString(),
      source: "voice",
    };

    // 10. Execute Tool Handler with Timeout Protection (5000ms)
    try {
      const timeoutLimit = ToolExecutionService.timeoutMs;
      const executionPromise = tool.execute(validatedParams as any, context);

      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("EXECUTION_TIMEOUT"));
        }, timeoutLimit);
        // Allow unref in Node environments if available
        if (typeof timer.unref === "function") timer.unref();
      });

      const result = await Promise.race([executionPromise, timeoutPromise]);
      const executionDurationMs = Date.now() - startTime;

      // 11. Record TOOL_EXECUTED in Audit Trail
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_EXECUTED",
        userId,
        organizationId,
        toolName: tool.name,
        productId: tool.productId,
        parameters: validatedParams,
        requiresApproval: tool.requiresApproval,
        approvalStatus: tool.requiresApproval ? "pending" : "not_required",
        executionStatus: "success",
        durationMs: executionDurationMs,
        resultSummary: `Executed ${tool.name} with demo dataset`,
      });

      // 12. Return Canonical Result with Explicit Demo Metadata
      const finalResult: ToolExecutionResult = {
        requestId,
        toolName: tool.name,
        success: true,
        data: result,
        metadata: {
          source: "in_memory_demo_store", // Explicit disclosure: current dataset is demo data
          isDemoData: true,
          timestamp: new Date().toISOString(),
          toolName: tool.name,
          executionDurationMs,
          organizationId,
          userId,
        },
      };

      // Store in idempotency cache
      IDEMPOTENCY_CACHE.set(idempotencyKey, {
        result: finalResult,
        timestamp: Date.now(),
      });

      return finalResult;
    } catch (err: any) {
      const executionDurationMs = Date.now() - startTime;
      const isTimeout = err.message === "EXECUTION_TIMEOUT" || err.message?.includes("timed out");

      if (isTimeout) {
        console.warn(`[ToolExecutionService] Timeout (${ToolExecutionService.timeoutMs}ms) executing ${tool.name}`);
        AuditTrail.recordAction({
          conversationId,
          runId: `run_${requestId}`,
          requestId,
          actionType: "TOOL_TIMED_OUT",
          userId,
          organizationId,
          toolName: tool.name,
          productId: tool.productId,
          parameters: validatedParams,
          executionStatus: "failure",
          durationMs: executionDurationMs,
          error: `Tool execution exceeded timeout of ${ToolExecutionService.timeoutMs}ms`,
          errorCode: "TOOL_TIMEOUT",
        });

        const error = new ToolExecutionError(
          "TOOL_TIMEOUT",
          `Tool execution exceeded timeout limit of ${ToolExecutionService.timeoutMs}ms.`,
          true // retryable
        );

        return {
          requestId,
          toolName: tool.name,
          success: false,
          error,
          metadata: {
            source: "server_boundary",
            isDemoData: true,
            timestamp: new Date().toISOString(),
            toolName: tool.name,
            executionDurationMs,
            organizationId,
            userId,
          },
        };
      }

      console.error(`[ToolExecutionService] Execution error for ${tool.name}:`, err);
      AuditTrail.recordAction({
        conversationId,
        runId: `run_${requestId}`,
        requestId,
        actionType: "TOOL_FAILED",
        userId,
        organizationId,
        toolName: tool.name,
        productId: tool.productId,
        parameters: validatedParams,
        executionStatus: "failure",
        durationMs: executionDurationMs,
        error: err.message || "Internal tool execution error",
        errorCode: "TOOL_EXECUTION_FAILED",
      });

      const error = new ToolExecutionError(
        "TOOL_EXECUTION_FAILED",
        err.message || "Failed to execute business operation.",
        false
      );

      return {
        requestId,
        toolName: tool.name,
        success: false,
        error,
        metadata: {
          source: "in_memory_demo_store",
          isDemoData: true,
          timestamp: new Date().toISOString(),
          toolName: tool.name,
          executionDurationMs,
          organizationId,
          userId,
        },
      };
    }
  }
}

