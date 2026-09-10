import { z } from "zod";
import { ToolDefinition } from "@prosis/tools";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  restaurantId?: string;
  onDuty: boolean;
  hourlyRate: number;
}

export interface ShiftSchedule {
  id: string;
  restaurantId: string;
  restaurantName: string;
  shiftDate: string;
  shiftType: "lunch" | "dinner" | "late_night";
  scheduledHeadcount: number;
  requiredHeadcount: number;
  deficitCount: number;
  status: "optimal" | "understaffed" | "overstaffed";
}

export const WORKFORCE_EMPLOYEES: Employee[] = [
  { id: "emp_101", name: "Chef Marcus Vance", role: "Head Chef", department: "Kitchen", restaurantId: "rest-01", onDuty: true, hourlyRate: 48 },
  { id: "emp_102", name: "Elena Rostova", role: "Sommelier", department: "Floor", restaurantId: "rest-04", onDuty: true, hourlyRate: 38 },
  { id: "emp_103", name: "Liam O'Connor", role: "Shift Supervisor", department: "Floor", restaurantId: "rest-05", onDuty: false, hourlyRate: 32 },
  { id: "emp_104", name: "Mateo Bianchi", role: "Line Cook", department: "Kitchen", restaurantId: "rest-02", onDuty: true, hourlyRate: 26 },
  { id: "emp_105", name: "Aria Thorne", role: "Lead Hostess", department: "Front of House", restaurantId: "rest-01", onDuty: true, hourlyRate: 24 },
  { id: "emp_106", name: "Gabriel Silva", role: "Bartender", department: "Bar", restaurantId: "rest-05", onDuty: true, hourlyRate: 30 },
];

export const WORKFORCE_SCHEDULES: ShiftSchedule[] = [
  {
    id: "shift_101",
    restaurantId: "rest-01",
    restaurantName: "L'Atelier Lumière",
    shiftDate: "Today",
    shiftType: "dinner",
    scheduledHeadcount: 6,
    requiredHeadcount: 12,
    deficitCount: -6,
    status: "understaffed",
  },
  {
    id: "shift_102",
    restaurantId: "rest-05",
    restaurantName: "Aura Rooftop Lounge",
    shiftDate: "Today",
    shiftType: "dinner",
    scheduledHeadcount: 10,
    requiredHeadcount: 16,
    deficitCount: -6,
    status: "understaffed",
  },
  {
    id: "shift_103",
    restaurantId: "rest-02",
    restaurantName: "Cantina Bella",
    shiftDate: "Today",
    shiftType: "dinner",
    scheduledHeadcount: 6,
    requiredHeadcount: 4,
    deficitCount: 2,
    status: "overstaffed",
  },
  {
    id: "shift_104",
    restaurantId: "rest-03",
    restaurantName: "Verdant Bistro",
    shiftDate: "Today",
    shiftType: "dinner",
    scheduledHeadcount: 6,
    requiredHeadcount: 5,
    deficitCount: 1,
    status: "optimal",
  },
  {
    id: "shift_105",
    restaurantId: "rest-04",
    restaurantName: "Kuro Omakase",
    shiftDate: "Today",
    shiftType: "dinner",
    scheduledHeadcount: 5,
    requiredHeadcount: 6,
    deficitCount: -1,
    status: "understaffed",
  },
];

export const getEmployeesTool: ToolDefinition = {
  name: "workforce_getEmployees",
  productId: "workforce",
  description: "Retrieves active employee directory, on-duty status, roles, and assigned venues.",
  inputSchema: z.object({
    department: z.string().optional().describe("Filter by department ('Kitchen', 'Floor', 'Bar')"),
    restaurantId: z.string().optional().describe("Filter by restaurant venue ID"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      department: z.string(),
      restaurantId: z.string().optional(),
      onDuty: z.boolean(),
      hourlyRate: z.number(),
    })
  ),
  permissionsRequired: ["workforce.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "employees",
  },
  execute: async (input: any) => {
    let list = [...WORKFORCE_EMPLOYEES];
    if (input?.department) {
      list = list.filter((e) => e.department.toLowerCase() === input.department.toLowerCase());
    }
    if (input?.restaurantId) {
      list = list.filter((e) => e.restaurantId === input.restaurantId);
    }
    return list;
  },
};

export const getShiftScheduleTool: ToolDefinition = {
  name: "workforce_getShiftSchedule",
  productId: "workforce",
  description: "Retrieves published shift rosters, scheduled staff headcounts, and roster allocations.",
  inputSchema: z.object({
    restaurantId: z.string().optional().describe("Optional filter by restaurant venue ID"),
    shiftDate: z.string().optional().describe("Shift date filter (e.g. 'Today')"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      restaurantId: z.string(),
      restaurantName: z.string(),
      shiftDate: z.string(),
      shiftType: z.enum(["lunch", "dinner", "late_night"]),
      scheduledHeadcount: z.number(),
      requiredHeadcount: z.number(),
      deficitCount: z.number(),
      status: z.enum(["optimal", "understaffed", "overstaffed"]),
    })
  ),
  permissionsRequired: ["workforce.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "schedules",
  },
  execute: async (input: any) => {
    let list = [...WORKFORCE_SCHEDULES];
    if (input?.restaurantId) {
      list = list.filter((s) => s.restaurantId === input.restaurantId);
    }
    return list;
  },
};

export const getStaffingDeficitTool: ToolDefinition = {
  name: "workforce_getStaffingDeficit",
  productId: "workforce",
  description: "Cross-analyzes restaurant staffing levels against required covers to detect understaffed properties.",
  inputSchema: z.object({
    minDeficit: z.number().optional().describe("Minimum staff headcount deficit threshold"),
  }),
  outputSchema: z.array(
    z.object({
      restaurantId: z.string(),
      restaurantName: z.string(),
      scheduledHeadcount: z.number(),
      requiredHeadcount: z.number(),
      deficit: z.number(),
      riskSeverity: z.enum(["critical", "high", "moderate"]),
    })
  ),
  permissionsRequired: ["workforce.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "schedules",
  },
  execute: async (input: any) => {
    const minDef = input?.minDeficit || 2;
    return WORKFORCE_SCHEDULES.filter((s) => s.deficitCount <= -minDef).map((s) => ({
      restaurantId: s.restaurantId,
      restaurantName: s.restaurantName,
      scheduledHeadcount: s.scheduledHeadcount,
      requiredHeadcount: s.requiredHeadcount,
      deficit: Math.abs(s.deficitCount),
      riskSeverity: Math.abs(s.deficitCount) >= 5 ? ("critical" as const) : ("high" as const),
    }));
  },
};

export const WORKFORCE_TOOLS = [getEmployeesTool, getShiftScheduleTool, getStaffingDeficitTool];

