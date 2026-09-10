/**
 * Seatbooking Database & Mock Business API Services
 * Isolated business logic representing the restaurant reservation SaaS platform.
 * Enforces tenant boundary (organizationId), capacity pacing, and server-side operations.
 */

export interface Restaurant {
  id: string;
  organizationId: string;
  name: string;
  cuisine: string;
  location: string;
  managerName: string;
  managerEmail: string;
  todayBookings: number;
  capacityBookedPercent: number;
  weeklyTrendPercent: number; // e.g. -34% indicates declining bookings
  avgPartySize: number;
  status: "active" | "alert" | "optimal";
  summary: string;
  cancellationRatePercent: number;
  totalTables: number;
}

export interface Reservation {
  id: string;
  organizationId: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  timeSlot: string; // e.g. "19:30"
  date: string; // "Today", "Tomorrow", or YYYY-MM-DD
  status: "confirmed" | "seated" | "cancelled" | "waitlist";
  notes?: string;
  vip: boolean;
}

export interface CustomerProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  vip: boolean;
  totalVisits: number;
  dietaryNotes?: string;
  favoriteVenue?: string;
  pastReservations: {
    id: string;
    restaurantName: string;
    date: string;
    partySize: number;
    status: string;
  }[];
}

export interface RestaurantAnalytics {
  restaurantId: string;
  restaurantName: string;
  period: string;
  totalBookings: number;
  totalCovers: number;
  capacityBookedPercent: number;
  weeklyTrendPercent: number;
  cancellationRatePercent: number;
  averagePartySize: number;
  peakHours: string[];
  pacingStatus: "active" | "alert" | "optimal" | "warning";
  executiveSummary: string;
}

export interface ReservationAnalytics {
  period: string;
  totalBookings: number;
  totalCovers: number;
  occupancyRatePercent: number;
  overallCancellationRatePercent: number;
  weeklyPacingTrendPercent: number;
  projectedRevenueUsd: number;
  topVenues: { name: string; covers: number; pacing: number }[];
  alertVenues: { name: string; trend: number; reason: string }[];
}

export interface DailyBriefingStats {
  totalReservationsToday: number;
  totalCoversToday: number;
  occupancyRatePercent: number;
  activeRestaurants: number;
  decliningRestaurantsCount: number;
  revenuePacedUsd: number;
  topPerforming: string;
  attentionNeeded: string;
}

// Seed data with tenant isolation
export const SEATBOOKING_RESTAURANTS: Restaurant[] = [
  {
    id: "rest-01",
    organizationId: "org_acme_corp",
    name: "L'Atelier Lumière",
    cuisine: "Modern French",
    location: "Downtown Metropole",
    managerName: "Chef Henri Laurent",
    managerEmail: "henri@atelierlumiere.com",
    todayBookings: 84,
    capacityBookedPercent: 96,
    weeklyTrendPercent: +14,
    avgPartySize: 2.8,
    status: "optimal",
    summary: "High demand, fully booked through weekend evening service.",
    cancellationRatePercent: 4.2,
    totalTables: 28,
  },
  {
    id: "rest-02",
    organizationId: "org_acme_corp",
    name: "Cantina Bella",
    cuisine: "Coastal Italian",
    location: "Harbor Promenade",
    managerName: "Elena Rossi",
    managerEmail: "elena@cantinabella.it",
    todayBookings: 26,
    capacityBookedPercent: 41,
    weeklyTrendPercent: -34,
    avgPartySize: 3.4,
    status: "alert",
    summary: "Significant 34% drop in weekday dinner covers over the past 14 days.",
    cancellationRatePercent: 18.5,
    totalTables: 22,
  },
  {
    id: "rest-03",
    organizationId: "org_acme_corp",
    name: "Verdant Bistro",
    cuisine: "Organic Farm-to-Table",
    location: "Westside Arts District",
    managerName: "Marcus Thorne",
    managerEmail: "marcus@verdantbistro.com",
    todayBookings: 32,
    capacityBookedPercent: 48,
    weeklyTrendPercent: -28,
    avgPartySize: 2.4,
    status: "alert",
    summary: "Lunch reservations dropped 28% following recent local street repairs.",
    cancellationRatePercent: 15.0,
    totalTables: 18,
  },
  {
    id: "rest-04",
    organizationId: "org_acme_corp",
    name: "Kuro Omakase",
    cuisine: "Contemporary Japanese",
    location: "Financial Quarter",
    managerName: "Kenji Sato",
    managerEmail: "kenji@kuroomakase.com",
    todayBookings: 36,
    capacityBookedPercent: 90,
    weeklyTrendPercent: +8,
    avgPartySize: 2.0,
    status: "optimal",
    summary: "Consistent 2-star Michelin grade pacing; seat turnover stable.",
    cancellationRatePercent: 2.1,
    totalTables: 12,
  },
  {
    id: "rest-05",
    organizationId: "org_acme_corp",
    name: "Aura Rooftop Lounge",
    cuisine: "Pan-Asian Tapas & Cocktails",
    location: "Skyline Tower 42",
    managerName: "Sophia Vance",
    managerEmail: "sophia@aurasky.com",
    todayBookings: 110,
    capacityBookedPercent: 88,
    weeklyTrendPercent: +5,
    avgPartySize: 4.1,
    status: "optimal",
    summary: "Strong cocktail & tapas table rotations; weekend waitlist open.",
    cancellationRatePercent: 6.8,
    totalTables: 36,
  },
];

export const SEATBOOKING_RESERVATIONS: Reservation[] = [
  {
    id: "res-901",
    organizationId: "org_acme_corp",
    restaurantId: "rest-02",
    restaurantName: "Cantina Bella",
    customerName: "John Smith",
    customerEmail: "john.smith@acme-global.com",
    customerPhone: "+1 (555) 234-8901",
    partySize: 4,
    timeSlot: "19:30",
    date: "Today",
    status: "confirmed",
    notes: "Anniversary celebration; requested harbor window booth.",
    vip: true,
  },
  {
    id: "res-902",
    organizationId: "org_acme_corp",
    restaurantId: "rest-03",
    restaurantName: "Verdant Bistro",
    customerName: "Sarah Lin",
    customerEmail: "sarah.lin@creatives.co",
    customerPhone: "+1 (555) 893-4412",
    partySize: 2,
    timeSlot: "20:00",
    date: "Today",
    status: "confirmed",
    notes: "Prefers plant-based tasting menu.",
    vip: false,
  },
  {
    id: "res-903",
    organizationId: "org_acme_corp",
    restaurantId: "rest-01",
    restaurantName: "L'Atelier Lumière",
    customerName: "Arthur Pendelton",
    customerEmail: "pendelton@capitalgroup.org",
    customerPhone: "+1 (555) 771-0023",
    partySize: 6,
    timeSlot: "18:45",
    date: "Today",
    status: "seated",
    notes: "Private tasting alcove reserved.",
    vip: true,
  },
  {
    id: "res-904",
    organizationId: "org_acme_corp",
    restaurantId: "rest-04",
    restaurantName: "Kuro Omakase",
    customerName: "Dr. Elena Rostova",
    customerEmail: "elena.rostova@neurotech.io",
    customerPhone: "+1 (555) 902-1144",
    partySize: 2,
    timeSlot: "19:00",
    date: "Tomorrow",
    status: "confirmed",
    notes: "Strict omakase counter seating requested.",
    vip: true,
  },
  {
    id: "res-905",
    organizationId: "org_acme_corp",
    restaurantId: "rest-02",
    restaurantName: "Cantina Bella",
    customerName: "Marcus Brody",
    customerEmail: "mbrody@designlab.org",
    customerPhone: "+1 (555) 443-8871",
    partySize: 4,
    timeSlot: "20:30",
    date: "Tomorrow",
    status: "confirmed",
    notes: "Guest requested patio heating.",
    vip: false,
  },
  {
    id: "res-906",
    organizationId: "org_acme_corp",
    restaurantId: "rest-05",
    restaurantName: "Aura Rooftop Lounge",
    customerName: "Chloe Davenport",
    customerEmail: "chloe.d@luxventures.com",
    customerPhone: "+1 (555) 312-9988",
    partySize: 8,
    timeSlot: "21:00",
    date: "Tomorrow",
    status: "confirmed",
    notes: "VIP bottle service table held.",
    vip: true,
  },
];

export const SEATBOOKING_CUSTOMERS: CustomerProfile[] = [
  {
    id: "cust-01",
    organizationId: "org_acme_corp",
    name: "John Smith",
    email: "john.smith@acme-global.com",
    phone: "+1 (555) 234-8901",
    vip: true,
    totalVisits: 14,
    dietaryNotes: "Allergic to shellfish; prefers harbor window seats",
    favoriteVenue: "Cantina Bella",
    pastReservations: [
      { id: "res-901", restaurantName: "Cantina Bella", date: "Today", partySize: 4, status: "confirmed" },
      { id: "res-812", restaurantName: "Cantina Bella", date: "2026-02-14", partySize: 2, status: "completed" },
    ],
  },
  {
    id: "cust-02",
    organizationId: "org_acme_corp",
    name: "Sarah Lin",
    email: "sarah.lin@creatives.co",
    phone: "+1 (555) 893-4412",
    vip: false,
    totalVisits: 6,
    dietaryNotes: "Plant-based tasting menu preferred",
    favoriteVenue: "Verdant Bistro",
    pastReservations: [
      { id: "res-902", restaurantName: "Verdant Bistro", date: "Today", partySize: 2, status: "confirmed" },
    ],
  },
  {
    id: "cust-03",
    organizationId: "org_acme_corp",
    name: "Arthur Pendelton",
    email: "pendelton@capitalgroup.org",
    phone: "+1 (555) 771-0023",
    vip: true,
    totalVisits: 22,
    dietaryNotes: "Private alcoves preferred; high-tier sommelier pairings",
    favoriteVenue: "L'Atelier Lumière",
    pastReservations: [
      { id: "res-903", restaurantName: "L'Atelier Lumière", date: "Today", partySize: 6, status: "seated" },
    ],
  },
  {
    id: "cust-04",
    organizationId: "org_acme_corp",
    name: "Dr. Elena Rostova",
    email: "elena.rostova@neurotech.io",
    phone: "+1 (555) 902-1144",
    vip: true,
    totalVisits: 9,
    dietaryNotes: "No dairy",
    favoriteVenue: "Kuro Omakase",
    pastReservations: [
      { id: "res-904", restaurantName: "Kuro Omakase", date: "Tomorrow", partySize: 2, status: "confirmed" },
    ],
  },
];

/**
 * Seatbooking API Service Methods
 * All operations enforce organizationId tenant boundaries and validate parameters.
 */
export const SeatbookingService = {
  getDailyBriefing(organizationId = "org_acme_corp"): DailyBriefingStats {
    const orgRestaurants = SEATBOOKING_RESTAURANTS.filter((r) => r.organizationId === organizationId);
    const totalReservations = orgRestaurants.reduce(
      (acc, r) => acc + r.todayBookings,
      0
    );
    const declining = orgRestaurants.filter(
      (r) => r.weeklyTrendPercent < -15
    );

    return {
      totalReservationsToday: totalReservations,
      totalCoversToday: Math.round(totalReservations * 2.9),
      occupancyRatePercent: 78,
      activeRestaurants: orgRestaurants.length,
      decliningRestaurantsCount: declining.length,
      revenuePacedUsd: 48650,
      topPerforming: "L'Atelier Lumière (+14% capacity pacing)",
      attentionNeeded: `${declining.map((r) => r.name).join(" and ")} showing downward reservation trends`,
    };
  },

  getDecliningRestaurants(organizationId = "org_acme_corp"): Restaurant[] {
    return SEATBOOKING_RESTAURANTS
      .filter((r) => r.organizationId === organizationId && r.weeklyTrendPercent < 0)
      .sort((a, b) => a.weeklyTrendPercent - b.weeklyTrendPercent);
  },

  getAllRestaurants(organizationId = "org_acme_corp"): Restaurant[] {
    return SEATBOOKING_RESTAURANTS.filter((r) => r.organizationId === organizationId);
  },

  getRestaurants(
    organizationId = "org_acme_corp",
    filters?: { cuisine?: string; status?: string; location?: string }
  ): Restaurant[] {
    let list = SEATBOOKING_RESTAURANTS.filter((r) => r.organizationId === organizationId);
    if (filters?.cuisine) {
      const q = filters.cuisine.toLowerCase();
      list = list.filter((r) => r.cuisine.toLowerCase().includes(q));
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.location) {
      const loc = filters.location.toLowerCase();
      list = list.filter((r) => r.location.toLowerCase().includes(loc));
    }
    return list;
  },

  getRestaurant(organizationId = "org_acme_corp", id: string): Restaurant | undefined {
    return SEATBOOKING_RESTAURANTS.find(
      (r) => r.organizationId === organizationId && (r.id === id || r.name.toLowerCase() === id.toLowerCase())
    );
  },

  getRestaurantById(id: string, organizationId = "org_acme_corp"): Restaurant | undefined {
    return this.getRestaurant(organizationId, id);
  },

  getReservations(
    organizationId = "org_acme_corp",
    filters?: {
      restaurantId?: string;
      date?: string;
      dateRange?: { start: string; end: string };
      status?: string;
    }
  ): Reservation[] {
    let results = SEATBOOKING_RESERVATIONS.filter((res) => res.organizationId === organizationId);
    if (filters?.restaurantId) {
      results = results.filter((res) => res.restaurantId === filters.restaurantId);
    }
    if (filters?.date) {
      const targetDate = filters.date.trim().toLowerCase();
      results = results.filter((res) => {
        const itemDate = res.date.toLowerCase();
        if (targetDate === "tomorrow") return itemDate === "tomorrow";
        if (targetDate === "today") return itemDate === "today";
        return itemDate === targetDate;
      });
    }
    if (filters?.status) {
      results = results.filter((res) => res.status === filters.status);
    }
    return results;
  },

  getReservation(organizationId = "org_acme_corp", reservationId: string): Reservation | undefined {
    return SEATBOOKING_RESERVATIONS.find(
      (r) => r.organizationId === organizationId && r.id === reservationId
    );
  },

  getCustomer(
    organizationId = "org_acme_corp",
    lookup: { customerId?: string; email?: string; phone?: string; name?: string }
  ): CustomerProfile | undefined {
    return SEATBOOKING_CUSTOMERS.find((c) => {
      if (c.organizationId !== organizationId) return false;
      if (lookup.customerId && c.id === lookup.customerId) return true;
      if (lookup.email && c.email.toLowerCase() === lookup.email.toLowerCase()) return true;
      if (lookup.phone && c.phone === lookup.phone) return true;
      if (lookup.name && c.name.toLowerCase().includes(lookup.name.toLowerCase())) return true;
      return false;
    });
  },

  getRestaurantAnalytics(
    organizationId = "org_acme_corp",
    restaurantId: string,
    period = "last_7_days"
  ): RestaurantAnalytics {
    const restaurant = this.getRestaurant(organizationId, restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant ${restaurantId} not found in tenant ${organizationId}`);
    }

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      period,
      totalBookings: restaurant.todayBookings,
      totalCovers: Math.round(restaurant.todayBookings * restaurant.avgPartySize),
      capacityBookedPercent: restaurant.capacityBookedPercent,
      weeklyTrendPercent: restaurant.weeklyTrendPercent,
      cancellationRatePercent: restaurant.cancellationRatePercent,
      averagePartySize: restaurant.avgPartySize,
      peakHours: ["19:00 - 20:30", "20:30 - 22:00"],
      pacingStatus: restaurant.status,
      executiveSummary: `${restaurant.name} is currently running at ${restaurant.capacityBookedPercent}% capacity pacing with a ${restaurant.weeklyTrendPercent > 0 ? "+" : ""}${restaurant.weeklyTrendPercent}% weekly delta. Cancellation rate is ${restaurant.cancellationRatePercent}%.`,
    };
  },

  getReservationAnalytics(
    organizationId = "org_acme_corp",
    filters?: { timeRange?: string; restaurantId?: string }
  ): ReservationAnalytics {
    const restaurants = this.getAllRestaurants(organizationId);
    const totalBookings = restaurants.reduce((acc, r) => acc + r.todayBookings, 0);
    const totalCovers = restaurants.reduce((acc, r) => acc + Math.round(r.todayBookings * r.avgPartySize), 0);
    const avgCapacity = Math.round(
      restaurants.reduce((acc, r) => acc + r.capacityBookedPercent, 0) / (restaurants.length || 1)
    );
    const avgCancellation = +(
      restaurants.reduce((acc, r) => acc + r.cancellationRatePercent, 0) / (restaurants.length || 1)
    ).toFixed(1);

    const declining = restaurants.filter((r) => r.weeklyTrendPercent < 0);

    return {
      period: filters?.timeRange || "current_week",
      totalBookings,
      totalCovers,
      occupancyRatePercent: avgCapacity,
      overallCancellationRatePercent: avgCancellation,
      weeklyPacingTrendPercent: -4.2,
      projectedRevenueUsd: 48650,
      topVenues: restaurants
        .filter((r) => r.weeklyTrendPercent >= 0)
        .map((r) => ({
          name: r.name,
          covers: Math.round(r.todayBookings * r.avgPartySize),
          pacing: r.capacityBookedPercent,
        })),
      alertVenues: declining.map((r) => ({
        name: r.name,
        trend: r.weeklyTrendPercent,
        reason: r.summary,
      })),
    };
  },

  createReservation(
    organizationId = "org_acme_corp",
    params: {
      restaurantId: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      partySize: number;
      timeSlot: string;
      date: string;
      notes?: string;
      vip?: boolean;
    }
  ): Reservation {
    const restaurant = this.getRestaurant(organizationId, params.restaurantId);
    if (!restaurant) {
      throw new Error(`Target restaurant ${params.restaurantId} not found in tenant ${organizationId}`);
    }

    const newReservation: Reservation = {
      id: `res-${Date.now().toString().slice(-4)}`,
      organizationId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone || "+1 (555) 000-0000",
      partySize: params.partySize,
      timeSlot: params.timeSlot,
      date: params.date,
      status: "confirmed",
      notes: params.notes,
      vip: Boolean(params.vip),
    };

    SEATBOOKING_RESERVATIONS.push(newReservation);
    return newReservation;
  },

  updateReservation(
    organizationId = "org_acme_corp",
    reservationId: string,
    updates: {
      partySize?: number;
      timeSlot?: string;
      date?: string;
      notes?: string;
      status?: "confirmed" | "seated" | "cancelled" | "waitlist";
    }
  ): Reservation {
    const res = SEATBOOKING_RESERVATIONS.find(
      (r) => r.organizationId === organizationId && r.id === reservationId
    );
    if (!res) {
      throw new Error(`Reservation ${reservationId} not found in tenant ${organizationId}`);
    }

    if (updates.partySize !== undefined) res.partySize = updates.partySize;
    if (updates.timeSlot !== undefined) res.timeSlot = updates.timeSlot;
    if (updates.date !== undefined) res.date = updates.date;
    if (updates.notes !== undefined) res.notes = updates.notes;
    if (updates.status !== undefined) res.status = updates.status;

    return res;
  },

  cancelReservation(
    arg1: string,
    arg2: string,
    arg3?: string
  ): { success: boolean; reservation: Reservation } {
    let organizationId = "org_acme_corp";
    let reservationId = arg1;
    let reason = arg2;

    if (arg3 !== undefined) {
      organizationId = arg1;
      reservationId = arg2;
      reason = arg3;
    }

    const res = SEATBOOKING_RESERVATIONS.find(
      (r) => r.organizationId === organizationId && r.id === reservationId
    );
    if (!res) {
      throw new Error(`Reservation ${reservationId} not found in tenant ${organizationId}`);
    }
    res.status = "cancelled";
    res.notes = `${res.notes || ""} | Cancelled: ${reason}`.trim();
    return { success: true, reservation: res };
  },

  sendManagerCampaignEmail(
    restaurantId: string,
    subject: string,
    bodyText: string,
    organizationId = "org_acme_corp"
  ): {
    dispatchedTo: string;
    messageId: string;
    timestamp: string;
  } {
    const restaurant = this.getRestaurant(organizationId, restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant ${restaurantId} not found in tenant ${organizationId}`);
    }

    return {
      dispatchedTo: restaurant.managerEmail,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
  },
};
