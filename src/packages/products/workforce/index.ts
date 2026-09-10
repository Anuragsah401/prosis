import { ProductRegistry, ProsisProduct } from "@prosis/sdk";
import { ToolRegistry } from "@prosis/tools";
import { WORKFORCE_MANIFEST } from "./manifest";
import { WORKFORCE_TOOLS, getEmployeesTool, getShiftScheduleTool, getStaffingDeficitTool } from "./tools";

export const WorkforceProduct: ProsisProduct = {
  manifest: WORKFORCE_MANIFEST,
  tools: WORKFORCE_TOOLS,
  initialize: () => {
    for (const tool of WORKFORCE_TOOLS) {
      ToolRegistry.register(tool);
    }
  },
  healthCheck: () => true,
};

let registered = false;

export function registerWorkforceProduct(): void {
  if (registered) return;

  // Register with Product Registry
  ProductRegistry.registerProduct(WorkforceProduct);

  registered = true;
  console.log("[Workforce] Module and tools successfully initialized via generic ProsisProduct interface.");
}

// Auto-register on import
registerWorkforceProduct();

export * from "./manifest";
export * from "./tools";
