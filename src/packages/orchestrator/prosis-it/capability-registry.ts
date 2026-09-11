/**
 * @prosis/orchestrator - Capability Registry
 * High-level capability abstraction decoupling user intent from specific microservices.
 * Defines the enterprise capability landscape across the Prosis ecosystem.
 */

import { CapabilityDefinition } from "./prosis-it-types";

class ProsisCapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  constructor() {
    this.registerDefaultCapabilities();
  }

  /**
   * Initialize standard enterprise capabilities.
   */
  private registerDefaultCapabilities(): void {
    // 1. Seatbooking
    this.register({
      id: "seatbooking",
      name: "Seatbooking & Reservations",
      product: "seatbooking",
      description: "Manages dining reservations, cover pacing, party sizing, table allocations, and waitlists across venues.",
      status: "partially_implemented",
      availableTools: [
        "getVenueAnalytics",
        "seatbooking_getReservationAnalytics",
        "seatbooking_createReservation",
      ],
      requiredPermissions: ["seatbooking.read", "seatbooking.write"],
      supportedOperations: [
        "view_analytics",
        "view_reservations",
        "create_reservation",
        "update_reservation",
        "cancel_reservation",
      ],
      futureRoadmapNotes: "Full multi-table optimization and live POS table status linking in development.",
    });

    // 2. Executive Analytics
    this.register({
      id: "analytics",
      name: "Executive Hospitality Analytics",
      product: "analytics",
      description: "Aggregates revenue deltas, occupancy velocity, cover pacing against targets, and cross-venue performance telemetry.",
      status: "implemented",
      availableTools: [
        "getVenueAnalytics",
        "seatbooking_getReservationAnalytics",
      ],
      requiredPermissions: ["analytics.read", "seatbooking.read"],
      supportedOperations: [
        "query_pacing",
        "query_revenue",
        "query_occupancy",
        "cross_venue_benchmarking",
      ],
    });

    // 3. Workforce Management (Planned)
    this.register({
      id: "workforce",
      name: "Workforce & Staff Management",
      product: "workforce",
      description: "Controls shift schedules, labor cost targets, server station rotations, and attendance tracking across properties.",
      status: "future",
      availableTools: [],
      requiredPermissions: ["workforce.read", "workforce.write"],
      supportedOperations: [
        "view_schedules",
        "assign_shifts",
        "optimize_labor_costs",
        "clock_in_telemetry",
      ],
      futureRoadmapNotes: "Automated labor pacing and shift auto-balancing based on cover forecasts scheduled for Q3.",
    });

    // 4. E-Menu & Culinary Operations (Planned)
    this.register({
      id: "menu",
      name: "E-Menu & Culinary Operations",
      product: "menu",
      description: "Synchronizes digital menus, real-time item availability (86-ing), dynamic pricing, and POS menu parity.",
      status: "future",
      availableTools: [],
      requiredPermissions: ["menu.read", "menu.write"],
      supportedOperations: [
        "update_item_availability",
        "edit_pricing",
        "query_allergens",
        "sync_pos_items",
      ],
      futureRoadmapNotes: "Real-time kitchen display sync and ingredient depletion hooks currently in development.",
    });

    // 5. Marketing & Guest Retention (Planned)
    this.register({
      id: "marketing",
      name: "Marketing & Guest Retention",
      product: "marketing",
      description: "Automates VIP guest outreach, email/SMS promotions, win-back campaigns, and guest spend segmentation.",
      status: "future",
      availableTools: [],
      requiredPermissions: ["marketing.read", "marketing.write"],
      supportedOperations: [
        "launch_campaign",
        "segment_guests",
        "query_campaign_roi",
        "issue_vip_perks",
      ],
      futureRoadmapNotes: "Autonomous guest lifecycle triggers based on visit cadence and lifetime value in progress.",
    });

    // 6. Operations & Facilities (Planned)
    this.register({
      id: "operations",
      name: "Operations & Facilities",
      product: "operations",
      description: "Oversees opening/closing checklists, health inspections, supplier orders, and equipment maintenance tickets.",
      status: "future",
      availableTools: [],
      requiredPermissions: ["operations.read", "operations.write"],
      supportedOperations: [
        "checklists",
        "supplier_orders",
        "equipment_tickets",
      ],
      futureRoadmapNotes: "IoT refrigeration monitoring and preventive maintenance alerts planned for upcoming release.",
    });

    // 7. Codebase & Repository Intelligence
    this.register({
      id: "repository_intelligence",
      name: "Codebase & Repository Intelligence",
      product: "repositories",
      description: "Inspects connected GitHub repositories (e.g. Seatbooking, Workforce, Prosis), analyzing codebase architecture, endpoints, database schemas, and source modules.",
      status: "implemented",
      availableTools: [
        "repo_queryRepositoryKnowledge",
        "repo_listConnectedRepositories",
        "repo_inspectFileOrModule",
      ],
      requiredPermissions: [],
      supportedOperations: [
        "query_architecture",
        "list_endpoints",
        "inspect_schemas",
        "search_codebase",
      ],
      futureRoadmapNotes: "Real-time git commit polling and automated pull-request risk impact simulation.",
    });
  }

  /**
   * Register a new or updated capability definition.
   */
  public register(capability: CapabilityDefinition): void {
    this.capabilities.set(capability.id, capability);
  }

  /**
   * Retrieve capability by its unique ID.
   */
  public get(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  /**
   * List all registered capabilities.
   */
  public getAll(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Retrieve active capabilities (implemented or partially implemented).
   */
  public getActiveCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values()).filter(
      (c) => c.status === "implemented" || c.status === "partially_implemented"
    );
  }

  /**
   * Retrieve future / roadmap capabilities.
   */
  public getFutureCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values()).filter(
      (c) => c.status === "future"
    );
  }

  /**
   * Locate the capability associated with a given tool name.
   */
  public getCapabilityForTool(toolName: string): CapabilityDefinition | undefined {
    return Array.from(this.capabilities.values()).find((cap) =>
      cap.availableTools.includes(toolName)
    );
  }

  /**
   * Formats a clear, authoritative summary of the enterprise capabilities for user queries.
   */
  public formatEcosystemSummary(): string {
    const active = this.getActiveCapabilities();
    const future = this.getFutureCapabilities();

    const activeList = active
      .map((c) => `- ${c.name}: ${c.description} [Status: ${c.status.replace("_", " ").toUpperCase()}]`)
      .join("\n");

    const futureList = future
      .map((c) => `- ${c.name}: ${c.description} [Planned: ${c.futureRoadmapNotes || "In roadmap"}]`)
      .join("\n");

    return [
      "Prosis Operating System Capabilities:",
      "",
      "Active Modules:",
      activeList,
      "",
      "Upcoming Ecosystem Modules:",
      futureList,
    ].join("\n");
  }
}

export const CapabilityRegistry = new ProsisCapabilityRegistry();

