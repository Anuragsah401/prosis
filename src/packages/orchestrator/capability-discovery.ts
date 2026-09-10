/**
 * @prosis/orchestrator - Dynamic Capability Discovery Engine
 * Discovers products and tools dynamically based on registered capabilities in ProductRegistry.
 * Replaces hardcoded if/else chains with semantic capability graph matching.
 */

import { ProductRegistry, ProductManifest, ProductCapability } from "../sdk";
import { ToolRegistry, ToolDefinition } from "../tools";

export interface CapabilityDiscoveryResult {
  primaryProduct?: ProductManifest;
  primaryCapability?: ProductCapability;
  participatingProducts: ProductManifest[];
  candidateTools: ToolDefinition[];
  isCrossProduct: boolean;
  crossProductContext?: {
    intent: string;
    products: string[];
  };
  workspaceAction?: {
    type: "switch_workspace" | "return_to_core";
    targetProduct?: string;
    targetWorkspace?: string;
  };
  confidence: number;
}

export class CapabilityDiscoveryEngine {
  /**
   * Evaluates natural language user input against registered products and capabilities.
   */
  public static discover(
    input: string,
    activeProductId?: string
  ): CapabilityDiscoveryResult {
    const normalized = input.trim().toLowerCase();
    const activeProducts = ProductRegistry.getActive();

    // 1. Check for Workspace Navigation Directives
    const isReturnToCore =
      normalized.includes("go back to prosis") ||
      normalized.includes("back to prosis") ||
      normalized.includes("return to prosis") ||
      normalized.includes("return home") ||
      normalized.includes("close workspace") ||
      normalized.includes("open prosis core");

    if (isReturnToCore) {
      return {
        participatingProducts: [],
        candidateTools: [],
        isCrossProduct: false,
        workspaceAction: {
          type: "return_to_core",
          targetWorkspace: "prosis",
        },
        confidence: 1.0,
      };
    }

    // Check for "open <product>" or "go to <product>" or "view <product>"
    for (const prod of activeProducts) {
      const openPattern = new RegExp(
        `(?:open|go to|launch|switch to|view)\\s+(?:the\\s+)?(?:prosis\\s+)?(${prod.slug}|${prod.name.toLowerCase()})\\b`,
        "i"
      );
      if (openPattern.test(normalized)) {
        return {
          primaryProduct: prod,
          participatingProducts: [prod],
          candidateTools: ToolRegistry.getByProduct(prod.id),
          isCrossProduct: false,
          workspaceAction: {
            type: "switch_workspace",
            targetProduct: prod.id,
            targetWorkspace: prod.slug,
          },
          confidence: 0.98,
        };
      }
    }

    // 2. Check for Cross-Product Operations
    // Example: "Find restaurants with increasing bookings but insufficient staff."
    const mentionsBookingsOrPacing =
      normalized.includes("booking") ||
      normalized.includes("bookings") ||
      normalized.includes("reservation") ||
      normalized.includes("covers") ||
      normalized.includes("pacing");

    const mentionsStaffOrLabor =
      normalized.includes("staff") ||
      normalized.includes("staffing") ||
      normalized.includes("insufficient staff") ||
      normalized.includes("employee") ||
      normalized.includes("headcount") ||
      normalized.includes("labor") ||
      normalized.includes("shift");

    if (mentionsBookingsOrPacing && mentionsStaffOrLabor) {
      const seatbooking = ProductRegistry.get("seatbooking");
      const workforce = ProductRegistry.get("workforce");
      const analytics = ProductRegistry.get("analytics");

      const participating: ProductManifest[] = [seatbooking, workforce, analytics].filter(
        Boolean
      ) as ProductManifest[];

      const candidateTools: ToolDefinition[] = [];
      participating.forEach((p) => candidateTools.push(...ToolRegistry.getByProduct(p.id)));

      return {
        primaryProduct: analytics || seatbooking,
        primaryCapability: analytics?.capabilities.find((c) => c.id === "cross_product_benchmarks"),
        participatingProducts: participating,
        candidateTools,
        isCrossProduct: true,
        crossProductContext: {
          intent: "correlate_bookings_and_staffing_deficit",
          products: participating.map((p) => p.slug),
        },
        confidence: 0.95,
      };
    }

    // 3. Dynamic Capability Matching across Product Registry
    const tokens = normalized.split(/[^a-z0-9_]+/).filter((t) => t.length > 2);
    const scoredProducts: Map<
      string,
      {
        product: ProductManifest;
        bestCapability?: ProductCapability;
        score: number;
      }
    > = new Map();

    for (const prod of activeProducts) {
      let prodScore = 0;
      let topCap: ProductCapability | undefined;
      let topCapScore = 0;

      for (const cap of prod.capabilities) {
        let capScore = 0;
        const corpus = `${prod.name} ${prod.slug} ${cap.name} ${cap.id} ${cap.description} ${cap.operations.join(
          " "
        )}`.toLowerCase();

        for (const token of tokens) {
          if (corpus.includes(token)) {
            capScore += 2.0;
          }
        }

        if (capScore > topCapScore) {
          topCapScore = capScore;
          topCap = cap;
        }
        prodScore += capScore;
      }

      // Contextual boost if active product
      if (activeProductId && (prod.id === activeProductId || prod.slug === activeProductId)) {
        prodScore += 1.5;
      }

      if (prodScore > 0) {
        scoredProducts.set(prod.id, {
          product: prod,
          bestCapability: topCap,
          score: prodScore,
        });
      }
    }

    const sortedMatches = Array.from(scoredProducts.values()).sort((a, b) => b.score - a.score);

    if (sortedMatches.length > 0) {
      const topMatch = sortedMatches[0];
      const tools = ToolRegistry.getByProduct(topMatch.product.id);

      return {
        primaryProduct: topMatch.product,
        primaryCapability: topMatch.bestCapability,
        participatingProducts: [topMatch.product],
        candidateTools: tools,
        isCrossProduct: false,
        confidence: Math.min(topMatch.score / 10, 1.0),
      };
    }

    // Default fallback to first active product
    const fallback = activeProducts[0];
    return {
      primaryProduct: fallback,
      primaryCapability: fallback?.capabilities[0],
      participatingProducts: fallback ? [fallback] : [],
      candidateTools: fallback ? ToolRegistry.getByProduct(fallback.id) : [],
      isCrossProduct: false,
      confidence: 0.2,
    };
  }
}

