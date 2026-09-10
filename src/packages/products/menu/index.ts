import { ProductRegistry, ProsisProduct } from "@prosis/sdk";
import { ToolRegistry } from "@prosis/tools";
import { MENU_MANIFEST } from "./manifest";
import { MENU_TOOLS, getMenuItemsTool, getFoodCostAnalyticsTool } from "./tools";

export const MenuProduct: ProsisProduct = {
  manifest: MENU_MANIFEST,
  tools: MENU_TOOLS,
  initialize: () => {
    for (const tool of MENU_TOOLS) {
      ToolRegistry.register(tool);
    }
  },
  healthCheck: () => true,
};

let registered = false;

export function registerMenuProduct(): void {
  if (registered) return;

  ProductRegistry.registerProduct(MenuProduct);
  registered = true;
  console.log("[Menu] Module and tools successfully initialized via generic ProsisProduct interface.");
}

// Auto-register on import
registerMenuProduct();

export * from "./manifest";
export * from "./tools";

