/**
 * @prosis/memory - Semantic Relevance Retriever
 * Retrieves only high-signal, relevant memories before generating an answer.
 * Enforces strict tenant isolation and prevents dumping the entire memory store into prompts.
 */

import {
  MemoryRecord,
  MemoryStorageAdapter,
  MemorySearchResult,
} from "../adapters/adapter";
import { generateEmbedding } from "../embedding";

export interface RetrievalContextOptions {
  query: string;
  organizationId: string;
  userId?: string;
  productScope?: string;
  limit?: number; // Defaults to 4
}

export interface RetrievedMemoryContext {
  memories: MemoryRecord[];
  formattedContext: string;
  userPreferences: MemoryRecord[];
  companyPolicies: MemoryRecord[];
  activeTask?: MemoryRecord;
  productContext?: MemoryRecord;
}

export class MemoryRetriever {
  private adapter: MemoryStorageAdapter;

  constructor(adapter: MemoryStorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Retrieves strictly relevant memories for an incoming directive.
   */
  public async retrieveRelevant(
    options: RetrievalContextOptions
  ): Promise<RetrievedMemoryContext> {
    const limit = options.limit || 4;
    const queryEmbedding = generateEmbedding(options.query);

    // 1. Semantic search across enabled memories within tenant
    const searchResults: MemorySearchResult[] = await this.adapter.searchSemantic(
      queryEmbedding,
      options.organizationId,
      {
        limit,
        minSimilarity: 0.2,
        userId: options.userId,
        productScope: options.productScope,
      }
    );

    const relevantMemories = searchResults.map((r) => r.memory);

    // 2. Also ensure critical company policies matching the active product are included if relevant
    const criticalCompany = await this.adapter.query({
      organizationId: options.organizationId,
      type: "company_memory",
      enabledOnly: true,
      minImportance: "critical",
      limit: 2,
    });

    // Merge and deduplicate
    const memoryMap = new Map<string, MemoryRecord>();
    for (const m of [...criticalCompany, ...relevantMemories]) {
      memoryMap.set(m.id, m);
    }
    const finalMemories = Array.from(memoryMap.values()).slice(0, limit + 1);

    // Categorize
    const userPreferences = finalMemories.filter((m) => m.type === "user_preference");
    const companyPolicies = finalMemories.filter((m) => m.type === "company_memory");
    const activeTask = finalMemories.find((m) => m.type === "task_memory");
    const productContext = finalMemories.find((m) => m.type === "product_context");

    // Format high-signal context snippet for LLM / Agent
    const lines: string[] = [];
    if (userPreferences.length > 0) {
      lines.push(`• Operator Preferences: ${userPreferences.map((p) => p.content).join("; ")}`);
    }
    if (companyPolicies.length > 0) {
      lines.push(`• Company Policies: ${companyPolicies.map((p) => p.content).join("; ")}`);
    }
    if (activeTask) {
      lines.push(`• Active Task Context: ${activeTask.content}`);
    }
    if (productContext) {
      lines.push(`• Product Context: ${productContext.content}`);
    }

    return {
      memories: finalMemories,
      formattedContext: lines.join("\n"),
      userPreferences,
      companyPolicies,
      activeTask,
      productContext,
    };
  }
}

