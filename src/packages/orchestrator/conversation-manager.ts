/**
 * @prosis/orchestrator - Conversation Manager
 * Coordinates multi-turn dialogue sessions, message turns, role tracking,
 * active working task scratchpads, and synchronization to the Conversation Memory tier.
 */

import { Memory } from "../memory";
import { ApprovalRequest } from "./approval-manager";
import type { BusinessTask } from "./task-engine";

export interface MessageTurn {
  id: string;
  role: "user" | "prosis" | "system";
  content: string;
  timestamp: string;
  activeTool?: string;
  toolResult?: unknown;
  pendingApproval?: ApprovalRequest;
  task?: BusinessTask;
  proactiveBriefing?: any;
  comparisonData?: any;
  emailComposerData?: any;
  analyticsData?: any;
  suggestedFollowUps?: string[];
}

export interface MultiStepTaskState {
  goal: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
  steps: Array<{
    step: number;
    action: string;
    status: "pending" | "executing" | "completed" | "failed" | "waiting_for_approval";
    result?: unknown;
  }>;
  collectedData: Record<string, unknown>;
}

export interface ConversationSession {
  id: string;
  organizationId: string;
  userId: string;
  activeProductId: string;
  turns: MessageTurn[];
  workingTaskState?: MultiStepTaskState;
  createdAt: string;
  updatedAt: string;
}

export class ConversationManagerService {
  private sessions: Map<string, ConversationSession> = new Map();

  /**
   * Retrieves or creates a conversation session.
   */
  public getOrCreateSession(
    sessionId: string,
    meta: { organizationId: string; userId: string; activeProductId?: string }
  ): ConversationSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        organizationId: meta.organizationId,
        userId: meta.userId,
        activeProductId: meta.activeProductId || "prod_seatbooking_01",
        turns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Retrieves an existing session.
   */
  public getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Adds a message turn to the session and syncs to conversation memory.
   */
  public appendTurn(sessionId: string, turn: MessageTurn): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.turns.push(turn);
    session.updatedAt = new Date().toISOString();

    // Sync to 5-tier memory service (Conversation tier)
    try {
      Memory.store({
        type: "conversation",
        key: `turn_${turn.id}`,
        content: `[${turn.role.toUpperCase()}]: ${turn.content}`,
        structuredData: {
          turnId: turn.id,
          role: turn.role,
          activeTool: turn.activeTool,
        },
        source: turn.role === "user" ? "user_statement" : "task_execution",
        importance: "medium",
        confidence: 1.0,
        orgScope: session.organizationId,
        userScope: session.userId,
        productScope: session.activeProductId,
      });
    } catch (err) {
      console.error("[ConversationManager] Memory synchronization warning:", err);
    }
  }

  /**
   * Updates or sets active working task state for multi-step task execution.
   */
  public setWorkingTask(sessionId: string, task: MultiStepTaskState | undefined): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.workingTaskState = task;
      session.updatedAt = new Date().toISOString();

      if (task) {
        // Record into task_memory layer
        Memory.store({
          type: "task_memory",
          key: `task_${session.id}`,
          content: `Task: ${task.goal} (Step ${task.currentStepIndex + 1}/${task.totalSteps})`,
          structuredData: {
            goal: task.goal,
            currentStepIndex: task.currentStepIndex,
            totalSteps: task.totalSteps,
            completed: task.completed,
          },
          source: "task_execution",
          importance: "high",
          confidence: 1.0,
          orgScope: session.organizationId,
          userScope: session.userId,
          productScope: session.activeProductId,
        });
      }
    }
  }

  /**
   * Retrieves turns for a session.
   */
  public getTurns(sessionId: string): MessageTurn[] {
    return this.sessions.get(sessionId)?.turns || [];
  }

  /**
   * Clears or prunes old turns.
   */
  public clear(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.turns = [];
      session.workingTaskState = undefined;
      session.updatedAt = new Date().toISOString();
    }
  }
}

export const ConversationManager = new ConversationManagerService();

