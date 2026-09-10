/**
 * @prosis/tools - Tool Registry, Execution, and Authorization Engine
 * Enforces structured schemas, RBAC permission checks, human-in-the-loop approvals,
 * and immutable audit telemetry.
 */

import { z } from "zod";
import { ExecutionContext } from "@prosis/sdk";

export type ToolCategory =
  | "query"
  | "mutation"
  | "communication"
  | "finance"
  | "system";

export interface AuditMetadata {
  category: ToolCategory;
  impactLevel: "low" | "medium" | "high" | "critical";
  reversible: boolean;
  resourceType: string;
}

export interface ApprovalPayload<T = unknown> {
  toolName: string;
  parameters: T;
  summary: string;
  affectedEntities: { type: string; id: string; name: string }[];
  impactDescription: string;
  proposedChanges?: Record<string, unknown>;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  auditTrailId: string;
  executionDurationMs: number;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition<
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TResult = unknown,
  TOutputSchema extends z.ZodTypeAny = z.ZodTypeAny
> {
  name: string;
  productId: string;
  description: string;
  inputSchema: TSchema;
  outputSchema?: TOutputSchema;
  permissionsRequired: string[];
  requiresApproval: boolean;
  auditMetadata: AuditMetadata;
  buildApprovalPayload?: (
    input: z.infer<TSchema>,
    context: ExecutionContext
  ) => Promise<ApprovalPayload<z.infer<TSchema>>>;
  execute: (
    input: z.infer<TSchema>,
    context: ExecutionContext
  ) => Promise<TResult>;
}

/**
 * Tool Registry Service:
 * Central repository for all AI-executable operations across all registered products.
 */
class ToolRegistryService {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register an executable tool.
   */
  public register<TSchema extends z.ZodTypeAny, TResult>(
    tool: ToolDefinition<TSchema, TResult>
  ): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Overwriting tool definition: ${tool.name}`);
    }
    this.tools.set(tool.name, tool as unknown as ToolDefinition);
  }

  /**
   * Retrieve tool by name.
   */
  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools.
   */
  public getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * List tools provided by a specific product.
   */
  public getByProduct(productId: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.productId === productId
    );
  }

  /**
   * Get all tools formatted for LLM schema function declarations.
   */
  public getAIFunctionSchemas(): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    requiresApproval: boolean;
  }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: (tool.inputSchema as any)._def ? { type: "object" } : {},
      requiresApproval: tool.requiresApproval,
    }));
  }
}

export const ToolRegistry = new ToolRegistryService();

