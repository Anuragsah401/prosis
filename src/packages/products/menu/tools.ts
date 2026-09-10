import { z } from "zod";
import { ToolDefinition } from "@prosis/tools";

export interface MenuItem {
  id: string;
  name: string;
  category: "appetizer" | "entree" | "dessert" | "cocktail" | "pairing";
  priceUsd: number;
  foodCostUsd: number;
  grossMarginPercent: number;
  available: boolean;
  allergens: string[];
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "item_01", name: "Truffle Tagliolini", category: "entree", priceUsd: 38, foodCostUsd: 8.2, grossMarginPercent: 78.4, available: true, allergens: ["gluten", "dairy", "eggs"] },
  { id: "item_02", name: "Hokkaido Scallop Crudo", category: "appetizer", priceUsd: 28, foodCostUsd: 7.9, grossMarginPercent: 71.7, available: true, allergens: ["shellfish"] },
  { id: "item_03", name: "Heritage Pork Ribeye", category: "entree", priceUsd: 46, foodCostUsd: 13.5, grossMarginPercent: 70.6, available: true, allergens: [] },
  { id: "item_04", name: "Smoked Dark Chocolate Fondant", category: "dessert", priceUsd: 18, foodCostUsd: 3.4, grossMarginPercent: 81.1, available: true, allergens: ["dairy", "eggs"] },
  { id: "item_05", name: "Yuzu Shiso Highball", category: "cocktail", priceUsd: 22, foodCostUsd: 3.1, grossMarginPercent: 85.9, available: true, allergens: [] },
];

export const getMenuItemsTool: ToolDefinition = {
  name: "menu_getMenuItems",
  productId: "menu",
  description: "Retrieves dining menu catalog, pricing, margins, availability, and allergen flags.",
  inputSchema: z.object({
    category: z.string().optional().describe("Filter by category ('appetizer', 'entree', 'dessert', 'cocktail')"),
    maxFoodCost: z.number().optional().describe("Filter items below specific food cost"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      priceUsd: z.number(),
      foodCostUsd: z.number(),
      grossMarginPercent: z.number(),
      available: z.boolean(),
      allergens: z.array(z.string()),
    })
  ),
  permissionsRequired: ["menu.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "menu_items",
  },
  execute: async (input: any) => {
    let list = [...MENU_ITEMS];
    if (input?.category) {
      list = list.filter((i) => i.category.toLowerCase() === input.category.toLowerCase());
    }
    return list;
  },
};

export const getFoodCostAnalyticsTool: ToolDefinition = {
  name: "menu_getFoodCostAnalytics",
  productId: "menu",
  description: "Calculates overall food cost ratios, plate margin distribution, and item profitability.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    averageFoodCostPercent: z.number(),
    averageGrossMarginPercent: z.number(),
    topMarginCategory: z.string(),
    totalActiveItems: z.number(),
    recommendation: z.string(),
  }),
  permissionsRequired: ["menu.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "food_costing",
  },
  execute: async () => {
    const avgMargin = +(
      MENU_ITEMS.reduce((acc, i) => acc + i.grossMarginPercent, 0) / MENU_ITEMS.length
    ).toFixed(1);

    return {
      averageFoodCostPercent: +(100 - avgMargin).toFixed(1),
      averageGrossMarginPercent: avgMargin,
      topMarginCategory: "Cocktail & Beverage (85.9%)",
      totalActiveItems: MENU_ITEMS.length,
      recommendation: "Increase Truffle Tagliolini pairing promotions to optimize high-margin covers.",
    };
  },
};

export const MENU_TOOLS = [getMenuItemsTool, getFoodCostAnalyticsTool];

