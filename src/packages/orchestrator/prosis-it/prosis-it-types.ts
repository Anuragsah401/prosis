/**
 * @prosis/orchestrator - ProsisIt Core AI Orchestration Contracts
 * Canonical interfaces, state machine definitions, plan schemas,
 * and context types for the Prosis central AI Operating System.
 */

export type ProsisOrchestrationState =
  | "IDLE"
  | "UNDERSTANDING"
  | "PLANNING"
  | "WAITING_FOR_INFORMATION"
  | "WAITING_FOR_APPROVAL"
  | "EXECUTING"
  | "OBSERVING"
  | "REPLANNING"
  | "COMPLETED"
  | "FAILED"
  | "INTERRUPTED";

export type RequestClassification =
  | "conversation"
  | "information_request"
  | "business_operation"
  | "multi_step_task"
  | "destructive_action";

export interface ProsisUserContext {
  id: string;
  name?: string;
  role: string;
  permissions: string[];
}

export interface ProsisOrgContext {
  id: string;
  name?: string;
  tenantId: string;
}

export interface PendingApproval {
  id: string;
  planId: string;
  stepId: string;
  actionSummary: string;
  toolName: string;
  arguments: Record<string, any>;
  impact: "low" | "medium" | "high" | "critical";
  isDestructive: boolean;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  product: string;
  description: string;
  status: "implemented" | "partially_implemented" | "future";
  availableTools: string[];
  requiredPermissions: string[];
  supportedOperations: string[];
  futureRoadmapNotes?: string;
}

export interface ProsisContext {
  user: ProsisUserContext;
  organization: ProsisOrgContext;
  activeProduct: string; // "analytics" | "seatbooking" | "workforce" | "menu" | "marketing" | "operations"
  activeVenue: string;   // e.g. "cantina_bella" | "all"
  conversationId: string;
  sessionId: string;
  currentTask?: ProsisTaskState | null;
  previousToolResults: Record<string, any>;
  pendingApprovals: PendingApproval[];
  autonomyLevel: number; // 0 = assistive, 1 = supervised (approval needed for mutations), 2 = autonomous
  availableCapabilities?: CapabilityDefinition[];
  interruptionEpoch?: number;
}

export type PlanStepStatus =
  | "pending"
  | "waiting_approval"
  | "executing"
  | "completed"
  | "failed"
  | "skipped";

export interface PlanStep {
  id: string;
  goal: string;
  capabilityId: string;
  toolName: string;
  arguments: Record<string, any>;
  dependencies?: string[];
  status: PlanStepStatus;
  result?: any;
  error?: string;
  isDestructive: boolean;
  requiresApproval: boolean;
  executionDurationMs?: number;
}

export type PlanStatus =
  | "pending"
  | "in_progress"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "interrupted";

export interface ProsisPlan {
  id: string;
  userIntent: string;
  classification: RequestClassification;
  targetCapabilities: string[];
  steps: PlanStep[];
  currentStepIndex: number;
  status: PlanStatus;
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProsisTaskState {
  taskId: string;
  plan: ProsisPlan;
  history: Array<{
    state: ProsisOrchestrationState;
    timestamp: string;
    details?: string;
  }>;
}

export interface IntentUnderstanding {
  intent: string;
  classification: RequestClassification;
  targetCapabilities: string[];
  entities: Record<string, any>;
  requiresClarification: boolean;
  missingParameters?: string[];
  clarificationPrompt?: string;
  isDestructive: boolean;
  confidence: number;
}

export interface OrchestrationResult {
  state: ProsisOrchestrationState;
  plan?: ProsisPlan;
  response: string;
  activeStep?: PlanStep;
  pendingApproval?: PendingApproval;
  toolResults?: Record<string, any>;
  error?: string;
  requiresClarification?: boolean;
  missingParameters?: string[];
}
