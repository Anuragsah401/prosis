/**
 * @prosis/proactive - Type Definitions for Proactive Intelligence System
 * Defines the epistemic trust taxonomy, autonomy levels, anomaly models,
 * proactive briefing structures, and user control policies.
 */

export type EpistemicStatus = "observed" | "inferred" | "recommended" | "executed";

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export const AUTONOMY_LEVEL_LABELS: Record<AutonomyLevel, { name: string; description: string }> = {
  0: {
    name: "Level 0: Observe Only",
    description: "Monitors business events in the background and logs to telemetry. Never interrupts with unprompted recommendations or actions.",
  },
  1: {
    name: "Level 1: Recommend",
    description: "Surfaces observed anomalies and provides contextual recommendations. Awaits explicit user instruction before staging or taking action (Default).",
  },
  2: {
    name: "Level 2: Prepare Actions",
    description: "Automatically analyzes root causes and stages action drafts (e.g. prepares email copy or task plans), pausing for human approval.",
  },
  3: {
    name: "Level 3: Execute Low-Risk Actions",
    description: "Automatically executes safe, non-destructive operations (cache warming, internal reporting, analytics pre-computation); pauses for outbound/destructive steps.",
  },
  4: {
    name: "Level 4: Execute Approved Workflows",
    description: "Autonomously executes end-to-end approved operational workflows with immutable audit logging. Requires explicit administrative opt-in.",
  },
};

export type AnomalyCategory =
  | "reservation_drop"
  | "unusual_cancellation_rate"
  | "failed_emails"
  | "new_leads"
  | "unanswered_support_requests"
  | "important_deadlines"
  | "system_errors"
  | "unusual_revenue_changes";

export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export interface BusinessAnomaly {
  id: string;
  product: string;
  category: AnomalyCategory;
  title: string;
  severity: AnomalySeverity;
  epistemic: EpistemicStatus;
  whatHappened: string; // STRICT OBSERVED GROUND TRUTH (Never an inference)
  whyItMatters: string; // INFERRED BUSINESS IMPACT OR ROOT CAUSE
  recommendedAction: string; // RECOMMENDED INTERVENTION
  investigationPrompt: string; // e.g. "Would you like me to investigate?"
  importanceScore: number; // 0.0 to 1.0
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ProactiveBriefingItem {
  index: number;
  type: "anomaly" | "pending_task" | "opportunity";
  title: string;
  epistemic: EpistemicStatus;
  description: string;
  details?: {
    observedFact?: string;
    inferredImpact?: string;
    recommendation?: string;
  };
  actionLabel?: string;
  actionDirective?: string;
  metadata?: Record<string, unknown>;
}

export interface ProactiveBriefing {
  id: string;
  organizationId: string;
  greeting: string;
  headline: string;
  items: [ProactiveBriefingItem, ProactiveBriefingItem, ProactiveBriefingItem]; // Exactly 3 concise items
  followUpPrompt: string;
  spokenText: string;
  timestamp: string;
  autonomyLevel: AutonomyLevel;
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // "HH:MM", e.g. "22:00"
  end: string; // "HH:MM", e.g. "07:00"
  timezone: string;
}

export interface ProactiveSettings {
  notificationsEnabled: boolean;
  quietHours: QuietHoursConfig;
  monitoredProducts: string[];
  importanceThreshold: number; // 0.0 - 1.0 (default 0.60)
  autonomyLevel: AutonomyLevel; // Default: 1 (NEVER 4)
  automaticActionsAllowed: string[];
}

