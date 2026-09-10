import { ProductManifest } from "@prosis/sdk";

export const ANALYTICS_MANIFEST: ProductManifest = {
  id: "analytics",
  name: "Prosis Analytics",
  slug: "analytics",
  description: "Cross-product business intelligence, predictive revenue models, and executive operations benchmarks",
  icon: "BarChart3",
  version: "2.1.0",
  status: "active",
  capabilities: [
    {
      id: "revenue_pacing",
      name: "Portfolio Revenue Pacing",
      description: "Real-time revenue pacing, cover values, and historical trajectory comparisons.",
      version: "2.0",
      operations: ["get_pacing", "period_comparison", "target_variance"],
    },
    {
      id: "forecasting",
      name: "Predictive Demand Forecasting",
      description: "30-day forward demand projections based on holiday patterns, booking curves, and local events.",
      version: "1.5",
      operations: ["forecast_covers", "forecast_sales", "confidence_interval"],
    },
    {
      id: "executive_metrics",
      name: "Executive Operating KPIs",
      description: "Consolidated enterprise scorecards, average spend per guest, and margin synthesis.",
      version: "2.1",
      operations: ["get_kpis", "executive_summary"],
    },
    {
      id: "cross_product_benchmarks",
      name: "Cross-Product Intelligence & Labor Pacing",
      description: "Correlates table covers (Seatbooking) with staffing headcounts (Workforce) to identify operational deficits.",
      version: "1.0",
      operations: ["correlate_pacing_and_labor", "detect_labor_deficit"],
    },
  ],
  tools: [
    "analytics_getExecutiveDashboard",
    "analytics_correlatePacingAndLabor",
  ],
  navigation: [
    { label: "Executive Scorecard", path: "/analytics/dashboard", icon: "BarChart3" },
    { label: "Revenue Pacing", path: "/analytics/pacing", icon: "TrendingUp" },
    { label: "Labor Correlation", path: "/analytics/labor-correlation", icon: "Users" },
  ],
  workspace: {
    id: "workspace_analytics",
    title: "Executive Analytics Workspace",
    slug: "analytics",
    route: "/analytics",
    layout: "dashboard",
    quickActions: [
      { label: "Executive Briefing", action: "view_summary", icon: "Sparkles" },
      { label: "Labor Correlation", action: "check_labor_deficit", icon: "Layers" },
    ],
  },
  apiConfig: {
    baseUrl: "https://api.analytics.internal/v2",
    apiVersion: "2026-03",
    authStrategy: "internal_service",
    timeoutMs: 4000,
  },
  permissions: [
    "analytics.read",
    "analytics.export",
    "analytics.admin",
  ],
  enabled: true,
};

