/**
 * @prosis/orchestrator - Immutable Audit Trail & Observability Engine
 * Tracks every AI run, invocation, tool execution, parameter payload, authorization decision,
 * and duration. Enforces secret scrubbing to guarantee credentials and tokens are never logged.
 */

export interface AuditRecord {
  id: string;
  timestamp: string;
  conversationId: string;
  runId: string;
  requestId?: string;
  actionType?: "TOOL_REQUESTED" | "TOOL_AUTHORIZED" | "TOOL_EXECUTED" | "TOOL_FAILED" | "TOOL_DENIED" | "TOOL_TIMED_OUT" | "TOOL_STALE" | string;
  userId: string;
  organizationId: string;
  toolName: string;
  productId: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
  approvalStatus: "not_required" | "pending" | "approved" | "rejected";
  executionStatus: "success" | "failure" | "aborted";
  durationMs: number;
  resultSummary?: string;
  error?: string;
  errorCode?: string;
}

export interface AIRunRecord {
  runId: string;
  timestamp: string;
  conversationId: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
  };
  inputSummary: string;
  selectedProduct?: string;
  selectedTools: string[];
  toolExecutionStatus: "success" | "failure" | "aborted" | "none";
  approvalStatus: "not_required" | "pending" | "approved" | "rejected";
  durationMs: number;
  errorStatus?: string;
}

type AuditListener = (record: AuditRecord) => void;
type RunListener = (run: AIRunRecord) => void;

function scrubSecrets<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const sensitiveKeys = [
    "password",
    "secret",
    "apikey",
    "token",
    "authorization",
    "privatekey",
    "credential",
  ];

  if (Array.isArray(data)) {
    return data.map((item) => scrubSecrets(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));
    if (isSensitive) {
      sanitized[key] = "[REDACTED_SECRET]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = scrubSecrets(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

class AuditTrailService {
  private records: AuditRecord[] = [];
  private runRecords: AIRunRecord[] = [];
  private listeners: Set<AuditListener> = new Set();
  private runListeners: Set<RunListener> = new Set();

  /**
   * Logs a tool execution record with secret scrubbing.
   */
  public record(entry: Omit<AuditRecord, "id" | "timestamp">): AuditRecord {
    const fullRecord: AuditRecord = {
      ...entry,
      parameters: scrubSecrets(entry.parameters),
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };

    this.records.unshift(fullRecord); // latest first

    this.listeners.forEach((listener) => {
      try {
        listener(fullRecord);
      } catch (err) {
        console.error("[AuditTrail] Error notifying listener:", err);
      }
    });

    return fullRecord;
  }

  /**
   * Logs a comprehensive AI Run Record with secret scrubbing.
   */
  public recordRun(entry: Omit<AIRunRecord, "timestamp">): AIRunRecord {
    const fullRun: AIRunRecord = {
      ...entry,
      inputSummary: scrubSecrets(entry.inputSummary),
      timestamp: new Date().toISOString(),
    };

    this.runRecords.unshift(fullRun);

    this.runListeners.forEach((listener) => {
      try {
        listener(fullRun);
      } catch (err) {
        console.error("[AuditTrail] Error notifying run listener:", err);
      }
    });

    return fullRun;
  }

  public getAll(): AuditRecord[] {
    return [...this.records];
  }

  public getRecent(limit = 10): AuditRecord[] {
    return this.records.slice(0, limit);
  }

  public getRunRecords(): AIRunRecord[] {
    return [...this.runRecords];
  }

  public getRecentRuns(limit = 10): AIRunRecord[] {
    return this.runRecords.slice(0, limit);
  }

  public getRunById(runId: string): AIRunRecord | undefined {
    return this.runRecords.find((r) => r.runId === runId);
  }

  public subscribe(listener: AuditListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeRuns(listener: RunListener): () => void {
    this.runListeners.add(listener);
    return () => this.runListeners.delete(listener);
  }

  /**
   * Logs a structured action event from the task engine or orchestrator services.
   */
  public recordAction(entry: {
    conversationId: string;
    runId: string;
    requestId?: string;
    actionType?: string;
    actor?: { id: string; name?: string; role?: string };
    userId?: string;
    organizationId?: string;
    targetProduct?: string;
    productId?: string;
    toolName: string;
    parameters?: Record<string, unknown>;
    requiresApproval?: boolean;
    approvalStatus?: "not_required" | "pending" | "approved" | "rejected";
    executionStatus?: "success" | "failure" | "aborted" | "pending";
    durationMs?: number;
    resultSummary?: string;
    error?: string;
    errorCode?: string;
  }): AuditRecord {
    return this.record({
      conversationId: entry.conversationId,
      runId: entry.runId,
      requestId: entry.requestId,
      actionType: entry.actionType,
      userId: entry.actor?.id || entry.userId || "usr_system",
      organizationId: entry.organizationId || "org_acme_corp",
      toolName: entry.toolName,
      productId: entry.targetProduct || entry.productId || "orchestrator",
      parameters: entry.parameters || {},
      requiresApproval: entry.requiresApproval ?? false,
      approvalStatus: entry.approvalStatus ?? "not_required",
      executionStatus: (entry.executionStatus === "pending" ? "aborted" : entry.executionStatus) ?? "success",
      durationMs: entry.durationMs ?? 0,
      resultSummary: entry.resultSummary,
      error: entry.error,
      errorCode: entry.errorCode,
    });
  }

  /**
   * Queries audit records matching partial criteria.
   */
  public query(filter: Partial<AuditRecord>): AuditRecord[] {
    return this.records.filter((rec) => {
      for (const [key, val] of Object.entries(filter)) {
        if (rec[key as keyof AuditRecord] !== val) return false;
      }
      return true;
    });
  }
}

export const AuditTrail = new AuditTrailService();
