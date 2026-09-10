import { ProductManifest } from "@prosis/sdk";

export const WORKFORCE_MANIFEST: ProductManifest = {
  id: "workforce",
  name: "Prosis Workforce",
  slug: "workforce",
  description: "Enterprise employee scheduling, shift rosters, attendance, and labor cost optimization SaaS",
  icon: "Users",
  version: "1.2.0",
  status: "active",
  capabilities: [
    {
      id: "employees",
      name: "Employee Directory & Profiles",
      description: "Manage employee profiles, skills, certifications, and emergency contacts.",
      version: "1.0",
      operations: ["list_employees", "get_employee", "update_profile"],
    },
    {
      id: "attendance",
      name: "Time & Attendance Tracking",
      description: "Track live clock-in timestamps, attendance compliance, and overtime hours.",
      version: "1.1",
      operations: ["get_attendance", "log_clock_in", "overtime_alerts"],
    },
    {
      id: "schedules",
      name: "Shift & Roster Scheduling",
      description: "Generate, adjust, and publish weekly shift rosters, overtime warnings, and staffing balance.",
      version: "1.2",
      operations: ["get_roster", "assign_shift", "swap_shifts", "staffing_analysis"],
    },
    {
      id: "payroll",
      name: "Payroll & Labor Cost Telemetry",
      description: "Track hourly payroll rates against restaurant sales and project labor cost ratios.",
      version: "1.0",
      operations: ["labor_variance", "payroll_projection", "cost_per_cover"],
    },
  ],
  tools: [
    "workforce_getEmployees",
    "workforce_getShiftSchedule",
    "workforce_getStaffingDeficit",
  ],
  navigation: [
    { label: "Staff Roster", path: "/workforce/employees", icon: "Users" },
    { label: "Shift Schedule", path: "/workforce/schedules", icon: "Calendar" },
    { label: "Live Attendance", path: "/workforce/attendance", icon: "Clock" },
    { label: "Labor Cost", path: "/workforce/payroll", icon: "DollarSign" },
  ],
  workspace: {
    id: "workspace_workforce",
    title: "Workforce Operations Workspace",
    slug: "workforce",
    route: "/workforce",
    layout: "split",
    quickActions: [
      { label: "View On-Duty", action: "view_on_duty", icon: "Users" },
      { label: "Staffing Check", action: "check_staffing", icon: "AlertTriangle" },
    ],
  },
  apiConfig: {
    baseUrl: "https://api.workforce.internal/v1",
    apiVersion: "2026-02",
    authStrategy: "internal_service",
    timeoutMs: 3000,
  },
  permissions: [
    "workforce.read",
    "workforce.schedule.write",
    "workforce.admin",
  ],
  enabled: true,
};
