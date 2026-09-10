/**
 * @prosis/proactive - Anomaly Detection Engine
 * Continuously evaluates live business events and telemetry against importance thresholds.
 * Strictly separates Observed Facts, Inferred Impacts, and Recommended Actions.
 */

import { BusinessAnomaly, AnomalyCategory } from "./types";

export class AnomalyDetector {
  private static mockAnomalies: BusinessAnomaly[] = [
    {
      id: "anom_res_drop_cantina",
      product: "seatbooking",
      category: "reservation_drop",
      title: "Cantina Bella Reservation Drop",
      severity: "high",
      epistemic: "observed",
      whatHappened: "Reservations at Cantina Bella are down 34% compared with the previous week (48 covers vs 73 covers).",
      whyItMatters: "Current pacing indicates a projected revenue shortfall of $3,800 for the upcoming weekend dinner service.",
      recommendedAction: "Launch an automated mid-week VIP re-engagement campaign offering chef's table pairings to 24 previous diners.",
      investigationPrompt: "Would you like me to investigate why Cantina Bella bookings declined?",
      importanceScore: 0.88,
      timestamp: new Date().toISOString(),
      metadata: {
        restaurantId: "rest-02",
        restaurantName: "Cantina Bella",
        currentCovers: 48,
        previousCovers: 73,
        percentChange: -34.2,
      },
    },
    {
      id: "anom_cancel_rate_verdant",
      product: "seatbooking",
      category: "unusual_cancellation_rate",
      title: "Verdant Bistro Cancellation Spike",
      severity: "medium",
      epistemic: "observed",
      whatHappened: "Cancellation rate at Verdant Bistro spiked to 28.4% over the last 48 hours (historical portfolio baseline is 11.2%).",
      whyItMatters: "High cancellations leave prime 19:30–21:00 slots unfulfilled without adequate standby notice.",
      recommendedAction: "Activate the Seatbooking dynamic waitlist auto-release rule for prime dinner tables.",
      investigationPrompt: "Would you like me to investigate the cancellation reasons at Verdant Bistro?",
      importanceScore: 0.72,
      timestamp: new Date().toISOString(),
      metadata: {
        restaurantId: "rest-03",
        restaurantName: "Verdant Bistro",
        cancellationRate: 28.4,
        baselineRate: 11.2,
      },
    },
    {
      id: "anom_email_dispatch_fail",
      product: "marketing",
      category: "failed_emails",
      title: "Outbound Recovery Email Delivery Failure",
      severity: "high",
      epistemic: "observed",
      whatHappened: "Two outbound executive campaign recovery emails encountered SMTP delivery failures due to invalid recipient addresses.",
      whyItMatters: "General managers at targeted venues have not received critical booking revitalization alerts.",
      recommendedAction: "Verify secondary contact emails or escalate alert directly to the regional operations dashboard.",
      investigationPrompt: "Would you like me to inspect the failed email recipients?",
      importanceScore: 0.79,
      timestamp: new Date().toISOString(),
      metadata: {
        failedCount: 2,
        campaignId: "camp_recovery_01",
        reason: "550 User mailbox not found",
      },
    },
    {
      id: "anom_vip_lead_detected",
      product: "marketing",
      category: "new_leads",
      title: "High-Value Corporate Gala Inquiry",
      severity: "medium",
      epistemic: "observed",
      whatHappened: "A new inquiry for an 85-guest corporate holiday banquet ($18,500 budget) was received via the private events form.",
      whyItMatters: "Inquiry response time within 60 minutes yields an 82% booking conversion rate for fourth-quarter banquets.",
      recommendedAction: "Assign lead to the Senior Events Director with an auto-drafted private dining proposal.",
      investigationPrompt: "Would you like me to prepare a bespoke event package for this inquiry?",
      importanceScore: 0.81,
      timestamp: new Date().toISOString(),
      metadata: {
        leadName: "Apex Capital Partners",
        headcount: 85,
        targetBudget: 18500,
      },
    },
    {
      id: "anom_sla_support_breach",
      product: "seatbooking",
      category: "unanswered_support_requests",
      title: "VIP Private Dining Requests Pending Past SLA",
      severity: "medium",
      epistemic: "observed",
      whatHappened: "Three VIP guest concierge dining requests have remained unanswered for over 2.5 hours (SLA policy is under 60 minutes).",
      whyItMatters: "Two guests represent tier-1 repeat clientele with average spend exceeding $650 per seating.",
      recommendedAction: "Route priority alert to the Duty Concierge Sommelier on mobile terminal.",
      investigationPrompt: "Would you like me to draft concierge response confirmations for these guests?",
      importanceScore: 0.74,
      timestamp: new Date().toISOString(),
      metadata: {
        pendingCount: 3,
        longestWaitMinutes: 154,
      },
    },
    {
      id: "anom_liquor_deadline",
      product: "workforce",
      category: "important_deadlines",
      title: "Municipal Liquor License Renewal Filing Due",
      severity: "critical",
      epistemic: "observed",
      whatHappened: "The annual beverage & liquor service compliance recertification filing for Kuro Omakase is due in 48 hours.",
      whyItMatters: "Failure to submit prior to Friday 17:00 results in statutory late inspection fines and mandatory weekend service restrictions.",
      recommendedAction: "Review pre-filled municipal compliance documentation and submit authorization.",
      investigationPrompt: "Would you like me to pull the license renewal documents for review?",
      importanceScore: 0.95,
      timestamp: new Date().toISOString(),
      metadata: {
        venue: "Kuro Omakase",
        deadlineHoursRemaining: 48,
        penaltyRisk: "Service suspension",
      },
    },
    {
      id: "anom_pos_latency_spike",
      product: "system",
      category: "system_errors",
      title: "POS Webhook Sync Latency Spike",
      severity: "medium",
      epistemic: "observed",
      whatHappened: "POS reservation bridge response latency increased from 42ms to 320ms on cluster node B.",
      whyItMatters: "Table check-in synchronization may lag during peak 19:30 rush, causing momentary walk-in double booking risk.",
      recommendedAction: "Switch upstream socket pool to standby node C and cycle connection worker threads.",
      investigationPrompt: "Would you like me to trigger safe failover to standby node C?",
      importanceScore: 0.68,
      timestamp: new Date().toISOString(),
      metadata: {
        baselineMs: 42,
        currentMs: 320,
        node: "node_b_east",
      },
    },
    {
      id: "anom_weekend_revenue_surge",
      product: "analytics",
      category: "unusual_revenue_changes",
      title: "Weekend Premium Beverage Revenue Surge",
      severity: "low",
      epistemic: "observed",
      whatHappened: "Weekend beverage revenue paced +38% ($4,600) higher than the 30-day trailing model at L'Atelier Lumière.",
      whyItMatters: "High cellar draw may deplete reserve champagne vintages prior to Saturday's sold-out pairings.",
      recommendedAction: "Trigger cellar restocking order for Dom Pérignon and reserve Barolo vintages.",
      investigationPrompt: "Would you like me to inspect cellar inventory levels?",
      importanceScore: 0.62,
      timestamp: new Date().toISOString(),
      metadata: {
        deltaPercent: +38.0,
        deltaDollars: 4600,
        venue: "L'Atelier Lumière",
      },
    },
    {
      id: "anom_minor_noise_event",
      product: "seatbooking",
      category: "reservation_drop",
      title: "Minor Sub-Threshold Table Adjustment",
      severity: "low",
      epistemic: "observed",
      whatHappened: "Table 4 party adjusted from 4 guests to 3 guests.",
      whyItMatters: "Minor capacity delta of 1 cover.",
      recommendedAction: "No action required.",
      investigationPrompt: "Would you like more details?",
      importanceScore: 0.25, // Sub-threshold noise
      timestamp: new Date().toISOString(),
      metadata: {},
    },
  ];

  /**
   * Retrieves business anomalies filtered by minimum importance score and monitored products.
   * Eliminates meaningless sub-threshold notifications.
   */
  public static detectAnomalies(options?: {
    minImportance?: number;
    monitoredProducts?: string[];
  }): BusinessAnomaly[] {
    const threshold = options?.minImportance ?? 0.6;
    const monitored = options?.monitoredProducts;

    return this.mockAnomalies
      .filter((anomaly) => {
        if (anomaly.importanceScore < threshold) return false;
        if (monitored && monitored.length > 0 && !monitored.includes(anomaly.product)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.importanceScore - a.importanceScore);
  }

  /**
   * Finds a specific anomaly by ID.
   */
  public static getById(id: string): BusinessAnomaly | undefined {
    return this.mockAnomalies.find((a) => a.id === id);
  }

  /**
   * Registers a newly observed anomaly dynamically.
   */
  public static registerAnomaly(anomaly: BusinessAnomaly): void {
    this.mockAnomalies.unshift(anomaly);
  }
}

