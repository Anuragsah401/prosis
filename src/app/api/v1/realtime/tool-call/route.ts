import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/packages/orchestrator/auth-service";
import { ToolExecutionService, ToolExecutionResult, ToolExecutionError } from "@/packages/orchestrator/tool-execution-service";
import "@/packages/orchestrator/agent";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let reqId = req.headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  let toolNameStr = "unknown";

  try {
    const authHeader = req.headers.get("authorization");
    const sessionTokenHeader = req.headers.get("x-prosis-session");

    // 1. Resolve Session Strictly Server-Side
    const session = AuthService.resolveSession({
      authorization: authHeader,
      sessionToken: sessionTokenHeader,
    });

    const body = await req.json().catch(() => ({}));
    const {
      toolName,
      parameters = {},
      arguments: rawArgs,
      requestId: clientRequestId,
      sessionId: clientSessionId,
      conversationId = "conv_realtime",
      interruptionEpoch,
    } = body;

    if (clientRequestId && typeof clientRequestId === "string") {
      reqId = clientRequestId;
    }
    if (toolName && typeof toolName === "string") {
      toolNameStr = toolName;
    }

    if (!session) {
      const unauthResult: ToolExecutionResult = {
        requestId: reqId,
        toolName: toolNameStr,
        success: false,
        error: new ToolExecutionError(
          "AUTHENTICATION_REQUIRED",
          "Authentication required to execute enterprise tools.",
          false
        ),
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName: toolNameStr,
          executionDurationMs: Date.now() - startTime,
          organizationId: "unknown",
          userId: "unknown",
        },
      };
      return NextResponse.json(unauthResult, { status: 401 });
    }

    // Zero-Trust Security: Ignore any client attempts to forge role or permissions in request body
    // (session object from AuthService is authoritative)

    if (!toolName || typeof toolName !== "string") {
      const invalidResult: ToolExecutionResult = {
        requestId: reqId,
        toolName: "unknown",
        success: false,
        error: new ToolExecutionError(
          "INVALID_TOOL_ARGUMENTS",
          "toolName is required and must be a string.",
          false
        ),
        metadata: {
          source: "server_boundary",
          isDemoData: false,
          timestamp: new Date().toISOString(),
          toolName: "unknown",
          executionDurationMs: Date.now() - startTime,
          organizationId: session.organization.id,
          userId: session.user.id,
        },
      };
      return NextResponse.json(invalidResult, { status: 400 });
    }

    // 2. Dispatch Through Server Tool Boundary
    const result = await ToolExecutionService.execute({
      requestId: reqId,
      sessionId: clientSessionId || req.headers.get("x-session-id") || "sess_realtime",
      toolName,
      arguments: rawArgs !== undefined ? rawArgs : parameters,
      interruptionEpoch,
      conversationId,
      session,
    });

    if (!result.success) {
      const errorCode = result.error?.code;
      let statusCode = 400;

      switch (errorCode) {
        case "AUTHENTICATION_REQUIRED":
          statusCode = 401;
          break;
        case "AUTHORIZATION_DENIED":
        case "RESOURCE_FORBIDDEN":
        case "TOOL_NOT_ALLOWED":
          statusCode = 403;
          break;
        case "TOOL_NOT_FOUND":
          statusCode = 404;
          break;
        case "STALE_REQUEST":
          statusCode = 409;
          break;
        case "TOOL_TIMEOUT":
          statusCode = 504;
          break;
        case "CONFIGURATION_ERROR":
        case "TOOL_EXECUTION_FAILED":
          statusCode = 500;
          break;
        case "INVALID_TOOL_ARGUMENTS":
        default:
          statusCode = 400;
          break;
      }

      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[RealtimeToolCallRoute] Exception:", err);
    const errorResult: ToolExecutionResult = {
      requestId: reqId,
      toolName: toolNameStr,
      success: false,
      error: new ToolExecutionError(
        "TOOL_EXECUTION_FAILED",
        err.message || "Internal server boundary error during tool execution.",
        false
      ),
      metadata: {
        source: "server_boundary",
        isDemoData: false,
        timestamp: new Date().toISOString(),
        toolName: toolNameStr,
        executionDurationMs: Date.now() - startTime,
        organizationId: "unknown",
        userId: "unknown",
      },
    };
    return NextResponse.json(errorResult, { status: 500 });
  }
}

