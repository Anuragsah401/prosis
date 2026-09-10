import { ProductManifest } from "@prosis/sdk";

export const MENU_MANIFEST: ProductManifest = {
  id: "menu",
  name: "Prosis Menu",
  slug: "menu",
  description: "Dynamic menu engineering, recipe costing, allergen indexing, and inventory pairing models",
  icon: "FileText",
  version: "1.0.0",
  status: "active",
  capabilities: [
    {
      id: "recipes",
      name: "Recipe & Sub-Recipe Catalog",
      description: "Manage component recipes, prep steps, yield percentages, and batch sizes.",
      version: "1.0",
      operations: ["list_recipes", "get_recipe", "update_yield"],
    },
    {
      id: "menu_items",
      name: "Menu Items & Pricing Architecture",
      description: "Manage active dining menus, tasting courses, pricing tiers, and item popularity.",
      version: "1.2",
      operations: ["get_menu_items", "toggle_item_availability", "update_price"],
    },
    {
      id: "food_costing",
      name: "Food Margin & Plate Cost Telemetry",
      description: "Calculate plate cost variances, gross margin targets, and wholesale ingredient inflation.",
      version: "1.1",
      operations: ["calculate_costing", "margin_alerts", "price_elasticity"],
    },
    {
      id: "allergens",
      name: "Dietary & Allergen Matrix",
      description: "Cross-reference ingredient allergens, FDA compliance, and guest dietary profiles.",
      version: "1.0",
      operations: ["audit_allergens", "filter_dietary"],
    },
  ],
  tools: [
    "menu_getMenuItems",
    "menu_getFoodCostAnalytics",
  ],
  navigation: [
    { label: "Active Menus", path: "/menu/items", icon: "FileText" },
    { label: "Recipe Costing", path: "/menu/costing", icon: "DollarSign" },
    { label: "Allergen Matrix", path: "/menu/allergens", icon: "ShieldCheck" },
  ],
  workspace: {
    id: "workspace_menu",
    title: "Menu Engineering Workspace",
    slug: "menu",
    route: "/menu",
    layout: "split",
    quickActions: [
      { label: "Inspect Margins", action: "view_margins", icon: "TrendingUp" },
      { label: "Allergen Check", action: "check_allergens", icon: "Shield" },
    ],
  },
  apiConfig: {
    baseUrl: "https://api.menu.internal/v1",
    apiVersion: "2026-01",
    authStrategy: "internal_service",
    timeoutMs: 3000,
  },
  permissions: [
    "menu.read",
    "menu.pricing.write",
    "menu.admin",
  ],
  enabled: true,
};

