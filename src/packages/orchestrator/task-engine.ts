/**
 * @prosis/orchestrator - Prosis Task Execution System
 * Manages complex multi-step business tasks with:
 * - Granular step lifecycle tracking (pending ➔ planning ➔ executing ➔ waiting_for_approval ➔ completed | failed | cancelled)
 * - Transparent partial failure accounting (never pretending complete success)
 * - Safe retries for transient read errors while strictly guarding against auto-retrying destructive actions
 * - Approval pause, UI/voice/text resumption, and complete audit trail logging
 */

import { AuditTrail } from "./audit-trail";
import { Memory } from "../memory";

export type TaskState =
  | "pending"
  | "planning"
  | "executing"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface TaskStep {
  id: string;
  index: number;
  title: string;
  description?: string;
  tool?: string;
  status: "pending" | "executing" | "completed" | "failed" | "skipped";
  isDestructive: boolean;
  requiresApproval: boolean;
  retriesCount: number;
  maxRetries: number;
  canRetry: boolean;
  result?: unknown;
  error?: string;
  warnings?: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface TaskApprovalRequirement {
  stepIndex: number;
  approvalId?: string;
  description: string;
  impactDescription: string;
  proposedChanges?: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
}

export interface BusinessTask {
  id: string;
  userId: string;
  organizationId: string;
  goal: string;
  status: TaskState;
  steps: TaskStep[];
  currentStepIndex: number;
  tools: string[];
  approvalRequirements: TaskApprovalRequirement[];
  collectedData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  explanation?: string;
  warnings?: string[];
}

class TaskExecutionEngineService {
  private tasks: Map<string, BusinessTask> = new Map();
  private activeTaskByConversation: Map<string, string> = new Map();

  /**
   * Creates a new business task and logs its creation to audit trail.
   */
  public createTask(params: {
    id?: string;
    userId: string;
    organizationId: string;
    goal: string;
    conversationId?: string;
    steps: Array<{
      title: string;
      description?: string;
      tool?: string;
      isDestructive?: boolean;
      requiresApproval?: boolean;
      maxRetries?: number;
    }>;
  }): BusinessTask {
    const taskId = params.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const steps: TaskStep[] = params.steps.map((s, idx) => ({
      id: `step_${idx + 1}_${Math.random().toString(36).substring(2, 5)}`,
      index: idx,
      title: s.title,
      description: s.description,
      tool: s.tool,
      status: "pending",
      isDestructive: s.isDestructive ?? false,
      requiresApproval: s.requiresApproval ?? false,
      retriesCount: 0,
      maxRetries: s.maxRetries ?? (s.isDestructive ? 0 : 2), // Default 0 retries for destructive actions
      canRetry: !s.isDestructive,
      warnings: [],
    }));

    const tools = Array.from(new Set(steps.map((s) => s.tool).filter(Boolean))) as string[];

    const task: BusinessTask = {
      id: taskId,
      userId: params.userId,
      organizationId: params.organizationId,
      goal: params.goal,
      status: "planning",
      steps,
      currentStepIndex: 0,
      tools,
      approvalRequirements: [],
      collectedData: {},
      createdAt: now,
      updatedAt: now,
      warnings: [],
    };

    this.tasks.set(taskId, task);

    if (params.conversationId) {
      this.activeTaskByConversation.set(params.conversationId, taskId);
    }

    // Audit Logging
    AuditTrail.recordAction({
      conversationId: params.conversationId || "conv_sys",
      runId: `run_task_${taskId}`,
      actionType: "tool_execution",
      actor: { id: params.userId, name: "Prosis User", role: "member" },
      targetProduct: "orchestrator",
      toolName: "task_create",
      parameters: { taskId, goal: task.goal, stepCount: steps.length },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs: 1,
      resultSummary: `Task ${taskId} planned with ${steps.length} steps: "${task.goal}"`,
    });

    // Record into Task Memory
    try {
      Memory.store({
        type: "task_memory",
        key: `task_${taskId}`,
        content: `Active Business Task: ${task.goal} (0/${steps.length} completed)`,
        structuredData: {
          taskId,
          goal: task.goal,
          status: task.status,
          currentStepIndex: 0,
          totalSteps: steps.length,
        },
        source: "task_execution",
        importance: "high",
        confidence: 1.0,
        orgScope: params.organizationId,
        userScope: params.userId,
      });
    } catch {}

    return task;
  }

  public getTask(id: string): BusinessTask | undefined {
    return this.tasks.get(id);
  }

  public getActiveTask(conversationId: string): BusinessTask | undefined {
    const taskId = this.activeTaskByConversation.get(conversationId);
    if (!taskId) return undefined;
    const task = this.tasks.get(taskId);
    if (task && (task.status === "completed" || task.status === "cancelled" || task.status === "failed")) {
      return undefined;
    }
    return task;
  }

  public getAllTasks(): BusinessTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Advances step state to executing.
   */
  public startStep(taskId: string, stepIndex: number): TaskStep {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = "executing";
    task.currentStepIndex = stepIndex;
    task.updatedAt = new Date().toISOString();

    const step = task.steps[stepIndex];
    if (!step) throw new Error(`Step index ${stepIndex} out of range in task ${taskId}`);

    step.status = "executing";
    step.startedAt = new Date().toISOString();

    return step;
  }

  /**
   * Completes a step with result data.
   */
  public completeStep(
    taskId: string,
    stepIndex: number,
    result?: unknown,
    warnings?: string[]
  ): TaskStep {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const step = task.steps[stepIndex];
    if (!step) throw new Error(`Step ${stepIndex} not found in task ${taskId}`);

    step.status = "completed";
    step.completedAt = new Date().toISOString();
    step.result = result;
    if (warnings && warnings.length > 0) {
      step.warnings = [...(step.warnings || []), ...warnings];
      task.warnings = [...(task.warnings || []), ...warnings];
    }

    task.updatedAt = new Date().toISOString();
    return step;
  }

  /**
   * Pauses the task when human-in-the-loop approval is required.
   */
  public pauseForApproval(
    taskId: string,
    stepIndex: number,
    approvalRequirement: TaskApprovalRequirement
  ): BusinessTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = "waiting_for_approval";
    task.currentStepIndex = stepIndex;
    task.updatedAt = new Date().toISOString();

    const step = task.steps[stepIndex];
    if (step) {
      step.status = "pending";
      step.requiresApproval = true;
    }

    task.approvalRequirements.push(approvalRequirement);

    // Audit pause event
    AuditTrail.recordAction({
      conversationId: "conv_task",
      runId: `run_task_${taskId}`,
      actionType: "approval_escalation",
      actor: { id: task.userId, name: "Prosis Task Engine", role: "admin" },
      targetProduct: "orchestrator",
      toolName: step?.tool || "task_pause",
      parameters: { taskId, stepIndex, description: approvalRequirement.description },
      requiresApproval: true,
      approvalStatus: "pending",
      executionStatus: "pending",
      durationMs: 0,
      resultSummary: `Task ${taskId} paused at step ${stepIndex + 1} (${step?.title}): ${approvalRequirement.description}`,
    });

    return task;
  }

  /**
   * Records a step failure with explicit explanation.
   * Enforces that destructive failures are marked as non-retryable without human intervention.
   */
  public recordStepFailure(
    taskId: string,
    stepIndex: number,
    error: string,
    isDestructive = false,
    warnings?: string[]
  ): BusinessTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const step = task.steps[stepIndex];
    if (step) {
      step.status = "failed";
      step.error = error;
      step.canRetry = !isDestructive; // Strict safety rule: Never blindly retry destructive operations
      if (warnings) {
        step.warnings = [...(step.warnings || []), ...warnings];
        task.warnings = [...(task.warnings || []), ...warnings];
      }
    }

    task.status = "failed";
    task.error = error;
    task.updatedAt = new Date().toISOString();

    // Audit failure
    AuditTrail.recordAction({
      conversationId: "conv_task",
      runId: `run_task_${taskId}`,
      actionType: "tool_execution",
      actor: { id: task.userId, name: "Prosis Task Engine", role: "admin" },
      targetProduct: "orchestrator",
      toolName: step?.tool || "task_step",
      parameters: { taskId, stepIndex, isDestructive },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "failure",
      durationMs: 0,
      error,
      resultSummary: `Task ${taskId} failed at step ${stepIndex + 1} (${step?.title}): ${error}`,
    });

    return task;
  }

  /**
   * Safe Retry Handler:
   * Retries safe transient operations.
   * Strictly blocks blind auto-retries for destructive operations.
   */
  public canRetryStep(taskId: string, stepIndex: number): { allowed: boolean; reason?: string } {
    const task = this.tasks.get(taskId);
    if (!task) return { allowed: false, reason: "Task not found" };

    const step = task.steps[stepIndex];
    if (!step) return { allowed: false, reason: "Step not found" };

    if (step.isDestructive) {
      return {
        allowed: false,
        reason:
          "Destructive operations (e.g. sending emails, deleting data, modifying bookings) cannot be blindly retried without explicit human authorization.",
      };
    }

    if (step.retriesCount >= step.maxRetries) {
      return {
        allowed: false,
        reason: `Maximum retry limit (${step.maxRetries}) reached for this step.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Executes a safe retry on a failed step.
   */
  public retryStep(
    taskId: string,
    stepIndex: number,
    forceDestructive = false
  ): { success: boolean; message: string } {
    const task = this.tasks.get(taskId);
    if (!task) return { success: false, message: "Task not found" };

    const step = task.steps[stepIndex];
    if (!step) return { success: false, message: "Step not found" };

    if (step.isDestructive && !forceDestructive) {
      return {
        success: false,
        message:
          "Destructive operations cannot be automatically retried. Please review consequence and authorize manually.",
      };
    }

    step.retriesCount += 1;
    step.status = "pending";
    step.error = undefined;
    task.status = "executing";
    task.error = undefined;
    task.updatedAt = new Date().toISOString();

    AuditTrail.recordAction({
      conversationId: "conv_task",
      runId: `run_task_${taskId}_retry_${step.retriesCount}`,
      actionType: "tool_execution",
      actor: { id: task.userId, name: "Prosis Task Engine", role: "admin" },
      targetProduct: "orchestrator",
      toolName: step.tool || "task_retry",
      parameters: { taskId, stepIndex, attempt: step.retriesCount },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "pending",
      durationMs: 0,
      resultSummary: `Retrying safe step ${stepIndex + 1} (${step.title}) in task ${taskId} (Attempt ${step.retriesCount})`,
    });

    return {
      success: true,
      message: `Step ${stepIndex + 1} (${step.title}) reset to pending for retry attempt ${step.retriesCount}.`,
    };
  }

  /**
   * Completes the entire task workflow.
   */
  public completeTask(taskId: string, explanation?: string): BusinessTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.updatedAt = task.completedAt;
    if (explanation) {
      task.explanation = explanation;
    }

    // Audit completion
    AuditTrail.recordAction({
      conversationId: "conv_task",
      runId: `run_task_${taskId}`,
      actionType: "tool_execution",
      actor: { id: task.userId, name: "Prosis Task Engine", role: "admin" },
      targetProduct: "orchestrator",
      toolName: "task_complete",
      parameters: { taskId, stepsCompleted: task.steps.filter((s) => s.status === "completed").length },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs: 0,
      resultSummary: `Task ${taskId} successfully completed: "${task.goal}"`,
    });

    return task;
  }

  /**
   * Cancels an active or paused task.
   */
  public cancelTask(taskId: string, reason = "User requested cancellation"): BusinessTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = "cancelled";
    task.error = reason;
    task.updatedAt = new Date().toISOString();

    for (const step of task.steps) {
      if (step.status === "pending" || step.status === "executing") {
        step.status = "skipped";
      }
    }

    AuditTrail.recordAction({
      conversationId: "conv_task",
      runId: `run_task_${taskId}`,
      actionType: "tool_execution",
      actor: { id: task.userId, name: "Prosis Task Engine", role: "admin" },
      targetProduct: "orchestrator",
      toolName: "task_cancel",
      parameters: { taskId, reason },
      requiresApproval: false,
      approvalStatus: "not_required",
      executionStatus: "success",
      durationMs: 0,
      resultSummary: `Task ${taskId} cancelled: ${reason}`,
    });

    return task;
  }
}

export const TaskEngine = new TaskExecutionEngineService();

