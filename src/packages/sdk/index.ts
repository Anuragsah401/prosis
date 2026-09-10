/**
 * @prosis/sdk - Enterprise AI Operating System SDK
 * Core types, product registry abstraction, context definitions, and integration contracts.
 */

export interface OrganizationContext {
  id: string;
  name: string;
  plan: "starter" | "growth" | "enterprise";
  settings?: Record<string, unknown>;
}

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member";
  permissions: string[];
}

export interface ExecutionContext {
  organization: OrganizationContext;
  user: UserContext;
  conversationId: string;
  runId: string;
  timestamp: string;
  source: "web" | "voice" | "api" | "proactive_task";
}

export interface ProductCapability {
  id: string;
  name: string;
  description: string;
  version?: string;
  operations: string[];
}

export interface ProductApiConfig {
  baseUrl?: string;
  apiVersion?: string;
  authStrategy?: "oauth2" | "bearer" | "internal_service";
  timeoutMs?: number;
}

export interface ProductNavigationItem {
  id?: string;
  label: string;
  path: string;
  icon?: string;
}

export interface ProductWorkspaceConfig {
  id: string;
  title: string;
  slug: string;
  route: string;
  layout?: "dashboard" | "split" | "canvas" | "table";
  quickActions?: Array<{ label: string; action: string; icon?: string }>;
}

export interface ProductManifest {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  version: string;
  status: "active" | "beta" | "disabled" | "maintenance";
  capabilities: ProductCapability[];
  tools: string[]; // List of tool names provided by this product
  apiConfig?: ProductApiConfig;
  permissions: string[];
  navigation?: ProductNavigationItem[];
  workspace?: ProductWorkspaceConfig;
  enabled?: boolean;
}

/**
 * Generic Prosis Product Interface:
 * Standard contract for all external business applications (Seatbooking, Workforce, Menu, etc.)
 * allowing products to register with the Prosis AI Operating System without tight coupling.
 */
export interface ProsisProduct {
  manifest: ProductManifest;
  tools?: any[];
  initialize?: () => Promise<void> | void;
  healthCheck?: () => Promise<boolean> | boolean;
}

/**
 * Product Registry:
 * Allows business applications (Seatbooking, Workforce, Menu, Analytics, etc.)
 * to register capabilities and expose tools without coupling to core AI logic.
 */
class ProductRegistryService {
  private products: Map<string, ProductManifest> = new Map();
  private productInstances: Map<string, ProsisProduct> = new Map();

  /**
   * Register a new product module into the Prosis Operating System.
   */
  public register(product: ProductManifest): void {
    if (this.products.has(product.id)) {
      console.warn(`[ProductRegistry] Overwriting existing registration for product: ${product.id}`);
    }
    const { enabled, ...rest } = product;
    this.products.set(product.id, {
      ...rest,
      enabled: enabled !== undefined ? enabled : true,
    });
    console.log(`[ProductRegistry] Product successfully registered: ${product.name} (${product.slug} v${product.version})`);
  }

  /**
   * Register a full ProsisProduct instance or ProductManifest adhering to the generic product interface.
   */
  public async registerProduct(product: ProsisProduct | ProductManifest): Promise<void> {
    const isProsisProduct = "manifest" in product;
    const manifest = isProsisProduct ? product.manifest : product;
    if (isProsisProduct) {
      this.productInstances.set(manifest.id, product);
    }
    this.register(manifest);
    if (isProsisProduct && product.initialize) {
      await product.initialize();
    }
  }

  /**
   * Register a capability for a specific product dynamically.
   */
  public registerCapability(productId: string, capability: ProductCapability): boolean {
    const product = this.get(productId);
    if (!product) return false;
    const exists = product.capabilities.some((c) => c.id === capability.id);
    if (exists) {
      product.capabilities = product.capabilities.map((c) => (c.id === capability.id ? capability : c));
    } else {
      product.capabilities.push(capability);
    }
    return true;
  }

  /**
   * Register a tool name for a specific product dynamically.
   */
  public registerTool(tool: { name: string; productId?: string }): void {
    if (tool.productId) {
      const product = this.get(tool.productId);
      if (product && !product.tools.includes(tool.name)) {
        product.tools.push(tool.name);
      }
    }
  }

  /**
   * Register a permission for a product.
   */
  public registerPermission(productId: string, permission: string): boolean {
    const product = this.get(productId);
    if (!product) return false;
    if (!product.permissions.includes(permission)) {
      product.permissions.push(permission);
    }
    return true;
  }

  /**
   * Register a dedicated workspace for a product.
   */
  public registerWorkspace(productId: string, workspace: ProductWorkspaceConfig): boolean {
    const product = this.get(productId);
    if (!product) return false;
    product.workspace = workspace;
    return true;
  }

  /**
   * Find products that expose a given capability.
   */
  public findProductsByCapability(capabilityId: string): ProductManifest[] {
    const normalized = capabilityId.toLowerCase();
    return this.getActive().filter((p) =>
      p.capabilities.some(
        (c) =>
          c.id.toLowerCase() === normalized ||
          c.name.toLowerCase().includes(normalized) ||
          c.operations.some((op) => op.toLowerCase().includes(normalized))
      )
    );
  }

  /**
   * Semantic discovery: match capabilities across all registered products without hardcoding.
   */
  public searchCapabilities(query: string): Array<{ product: ProductManifest; capability: ProductCapability; score: number }> {
    const tokens = query.toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length > 2);
    const results: Array<{ product: ProductManifest; capability: ProductCapability; score: number }> = [];

    for (const prod of this.getActive()) {
      for (const cap of prod.capabilities) {
        let score = 0;
        const text = `${prod.name} ${prod.slug} ${cap.name} ${cap.id} ${cap.description} ${cap.operations.join(" ")}`.toLowerCase();
        for (const token of tokens) {
          if (text.includes(token)) {
            score += 1.5;
          }
        }
        if (score > 0) {
          results.push({ product: prod, capability: cap, score });
        }
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Retrieve a product manifest by ID or slug.
   */
  public get(idOrSlug: string): ProductManifest | undefined {
    return this.products.get(idOrSlug) || this.getBySlug(idOrSlug);
  }

  /**
   * Retrieve a product manifest by slug.
   */
  public getBySlug(slug: string): ProductManifest | undefined {
    return Array.from(this.products.values()).find((p) => p.slug === slug || p.id === slug);
  }

  /**
   * Retrieve registered product instance.
   */
  public getProductInstance(idOrSlug: string): ProsisProduct | undefined {
    return this.productInstances.get(idOrSlug);
  }

  /**
   * List all registered products.
   */
  public getAll(): ProductManifest[] {
    return Array.from(this.products.values());
  }

  /**
   * List all enabled products.
   */
  public getActive(): ProductManifest[] {
    return Array.from(this.products.values()).filter((p) => p.enabled !== false && p.status !== "disabled");
  }

  /**
   * Toggle product state.
   */
  public setEnabled(id: string, enabled: boolean): boolean {
    const product = this.get(id);
    if (!product) return false;
    product.enabled = enabled;
    return true;
  }
}

export const ProductRegistry = new ProductRegistryService();

