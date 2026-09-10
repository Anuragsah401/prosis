import { z } from "zod";
import { ProductRegistry, ProsisProduct } from "@prosis/sdk";
import { ToolRegistry, ToolDefinition } from "@prosis/tools";
import { MARKETING_MANIFEST } from "./manifest";

export const listCampaignsTool: ToolDefinition = {
  name: "marketing_listCampaigns",
  productId: MARKETING_MANIFEST.id,
  description: "Lists active and scheduled marketing and promotional campaigns.",
  inputSchema: z.object({
    status: z.enum(["active", "draft", "completed"]).optional().describe("Filter by status"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      reach: z.number(),
      conversionRate: z.number(),
    })
  ),
  permissionsRequired: ["marketing.read"],
  requiresApproval: false,
  auditMetadata: {
    category: "query",
    impactLevel: "low",
    reversible: true,
    resourceType: "campaigns",
  },
  execute: async (input: any) => {
    const campaigns = [
      { id: "camp_01", title: "Weekend Brunch Sparkle", status: "active", reach: 1420, conversionRate: 18.4 },
      { id: "camp_02", title: "Spring Tasting VIP Preview", status: "completed", reach: 890, conversionRate: 24.1 },
    ];
    if (input?.status) {
      return campaigns.filter((c) => c.status === input.status);
    }
    return campaigns;
  },
};

export const MarketingProduct: ProsisProduct = {
  manifest: MARKETING_MANIFEST,
  tools: [listCampaignsTool],
  initialize: () => {
    ToolRegistry.register(listCampaignsTool);
  },
  healthCheck: () => true,
};

let registered = false;

export function registerMarketingProduct(): void {
  if (registered) return;

  ProductRegistry.registerProduct(MarketingProduct);
  registered = true;
  console.log("[Marketing] Module and tools successfully initialized via generic ProsisProduct interface.");
}

// Auto-register on import
registerMarketingProduct();

export * from "./manifest";
