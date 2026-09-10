import { ProductRegistry, ProsisProduct } from "@prosis/sdk";
import { ToolRegistry } from "@prosis/tools";
import { SEATBOOKING_MANIFEST } from "./manifest";
import { SEATBOOKING_TOOLS } from "./tools";

/**
 * Seatbooking Product Definition:
 * Conforms strictly to the generic ProsisProduct interface.
 * Exposes its manifest, tool definitions, initialization, and health check.
 */
export const SeatbookingProduct: ProsisProduct = {
  manifest: SEATBOOKING_MANIFEST,
  tools: SEATBOOKING_TOOLS,
  initialize: () => {
    for (const tool of SEATBOOKING_TOOLS) {
      ToolRegistry.register(tool);
    }
  },
  healthCheck: () => {
    return true;
  },
};

let registered = false;

export function registerSeatbookingProduct(): void {
  if (registered) return;

  // Register via generic product interface
  ProductRegistry.registerProduct(SeatbookingProduct);

  registered = true;
  console.log("[Seatbooking] Module and 10 tools successfully initialized via generic ProsisProduct interface.");
}

// Auto-register on import
registerSeatbookingProduct();

export * from "./manifest";
export * from "./data";
export * from "./tools";
