import { ProductRegistry, ProsisProduct } from "@prosis/sdk";
import { ToolRegistry } from "@prosis/tools";
import { ANALYTICS_MANIFEST } from "./manifest";
import { ANALYTICS_TOOLS, getExecutiveDashboardTool, correlatePacingAndLaborTool } from "./tools";

export const AnalyticsProduct: ProsisProduct = {
  manifest: ANALYTICS_MANIFEST,
  tools: ANALYTICS_TOOLS,
  initialize: () => {
    for (const tool of ANALYTICS_TOOLS) {
      ToolRegistry.register(tool);
    }
  },
  healthCheck: () => true,
};

let registered = false;

export function registerAnalyticsProduct(): void {
  if (registered) return;

  ProductRegistry.registerProduct(AnalyticsProduct);
  registered = true;
  console.log("[Analytics] Module and cross-product correlation tools successfully initialized via generic ProsisProduct interface.");
}

// Auto-register on import
registerAnalyticsProduct();

export * from "./manifest";
export * from "./tools";

