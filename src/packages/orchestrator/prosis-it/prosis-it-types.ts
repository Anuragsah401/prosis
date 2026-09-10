/**
 * @prosis/orchestrator - ProsisIt Core AI Orchestration Contracts
 * Canonical interfaces, state machine definitions, plan schemas,
 * and context types for the Prosis central AI Operating System.
 */

import { z } from "zod";

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

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
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
  conversationHistory?: ConversationTurn[];
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
  reasoningSummary?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Real LLM Reasoning Engine Contracts
// ─────────────────────────────────────────────────────────────────────────────

export type ProsisAINextAction =
  | "tool_request"
  | "clarification"
  | "response"
  | "approval_required";

export interface ProsisAIToolDescriptor {
  name: string;
  description: string;
  parameters: Record<string, any>;
  requiresApproval: boolean;
}

export interface ProsisAIRequest {
  userMessage: string;
  conversationContext: ConversationTurn[];
  prosisContext: {
    user: ProsisUserContext;
    organization: ProsisOrgContext;
    activeProduct: string;
    activeVenue: string;
    autonomyLevel: number;
  };
  availableCapabilities: CapabilityDefinition[];
  availableTools: ProsisAIToolDescriptor[];
  currentPlan?: ProsisPlan;
  previousResults?: Record<string, any>;
}

export interface ProsisAIResponse {
  understanding: {
    intent: string;
    classification: RequestClassification;
    targetCapabilities: string[];
    isDestructive: boolean;
    confidence: number;
  };
  goal: string;
  reasoningSummary: string; // Concise user-safe explanation, NOT hidden chain-of-thought
  nextAction: ProsisAINextAction;
  selectedCapability?: string | null;
  selectedTool?: string | null;
  toolArguments?: Record<string, any> | null;
  requiresApproval?: boolean | null;
  needsMoreInformation?: boolean | null;
  clarificationPrompt?: string | null;
  finalResponse?: string | null;
}

export const ProsisAIResponseSchema = z.object({
  understanding: z.object({
    intent: z.string(),
    classification: z.enum([
      "conversation",
      "information_request",
      "business_operation",
      "multi_step_task",
      "destructive_action",
    ]),
    targetCapabilities: z.array(z.string()).default([]),
    isDestructive: z.boolean().default(false),
    confidence: z.number().min(0).max(1).default(0.9),
  }),
  goal: z.string(),
  reasoningSummary: z.string(),
  nextAction: z.enum(["tool_request", "clarification", "response", "approval_required"]),
  selectedCapability: z.string().nullable().optional(),
  selectedTool: z.string().nullable().optional(),
  toolArguments: z.record(z.string(), z.any()).nullable().optional(),
  requiresApproval: z.boolean().nullable().optional(),
  needsMoreInformation: z.boolean().nullable().optional(),
  clarificationPrompt: z.string().nullable().optional(),
  finalResponse: z.string().nullable().optional(),
});
