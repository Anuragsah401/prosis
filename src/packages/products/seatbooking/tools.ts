import { z } from "zod";
import { ToolDefinition } from "@prosis/tools";
import { SeatbookingService } from "./data";

const PRODUCT_ID = "seatbooking";

// Common Schemas
const RestaurantSchema = z.object({
  id: z.string(),
  organizationId: z.string().optional(),
  name: z.string(),
  cuisine: z.string(),
  location: z.string(),
  managerName: z.string(),
  managerEmail: z.string(),
  todayBookings: z.number(),
  capacityBookedPercent: z.number(),
  weeklyTrendPercent: z.number(),
  avgPartySize: z.number(),
  status: z.enum(["active", "alert", "optimal"]),
  summary: z.string(),
  cancellationRatePercent: z.number().optional(),
  totalTables: z.number().optional(),
});

const ReservationSchema = z.object({
  id: z.string(),
  organizationId: z.string().optional(),
  restaurantId: z.string(),
  restaurantName: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  partySize: z.number(),
  timeSlot: z.string(),
  date: z.string(),
  status: z.enum(["confirmed", "seated", "cancelled", "waitlist"]),
  notes: z.string().optional(),
  vip: z.boolean(),
});

const CustomerProfileSchema = z.object({
  id: z.string(),
  organizationId: z.string().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  vip: z.boolean(),
  totalVisits: z.number(),
  dietaryNotes: z.string().optional(),
  favoriteVenue: z.string().optional(),
  pastReservations: z.array(
    z.object({
      id: z.string(),
      restaurantName: z.string(),
      date: z.string(),
      partySize: z.number(),
      status: z.string(),
    })
  ),
});

const RestaurantAnalyticsSchema = z.object({
  restaurantId: z.string(),
  restaurantName: z.string(),
  period: z.string(),
  totalBookings: z.number(),
  totalCovers: z.number(),
  capacityBookedPercent: z.number(),
  weeklyTrendPercent: z.number(),
  cancellationRatePercent: z.number(),
  averagePartySize: z.number(),
  peakHours: z.array(z.string()),
  pacingStatus: z.enum(["active", "alert", "optimal", "warning"]),
  executiveSummary: z.string(),
});

const ReservationAnalyticsSchema = z.object({
  period: z.string(),
  totalBookings: z.number(),
  totalCovers: z.number(),
  occupancyRatePercent: z.number(),
  overallCancellationRatePercent: z.number(),
  weeklyPacingTrendPercent: z.number(),
  projectedRevenueUsd: z.number(),
  topVenues: z.array(
    z.object({
      name: z.string(),
      covers: z.number(),
      pacing: z.number(),
    })
  ),
  alertVenues: z.array(
    z.object({
      name: z.string(),
      trend: z.number(),
      reason: z.string(),
    })
  ),
});

// ============================================================================
// 1. getRestaurants (Read)
// ============================================================================
export const getRestaurantsTool: ToolDefinition = {
  name: "seatbooking_getRestaurants",
  productId: PRODUCT_ID,
  description: "Retrieves list of restaurants filtered by cuisine, operational status, or location.",
  inputSchema: z.object({
    cuisine: z.string().optional().describe("Filter by cuisine type (e.g. Italian, French)"),
    status: z.string().optional().describe("Filter by status (optimal, alert, active)"),
    location: z.string().optional().describe("Filter by geographic location"),
  }),
  outputSchema: z.array(RestaurantSchema),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "restaurants",
  },
  execute: async (input: any, context) => {
    return SeatbookingService.getRestaurants(context.organization.id, input);
  },
};

// ============================================================================
// 2. getRestaurant (Read)
// ============================================================================
export const getRestaurantTool: ToolDefinition = {
  name: "seatbooking_getRestaurant",
  productId: PRODUCT_ID,
  description: "Retrieves complete restaurant venue profile, capacity pacing, and management info.",
  inputSchema: z.object({
    restaurantId: z.string().describe("Unique restaurant ID or exact name"),
  }),
  outputSchema: RestaurantSchema.nullable(),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "restaurants",
  },
  execute: async (input: any, context) => {
    const restaurant = SeatbookingService.getRestaurant(context.organization.id, input.restaurantId);
    return restaurant || null;
  },
};

// ============================================================================
// 3. getReservations (Read)
// ============================================================================
export const getReservationsTool: ToolDefinition = {
  name: "seatbooking_getReservations",
  productId: PRODUCT_ID,
  description: "Retrieves table reservations with customer details, times, party sizes, and status.",
  inputSchema: z.object({
    restaurantId: z.string().optional().describe("Optional filter by restaurant ID"),
    date: z.string().optional().describe("Date filter (e.g. 'Today', 'Tomorrow', or 'YYYY-MM-DD')"),
    status: z.string().optional().describe("Filter by reservation status"),
    dateRange: z
      .object({
        start: z.string().describe("Start date"),
        end: z.string().describe("End date"),
      })
      .optional()
      .describe("Optional date range"),
  }),
  outputSchema: z.array(ReservationSchema),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "reservations",
  },
  execute: async (input: any, context) => {
    return SeatbookingService.getReservations(context.organization.id, input);
  },
};

// ============================================================================
// 4. getReservation (Read)
// ============================================================================
export const getReservationTool: ToolDefinition = {
  name: "seatbooking_getReservation",
  productId: PRODUCT_ID,
  description: "Retrieves details of a specific table reservation by ID.",
  inputSchema: z.object({
    reservationId: z.string().describe("Unique reservation ID (e.g. res-901)"),
  }),
  outputSchema: ReservationSchema.nullable(),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "reservations",
  },
  execute: async (input: any, context) => {
    const reservation = SeatbookingService.getReservation(context.organization.id, input.reservationId);
    return reservation || null;
  },
};

// ============================================================================
// 5. getCustomer (Read)
// ============================================================================
export const getCustomerTool: ToolDefinition = {
  name: "seatbooking_getCustomer",
  productId: PRODUCT_ID,
  description: "Retrieves customer guest profile, VIP status, dietary preferences, and visit history.",
  inputSchema: z.object({
    customerId: z.string().optional().describe("Unique customer ID"),
    email: z.string().optional().describe("Customer email address"),
    phone: z.string().optional().describe("Customer phone number"),
    name: z.string().optional().describe("Customer full name"),
  }),
  outputSchema: CustomerProfileSchema.nullable(),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "customers",
  },
  execute: async (input: any, context) => {
    const customer = SeatbookingService.getCustomer(context.organization.id, input);
    return customer || null;
  },
};

// ============================================================================
// 6. getRestaurantAnalytics (Read)
// ============================================================================
export const getRestaurantAnalyticsTool: ToolDefinition = {
  name: "seatbooking_getRestaurantAnalytics",
  productId: PRODUCT_ID,
  description: "Gathers deep analytics, cover pacing, peak hours, and cancellation velocities for a specific restaurant.",
  inputSchema: z.object({
    restaurantId: z.string().describe("Target restaurant ID (e.g. rest-02)"),
    period: z.string().optional().describe("Time period (e.g. last_7_days, last_30_days)"),
  }),
  outputSchema: RestaurantAnalyticsSchema,
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "analytics",
  },
  execute: async (input: any, context) => {
    return SeatbookingService.getRestaurantAnalytics(
      context.organization.id,
      input.restaurantId,
      input.period
    );
  },
};

// ============================================================================
// 7. getReservationAnalytics (Read)
// ============================================================================
export const getReservationAnalyticsTool: ToolDefinition = {
  name: "seatbooking_getReservationAnalytics",
  productId: PRODUCT_ID,
  description: "Aggregates macro reservation metrics, global covers, portfolio cancellation rates, and revenue pacing.",
  inputSchema: z.object({
    timeRange: z.string().optional().describe("Time range (current_week, last_week, this_month)"),
    restaurantId: z.string().optional().describe("Optional restaurant filter"),
  }),
  outputSchema: ReservationAnalyticsSchema,
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "analytics",
  },
  execute: async (input: any, context) => {
    return SeatbookingService.getReservationAnalytics(context.organization.id, input);
  },
};

// ============================================================================
// 8. createReservation (Write -> Human Confirmation)
// ============================================================================
export const createReservationTool: ToolDefinition = {
  name: "seatbooking_createReservation",
  productId: PRODUCT_ID,
  description: "Allocates a new table reservation for a guest at a specific restaurant venue.",
  inputSchema: z.object({
    restaurantId: z.string().describe("Target restaurant ID"),
    customerName: z.string().describe("Guest full name"),
    customerEmail: z.string().describe("Guest email address"),
    customerPhone: z.string().optional().describe("Guest phone number"),
    partySize: z.number().min(1).describe("Number of guests"),
    timeSlot: z.string().describe("Time slot (e.g. '19:30')"),
    date: z.string().describe("Date ('Today', 'Tomorrow', or YYYY-MM-DD)"),
    notes: z.string().optional().describe("Dietary requirements or special requests"),
    vip: z.boolean().optional().describe("Mark as VIP guest"),
  }),
  outputSchema: ReservationSchema,
  permissionsRequired: ["seatbooking.reservations.write"],
  requiresApproval: true,
  auditMetadata: {
    category: "mutation",
    impactLevel: "medium",
    reversible: true,
    resourceType: "reservation",
  },
  buildApprovalPayload: async (input: any, context) => {
    const rest = SeatbookingService.getRestaurant(context.organization.id, input.restaurantId);
    return {
      toolName: "seatbooking_createReservation",
      parameters: input,
      summary: `Book table for ${input.customerName} (${input.partySize} guests) at ${rest?.name || input.restaurantId}`,
      affectedEntities: [
        {
          type: "restaurant",
          id: input.restaurantId,
          name: rest?.name || "Restaurant",
        },
        {
          type: "guest",
          id: input.customerEmail,
          name: input.customerName,
        },
      ],
      impactDescription: `A confirmed booking for ${input.partySize} guests at ${input.timeSlot} on ${input.date} will be created. Table capacity will be reserved.`,
      proposedChanges: {
        guest: input.customerName,
        partySize: input.partySize,
        timeSlot: input.timeSlot,
        date: input.date,
        restaurant: rest?.name || input.restaurantId,
      },
    };
  },
  execute: async (input: any, context) => {
    return SeatbookingService.createReservation(context.organization.id, input);
  },
};

// ============================================================================
// 9. updateReservation (Write -> Human Confirmation)
// ============================================================================
export const updateReservationTool: ToolDefinition = {
  name: "seatbooking_updateReservation",
  productId: PRODUCT_ID,
  description: "Modifies an existing table reservation (time, party size, date, or notes).",
  inputSchema: z.object({
    reservationId: z.string().describe("Unique reservation ID to modify"),
    partySize: z.number().optional().describe("New party size"),
    timeSlot: z.string().optional().describe("New time slot"),
    date: z.string().optional().describe("New date"),
    notes: z.string().optional().describe("Updated notes"),
    status: z.enum(["confirmed", "seated", "cancelled", "waitlist"]).optional(),
  }),
  outputSchema: ReservationSchema,
  permissionsRequired: ["seatbooking.reservations.write"],
  requiresApproval: true,
  auditMetadata: {
    category: "mutation",
    impactLevel: "medium",
    reversible: true,
    resourceType: "reservation",
  },
  buildApprovalPayload: async (input: any, context) => {
    const res = SeatbookingService.getReservation(context.organization.id, input.reservationId);
    return {
      toolName: "seatbooking_updateReservation",
      parameters: input,
      summary: `Modify reservation ${input.reservationId} for ${res?.customerName || "Guest"}`,
      affectedEntities: [
        {
          type: "reservation",
          id: input.reservationId,
          name: `${res?.customerName || "Guest"} at ${res?.restaurantName || "Restaurant"}`,
        },
      ],
      impactDescription: `Reservation ${input.reservationId} parameters will be altered in the Seatbooking operations schedule.`,
      proposedChanges: {
        original: {
          partySize: res?.partySize,
          timeSlot: res?.timeSlot,
          date: res?.date,
          status: res?.status,
        },
        updates: {
          partySize: input.partySize ?? res?.partySize,
          timeSlot: input.timeSlot ?? res?.timeSlot,
          date: input.date ?? res?.date,
          status: input.status ?? res?.status,
        },
      },
    };
  },
  execute: async (input: any, context) => {
    return SeatbookingService.updateReservation(
      context.organization.id,
      input.reservationId,
      input
    );
  },
};

// ============================================================================
// 10. cancelReservation (Write -> Destructive Human Confirmation)
// ============================================================================
export const cancelReservationTool: ToolDefinition = {
  name: "seatbooking_cancelReservation",
  productId: PRODUCT_ID,
  description: "Cancels an existing table reservation and releases the allocated capacity.",
  inputSchema: z.object({
    reservationId: z.string().describe("Unique reservation ID"),
    reason: z.string().describe("Reason for cancellation"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    reservation: ReservationSchema,
  }),
  permissionsRequired: ["seatbooking.reservations.write"],
  requiresApproval: true,
  auditMetadata: {
    category: "mutation",
    impactLevel: "high",
    reversible: false,
    resourceType: "reservation",
  },
  buildApprovalPayload: async (input: any, context) => {
    const res = SeatbookingService.getReservation(context.organization.id, input.reservationId);
    return {
      toolName: "seatbooking_cancelReservation",
      parameters: input,
      summary: `Cancel reservation for ${res?.customerName || "Customer"} at ${res?.restaurantName || "Restaurant"}`,
      affectedEntities: [
        {
          type: "reservation",
          id: input.reservationId,
          name: `${res?.customerName || "Customer"} (${res?.partySize || 2} guests)`,
        },
        {
          type: "restaurant",
          id: res?.restaurantId || "",
          name: res?.restaurantName || "Restaurant",
        },
      ],
      impactDescription: `Reservation ${input.reservationId} for ${res?.partySize || 4} guests at ${res?.timeSlot || "19:30"} will be voided and the table released.`,
      proposedChanges: {
        currentStatus: res?.status || "confirmed",
        newStatus: "cancelled",
        cancellationReason: input.reason,
      },
    };
  },
  execute: async (input: any, context) => {
    return SeatbookingService.cancelReservation(
      context.organization.id,
      input.reservationId,
      input.reason
    );
  },
};

// ============================================================================
// Additional Supporting Tools (Briefing, Campaigns, Communications)
// ============================================================================

export const getDailyBriefingTool: ToolDefinition = {
  name: "seatbooking_getDailyBriefing",
  productId: PRODUCT_ID,
  description: "Gathers high-level business intelligence, total covers, pacing, and alerts across all restaurants for today.",
  inputSchema: z.object({}).optional(),
  outputSchema: z.object({
    totalReservationsToday: z.number(),
    totalCoversToday: z.number(),
    occupancyRatePercent: z.number(),
    activeRestaurants: z.number(),
    decliningRestaurantsCount: z.number(),
    revenuePacedUsd: z.number(),
    topPerforming: z.string(),
    attentionNeeded: z.string(),
  }),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "analytics",
  },
  execute: async (_input: any, context) => {
    return SeatbookingService.getDailyBriefing(context.organization.id);
  },
};

export const getDecliningRestaurantsTool: ToolDefinition = {
  name: "seatbooking_getDecliningRestaurants",
  productId: PRODUCT_ID,
  description: "Identifies restaurants experiencing declining booking velocities and negative capacity trends.",
  inputSchema: z.object({}).optional(),
  outputSchema: z.array(RestaurantSchema),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "restaurants",
  },
  execute: async (_input: any, context) => {
    return SeatbookingService.getDecliningRestaurants(context.organization.id);
  },
};

export const prepareCampaignDraftsTool: ToolDefinition = {
  name: "seatbooking_prepareCampaignDrafts",
  productId: PRODUCT_ID,
  description: "Generates tailored email communications and revitalization plans for restaurants with declining bookings.",
  inputSchema: z.object({
    targetRestaurantIds: z.array(z.string()).optional().describe("IDs of restaurants to target"),
  }),
  outputSchema: z.object({
    count: z.number(),
    drafts: z.array(
      z.object({
        restaurantId: z.string(),
        restaurantName: z.string(),
        recipientEmail: z.string(),
        managerName: z.string(),
        subject: z.string(),
        headline: z.string(),
        proposedAction: z.string(),
        bodyPreview: z.string(),
        requiresApprovalBeforeSending: z.boolean(),
      })
    ),
  }),
  permissionsRequired: ["seatbooking.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "system",
    impactLevel: "low",
    reversible: true,
    resourceType: "campaign_drafts",
  },
  execute: async (input: any, context) => {
    const declining = SeatbookingService.getDecliningRestaurants(context.organization.id);
    const targets = input?.targetRestaurantIds?.length
      ? declining.filter((r) => input.targetRestaurantIds.includes(r.id))
      : declining;

    const drafts = targets.map((rest) => ({
      restaurantId: rest.id,
      restaurantName: rest.name,
      recipientEmail: rest.managerEmail,
      managerName: rest.managerName,
      subject: `[Prosis Operating Alert] Revitalization strategy for ${rest.name}`,
      headline: `Weekday cover velocity drop detected (${rest.weeklyTrendPercent}% trend)`,
      proposedAction: "Launch mid-week Chef's Table promotional campaign to loyal guests",
      bodyPreview: `Dear ${rest.managerName},\n\nProsis analytics flagged a ${Math.abs(
        rest.weeklyTrendPercent
      )}% decline in weekly table bookings for ${rest.name}. Current capacity pacing is at ${
        rest.capacityBookedPercent
      }%.\n\nWe have formulated an automated VIP re-engagement campaign offering early booking privileges and seasonal pairings. Please review and confirm deployment.`,
      requiresApprovalBeforeSending: true,
    }));

    return {
      count: drafts.length,
      drafts,
    };
  },
};

export const sendEmailTool: ToolDefinition = {
  name: "seatbooking_sendEmail",
  productId: PRODUCT_ID,
  description: "Dispatches external emails to restaurant managers, partners, or customers.",
  inputSchema: z.object({
    restaurantId: z.string().describe("Target restaurant ID"),
    recipientEmail: z.string().email().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email content"),
  }),
  outputSchema: z.object({
    dispatchedTo: z.string(),
    messageId: z.string(),
    timestamp: z.string(),
  }),
  permissionsRequired: ["seatbooking.communications.send"],
  requiresApproval: true,
  auditMetadata: {
    category: "communication",
    impactLevel: "medium",
    reversible: false,
    resourceType: "email_dispatch",
  },
  buildApprovalPayload: async (input: any, context) => {
    const rest = SeatbookingService.getRestaurant(context.organization.id, input.restaurantId);
    return {
      toolName: "seatbooking_sendEmail",
      parameters: input,
      summary: `Send official operational briefing to ${rest?.name || input.restaurantId}`,
      affectedEntities: [
        {
          type: "restaurant",
          id: input.restaurantId,
          name: rest?.name || "Restaurant",
        },
        {
          type: "recipient",
          id: input.recipientEmail,
          name: input.recipientEmail,
        },
      ],
      impactDescription: `External email will be immediately delivered to ${input.recipientEmail}. This cannot be undone once dispatched.`,
      proposedChanges: {
        recipient: input.recipientEmail,
        subject: input.subject,
        preview: input.body.substring(0, 120) + "...",
      },
    };
  },
  execute: async (input: any, context) => {
    return SeatbookingService.sendManagerCampaignEmail(
      input.restaurantId,
      input.subject,
      input.body,
      context.organization.id
    );
  },
};

// Tool collection export for product registration
export const SEATBOOKING_TOOLS: ToolDefinition[] = [
  getRestaurantsTool,
  getRestaurantTool,
  getReservationsTool,
  getReservationTool,
  getCustomerTool,
  getRestaurantAnalyticsTool,
  getReservationAnalyticsTool,
  createReservationTool,
  updateReservationTool,
  cancelReservationTool,
  getDailyBriefingTool,
  getDecliningRestaurantsTool,
  prepareCampaignDraftsTool,
  sendEmailTool,
];
