import { z } from "zod";
import { ToolDefinition } from "@prosis/tools";
import { SeatbookingService } from "../seatbooking/data";
import { WORKFORCE_SCHEDULES } from "../workforce/tools";

export const getExecutiveDashboardTool: ToolDefinition = {
  name: "analytics_getExecutiveDashboard",
  productId: "analytics",
  description: "Aggregates high-level enterprise metrics across revenue, occupancy, and labor efficiency.",
  inputSchema: z.object({
    period: z.string().optional().describe("Reporting period ('today', 'week_to_date', 'month_to_date')"),
  }),
  outputSchema: z.object({
    period: z.string(),
    totalRevenueUsd: z.number(),
    averageOccupancyPercent: z.number(),
    activePropertiesCount: z.number(),
    laborCostRatioPercent: z.number(),
    criticalAlertsCount: z.number(),
    summary: z.string(),
  }),
  permissionsRequired: ["analytics.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "analytics",
  },
  execute: async (input: any, context) => {
    const briefing = SeatbookingService.getDailyBriefing(context?.organization?.id || "org_acme_corp");
    return {
      period: input?.period || "today",
      totalRevenueUsd: briefing.revenuePacedUsd,
      averageOccupancyPercent: briefing.occupancyRatePercent,
      activePropertiesCount: briefing.activeRestaurants,
      laborCostRatioPercent: 28.4,
      criticalAlertsCount: 2,
      summary: "High booking demand in prime properties is outrunning floor staff allocations.",
    };
  },
};

export const correlatePacingAndLaborTool: ToolDefinition = {
  name: "analytics_correlatePacingAndLabor",
  productId: "analytics",
  description: "Cross-correlates Seatbooking reservation pacing with Workforce shift rosters to identify restaurants with rising demand but insufficient staffing.",
  inputSchema: z.object({
    minTrendPercent: z.number().optional().describe("Minimum positive weekly booking trend percent (default: 0%)"),
  }),
  outputSchema: z.object({
    matchedCount: z.number(),
    riskSummary: z.string(),
    correlations: z.array(
      z.object({
        restaurantId: z.string(),
        restaurantName: z.string(),
        cuisine: z.string(),
        todayBookings: z.number(),
        capacityBookedPercent: z.number(),
        weeklyTrendPercent: z.number(),
        scheduledHeadcount: z.number(),
        requiredHeadcount: z.number(),
        staffDeficit: z.number(),
        riskLevel: z.enum(["critical", "high", "moderate"]),
        recommendation: z.string(),
      })
    ),
  }),
  permissionsRequired: ["analytics.read", "seatbooking.read", "workforce.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "cross_product_intelligence",
  },
  execute: async (_input: any, context) => {
    const orgId = context?.organization?.id || "org_acme_corp";
    const restaurants = SeatbookingService.getAllRestaurants(orgId);

    // 1. Filter restaurants with increasing bookings
    const growingRestaurants = restaurants.filter((r) => r.weeklyTrendPercent > 0);

    // 2. Correlate with workforce schedules
    const results: any[] = [];
    for (const rest of growingRestaurants) {
      const schedule = WORKFORCE_SCHEDULES.find((s) => s.restaurantId === rest.id);
      if (schedule && schedule.deficitCount < 0) {
        results.push({
          restaurantId: rest.id,
          restaurantName: rest.name,
          cuisine: rest.cuisine,
          todayBookings: rest.todayBookings,
          capacityBookedPercent: rest.capacityBookedPercent,
          weeklyTrendPercent: rest.weeklyTrendPercent,
          scheduledHeadcount: schedule.scheduledHeadcount,
          requiredHeadcount: schedule.requiredHeadcount,
          staffDeficit: Math.abs(schedule.deficitCount),
          riskLevel: Math.abs(schedule.deficitCount) >= 5 ? ("critical" as const) : ("high" as const),
          recommendation: `Deploy ${Math.abs(schedule.deficitCount)} additional on-call servers/cooks to handle +${rest.weeklyTrendPercent}% dining cover surge.`,
        });
      }
    }

    return {
      matchedCount: results.length,
      riskSummary: `Identified ${results.length} properties experiencing surging dining demand (+${results.map((r) => r.weeklyTrendPercent).join("%, +")}%) with severe labor headcount deficits.`,
      correlations: results,
    };
  },
};

export const ANALYTICS_TOOLS = [getExecutiveDashboardTool, correlatePacingAndLaborTool];

