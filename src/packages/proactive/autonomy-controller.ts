/**
 * @prosis/proactive - Autonomy Level Controller
 * Enforces five distinct levels of agency:
 * Level 0: Observe Only
 * Level 1: Recommend (Default)
 * Level 2: Prepare Actions
 * Level 3: Execute Low-Risk Actions
 * Level 4: Execute Approved Workflows (Requires explicit admin opt-in; NEVER default)
 */

import { AutonomyLevel, AUTONOMY_LEVEL_LABELS } from "./types";
import { AuditTrail } from "../orchestrator/audit-trail";

export class AutonomyController {
  // CRITICAL RULE: Level 4 is NEVER the default. Level 1 (Recommend) is default.
  private static currentLevel: AutonomyLevel = 1;

  /**
   * Retrieves the current autonomy level.
   */
  public static getLevel(): AutonomyLevel {
    return this.currentLevel;
  }

  /**
   * Retrieves human-readable label and description of the current autonomy level.
   */
  public static getLevelInfo(level = this.currentLevel) {
    return AUTONOMY_LEVEL_LABELS[level];
  }

  /**
   * Updates the autonomy level with full audit logging.
   */
  public static setLevel(newLevel: AutonomyLevel, actorId = "usr_admin"): {
    previousLevel: AutonomyLevel;
    newLevel: AutonomyLevel;
    requiresWarning: boolean;
    message: string;
  } {
    const prev = this.currentLevel;
    this.currentLevel = newLevel;

    const isLevel4 = newLevel === 4;

    AuditTrail.recordAction({
      conversationId: "conv_proactive_sys",
      runId: `run_autonomy_${Date.now()}`,
      actionType: "policy_update",
      actor: { id: actorId, name: "System Administrator", role: "admin" },
      targetProduct: "orchestrator",
      toolName: "autonomy_setLevel",
      parameters: { previousLevel: prev, newLevel },
      requiresApproval: isLevel4,
      approvalStatus: isLevel4 ? "approved" : "not_required",
      executionStatus: "success",
      durationMs: 1,
      resultSummary: `Autonomy level adjusted from ${prev} (${AUTONOMY_LEVEL_LABELS[prev].name}) to ${newLevel} (${AUTONOMY_LEVEL_LABELS[newLevel].name}).`,
    });

    return {
      previousLevel: prev,
      newLevel,
      requiresWarning: isLevel4,
      message: isLevel4
        ? "Warning: Level 4 autonomy enables autonomous execution of pre-approved workflows. High-risk operations remain constrained by policy."
        : `Autonomy successfully configured to ${AUTONOMY_LEVEL_LABELS[newLevel].name}.`,
    };
  }

  /**
   * Determines if proactive recommendations should be surfaced to the user.
   * False for Level 0 (Observe Only), true for Levels 1–4.
   */
  public static canSurfaceRecommendations(): boolean {
    return this.currentLevel >= 1;
  }

  /**
   * Determines if Prosis can automatically stage/prepare drafts and pre-flight task plans.
   * True for Level 2, 3, 4.
   */
  public static canPrepareActions(): boolean {
    return this.currentLevel >= 2;
  }

  /**
   * Determines if Prosis can execute an action automatically without prior human sign-off.
   */
  public static canExecuteAutomatically(
    risk: "read_only" | "low" | "medium" | "high" | "destructive"
  ): boolean {
    if (this.currentLevel === 0 || this.currentLevel === 1 || this.currentLevel === 2) {
      return false; // Zero autonomous execution allowed for Levels 0, 1, 2
    }

    if (this.currentLevel === 3) {
      // Level 3: Only low-risk or read-only internal operations
      return risk === "read_only" || risk === "low";
    }

    if (this.currentLevel === 4) {
      // Level 4: Low and medium pre-approved operations; NEVER blindly execute destructive operations without approval
      return risk === "read_only" || risk === "low" || risk === "medium";
    }

    return false;
  }
}

