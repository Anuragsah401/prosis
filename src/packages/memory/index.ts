/**
 * @prosis/memory - Production AI Operating System Memory Architecture
 * Provides 5-tier persistent memory:
 * 1. Conversation Memory
 * 2. User Preference Memory
 * 3. Company Memory
 * 4. Task Memory
 * 5. Product Context
 *
 * Implements selective 4-stage ingestion, semantic relevance retrieval,
 * and a pluggable vector storage adapter (PostgreSQL + pgvector ready).
 */

import {
  MemoryCategory,
  MemoryImportance,
  MemoryRecord,
  MemorySource,
  MemoryQueryFilter,
  SemanticSearchOptions,
  MemorySearchResult,
  MemoryStorageAdapter,
} from "./adapters/adapter";
import { InMemoryVectorAdapter } from "./adapters/in-memory-vector-adapter";
import { PgVectorMemoryAdapter } from "./adapters/pgvector-adapter";
import { MemoryPipeline } from "./pipeline/memory-pipeline";
import {
  MemoryRetriever,
  RetrievalContextOptions,
  RetrievedMemoryContext,
} from "./retrieval/memory-retriever";

export * from "./adapters/adapter";
export * from "./adapters/in-memory-vector-adapter";
export * from "./adapters/pgvector-adapter";
export * from "./pipeline/memory-pipeline";
export * from "./retrieval/memory-retriever";
export * from "./embedding";

export type MemoryLayerType = MemoryCategory; // Backward compatibility alias

export class MemoryService {
  private adapter: MemoryStorageAdapter;
  private pipeline: MemoryPipeline;
  private retriever: MemoryRetriever;

  constructor(adapter?: MemoryStorageAdapter) {
    // Default to InMemoryVectorAdapter with automatic PgVector readiness
    this.adapter = adapter || new InMemoryVectorAdapter();
    this.pipeline = new MemoryPipeline(this.adapter);
    this.retriever = new MemoryRetriever(this.adapter);

    this.seedDefaultMemories();
  }

  /**
   * Pluggable adapter configuration
   */
  public setAdapter(newAdapter: MemoryStorageAdapter): void {
    this.adapter = newAdapter;
    this.pipeline = new MemoryPipeline(this.adapter);
    this.retriever = new MemoryRetriever(this.adapter);
  }

  public getAdapter(): MemoryStorageAdapter {
    return this.adapter;
  }

  /**
   * Seeds the 5 canonical memory categories from specifications
   */
  private seedDefaultMemories() {
    const defaultOrg = "org_acme_corp";
    const defaultUser = "user_01";
    const defaultProduct = "prod_seatbooking_01";

    // 1. User Preference: "Keep my business reports concise."
    this.storeSync({
      type: "user_preference",
      key: "report_conciseness",
      content: "Keep my business reports concise.",
      source: "user_statement",
      importance: "high",
      confidence: 1.0,
      enabled: true,
      orgScope: defaultOrg,
      userScope: defaultUser,
    });

    // 2. Company Memory: "Seatbooking primarily serves restaurants and cafes."
    this.storeSync({
      type: "company_memory",
      key: "target_market",
      content: "Seatbooking primarily serves restaurants and cafes.",
      source: "admin_configuration",
      importance: "critical",
      confidence: 1.0,
      enabled: true,
      orgScope: defaultOrg,
    });

    // Company Cancellation Policy
    this.storeSync({
      type: "company_memory",
      key: "reservation_cancellation_policy",
      content: "Reservations can be cancelled up to 2 hours before dining without penalty. VIP reservations require proactive alert to the General Manager.",
      source: "admin_configuration",
      importance: "critical",
      confidence: 1.0,
      enabled: true,
      orgScope: defaultOrg,
    });

    // 3. Task Memory: "Currently investigating declining reservations."
    this.storeSync({
      type: "task_memory",
      key: "current_task_focus",
      content: "Currently investigating declining reservations.",
      source: "task_execution",
      importance: "medium",
      confidence: 0.9,
      enabled: true,
      orgScope: defaultOrg,
      userScope: defaultUser,
      productScope: defaultProduct,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 4. Product Context: "User is currently working inside Seatbooking."
    this.storeSync({
      type: "product_context",
      key: "active_product_context",
      content: "User is currently working inside Seatbooking.",
      source: "system_inference",
      importance: "medium",
      confidence: 1.0,
      enabled: true,
      orgScope: defaultOrg,
      productScope: defaultProduct,
    });

    // 5. Conversation Memory (Sample contextual seed)
    this.storeSync({
      type: "conversation",
      key: "recent_executive_briefing",
      content: "Operations Director reviewed today's 288 cover pacing across 5 venues.",
      source: "task_execution",
      importance: "low",
      confidence: 1.0,
      enabled: true,
      orgScope: defaultOrg,
      userScope: defaultUser,
      productScope: defaultProduct,
    });
  }

  private storeSync(params: any): MemoryRecord {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      id,
      organizationId: params.orgScope || params.organizationId || "org_acme_corp",
      userId: params.userScope || params.userId,
      type: params.type,
      key: params.key,
      content: params.content,
      source: params.source || "user_statement",
      confidence: params.confidence ?? 1.0,
      importance: params.importance || "medium",
      enabled: params.enabled ?? true,
      createdAt: now,
      updatedAt: now,
      expiresAt: params.expiresAt,
      productScope: params.productScope,
      structuredData: params.structuredData,
    };

    this.adapter.store(record);
    return record;
  }

  /**
   * Stores a new memory record (supports both sync signature for backward compatibility and async)
   */
  public store(params: {
    type: MemoryCategory;
    content: string;
    key?: string;
    organizationId?: string;
    orgScope?: string; // backward compat
    userId?: string;
    userScope?: string; // backward compat
    productScope?: string;
    source?: MemorySource;
    confidence?: number;
    importance?: MemoryImportance;
    enabled?: boolean;
    expiresAt?: string;
    structuredData?: Record<string, unknown>;
  }): MemoryRecord {
    return this.storeSync(params);
  }

  public async getById(id: string, organizationId = "org_acme_corp"): Promise<MemoryRecord | null> {
    return await this.adapter.getById(id, organizationId);
  }

  public update(
    id: string,
    updates: Partial<Omit<MemoryRecord, "id" | "organizationId" | "createdAt">>,
    organizationId = "org_acme_corp"
  ): MemoryRecord | null {
    // Synchronous immediate memory cache update
    let updated: MemoryRecord | null = null;
    this.adapter.update(id, organizationId, updates).then((res) => {
      updated = res;
    });
    return updated;
  }

  public delete(id: string, organizationId = "org_acme_corp"): boolean {
    let deleted = false;
    this.adapter.delete(id, organizationId).then((res) => {
      deleted = res;
    });
    // In-memory immediate delete
    if ("records" in (this.adapter as any)) {
      deleted = (this.adapter as any).records.delete(id);
    }
    return deleted;
  }

  public query(filter?: {
    type?: MemoryCategory;
    organizationId?: string;
    orgScope?: string;
    userId?: string;
    userScope?: string;
    productScope?: string;
    enabledOnly?: boolean;
    limit?: number;
  }): MemoryRecord[] {
    const orgId = filter?.orgScope || filter?.organizationId || "org_acme_corp";
    const userId = filter?.userScope || filter?.userId;

    let results: MemoryRecord[] = [];
    if ("records" in (this.adapter as any)) {
      const recordsMap = (this.adapter as any).records as Map<string, MemoryRecord>;
      const now = new Date().toISOString();
      for (const rec of recordsMap.values()) {
        if (rec.organizationId !== orgId) continue;
        if (filter?.enabledOnly && !rec.enabled) continue;
        if (rec.expiresAt && rec.expiresAt < now) continue;
        if (filter?.type && rec.type !== filter.type) continue;
        if (userId && rec.userId && rec.userId !== userId) continue;
        if (filter?.productScope && rec.productScope && rec.productScope !== filter.productScope) continue;
        results.push({ ...rec });
      }
      results.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      if (filter?.limit) results = results.slice(0, filter.limit);
    }
    return results;
  }

  /**
   * Semantic relevance search
   */
  public async searchSemantic(
    query: string,
    organizationId = "org_acme_corp",
    options?: SemanticSearchOptions
  ): Promise<MemorySearchResult[]> {
    const embedding = (await import("./embedding")).generateEmbedding(query);
    return await this.adapter.searchSemantic(embedding, organizationId, options);
  }

  /**
   * Retrieves relevant memory context for the agent
   */
  public async retrieveRelevant(options: RetrievalContextOptions): Promise<RetrievedMemoryContext> {
    return await this.retriever.retrieveRelevant(options);
  }

  /**
   * Ingest conversation turn through the 4-stage pipeline
   */
  public async processTurn(params: {
    userUtterance: string;
    assistantResponse?: string;
    organizationId: string;
    userId?: string;
    productScope?: string;
  }): Promise<MemoryRecord | null> {
    return await this.pipeline.processTurn(params);
  }

  /**
   * Working task scratchpad management
   */
  public setWorkingMemory(
    key: string,
    data: Record<string, unknown>,
    content: string,
    organizationId = "org_acme_corp"
  ): MemoryRecord {
    // Clear any previous working memory matching this key
    this.clearWorkingMemory(key, organizationId);

    return this.store({
      type: "task_memory",
      key,
      content,
      structuredData: data,
      source: "task_execution",
      importance: "high",
      confidence: 1.0,
      organizationId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  public getWorkingMemory(key: string, organizationId = "org_acme_corp"): MemoryRecord | undefined {
    const list = this.query({ type: "task_memory", organizationId });
    return list.find((r) => r.key === key);
  }

  public clearWorkingMemory(key?: string, organizationId = "org_acme_corp"): void {
    const list = this.query({ type: "task_memory", organizationId });
    for (const r of list) {
      if (!key || r.key === key) {
        this.delete(r.id, organizationId);
      }
    }
  }
}

export const Memory = new MemoryService();
