/**
 * @prosis/orchestrator - Canonical Tool Gateway & Execution Protocol Contracts
 * Single source of truth for all tool execution requests, trusted contexts, error taxonomy,
 * and normalized results across the Prosis AI Operating System.
 */

export type ToolErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "AUTHORIZATION_DENIED"
  | "RESOURCE_FORBIDDEN"
  | "TOOL_NOT_ALLOWED"
  | "INVALID_TOOL_ARGUMENTS"
  | "TOOL_NOT_FOUND"
  | "TOOL_EXECUTION_FAILED"
  | "TOOL_TIMEOUT"
  | "STALE_REQUEST"
  | "CONFIGURATION_ERROR";

export class ToolExecutionError {
  code: ToolErrorCode;
  message: string;
  retryable: boolean;

  constructor(code: ToolErrorCode, message: string, retryable = false) {
    this.code = code;
    this.message = message;
    this.retryable = retryable;
  }

  includes(searchString: string, position?: number): boolean {
    return this.message.includes(searchString, position);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
  }

  toString() {
    return this.message;
  }
}

export interface ToolExecutionRequest {
  requestId?: string;
  sessionId?: string;
  toolName: string;
  arguments?: unknown;
  parameters?: Record<string, any>;
  interruptionEpoch?: number;
  clientTimestamp?: string;
  conversationId?: string;
  session?: any; // AuthenticatedSession
}

export interface TrustedExecutionContext {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  allowedVenues?: string[];
  sessionId: string;
  requestId: string;
  autonomyLevel: number; // Server-enforced (default: 1)
}

export interface ToolExecutionMetadata {
  source: string;
  isDemoData: boolean;
  timestamp: string;
  toolName: string;
  executionDurationMs: number;
  organizationId: string;
  userId: string;
}

export interface ToolExecutionResult<T = any> {
  requestId: string;
  toolName: string;
  success: boolean;
  data?: T;
  error?: ToolExecutionError;
  metadata: ToolExecutionMetadata;
}
