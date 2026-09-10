/**
 * @prosis/memory - InMemoryVectorAdapter
 * High-performance in-memory semantic vector store for local execution, tests, and development.
 * Provides strict tenant isolation, cosine similarity ranking, and TTL expiration filtering.
 */

import {
  MemoryRecord,
  MemoryQueryFilter,
  SemanticSearchOptions,
  MemorySearchResult,
  MemoryStorageAdapter,
} from "./adapter";
import { cosineSimilarity, generateEmbedding } from "../embedding";

export class InMemoryVectorAdapter implements MemoryStorageAdapter {
  public readonly name = "in_memory_vector";
  private records: Map<string, MemoryRecord> = new Map();

  public async initialize(): Promise<void> {
    // In-memory initialization is instantaneous
  }

  public async store(record: MemoryRecord): Promise<MemoryRecord> {
    // Generate embedding if not already provided
    const embedding =
      record.embedding && record.embedding.length > 0
        ? record.embedding
        : generateEmbedding(record.content);

    const fullRecord: MemoryRecord = {
      ...record,
      embedding,
      enabled: record.enabled ?? true,
      updatedAt: new Date().toISOString(),
    };

    this.records.set(fullRecord.id, fullRecord);
    return fullRecord;
  }

  public async getById(id: string, organizationId: string): Promise<MemoryRecord | null> {
    const rec = this.records.get(id);
    if (!rec) return null;
    // Strict tenant boundary
    if (rec.organizationId !== organizationId) return null;
    return { ...rec };
  }

  public async update(
    id: string,
    organizationId: string,
    updates: Partial<Omit<MemoryRecord, "id" | "organizationId" | "createdAt">>
  ): Promise<MemoryRecord | null> {
    const existing = await this.getById(id, organizationId);
    if (!existing) return null;

    let newEmbedding = existing.embedding;
    if (updates.content && updates.content !== existing.content) {
      newEmbedding = generateEmbedding(updates.content);
    }

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      embedding: updates.embedding || newEmbedding,
      updatedAt: new Date().toISOString(),
    };

    this.records.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.getById(id, organizationId);
    if (!existing) return false;
    return this.records.delete(id);
  }

  public async query(filter: MemoryQueryFilter): Promise<MemoryRecord[]> {
    const now = new Date().toISOString();
    let matches: MemoryRecord[] = [];

    for (const record of this.records.values()) {
      // 1. Tenant boundary
      if (record.organizationId !== filter.organizationId) continue;

      // 2. Expiry check
      if (!filter.includeExpired && record.expiresAt && record.expiresAt < now) {
        continue;
      }

      // 3. Enabled check
      if (filter.enabledOnly && !record.enabled) continue;

      // 4. Type filter
      if (filter.type && record.type !== filter.type) continue;

      // 5. User filter
      if (filter.userId && record.userId && record.userId !== filter.userId) {
        continue;
      }

      // 6. Product filter
      if (
        filter.productScope &&
        record.productScope &&
        record.productScope !== filter.productScope
      ) {
        continue;
      }

      matches.push({ ...record });
    }

    matches.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    if (filter.limit && filter.limit > 0) {
      matches = matches.slice(0, filter.limit);
    }

    return matches;
  }

  public async searchSemantic(
    queryEmbedding: number[],
    organizationId: string,
    options?: SemanticSearchOptions
  ): Promise<MemorySearchResult[]> {
    const now = new Date().toISOString();
    const results: MemorySearchResult[] = [];
    const minSim = options?.minSimilarity ?? 0.25;

    for (const record of this.records.values()) {
      // Strict tenant isolation
      if (record.organizationId !== organizationId) continue;
      // Must be active and not expired
      if (!record.enabled) continue;
      if (record.expiresAt && record.expiresAt < now) continue;

      // Type filter
      if (options?.type && record.type !== options.type) continue;

      // User filter
      if (options?.userId && record.userId && record.userId !== options.userId) {
        continue;
      }

      // Product filter
      if (
        options?.productScope &&
        record.productScope &&
        record.productScope !== options.productScope
      ) {
        continue;
      }

      if (!record.embedding || record.embedding.length === 0) continue;

      const sim = cosineSimilarity(queryEmbedding, record.embedding);
      if (sim >= minSim) {
        results.push({
          memory: { ...record },
          similarityScore: sim,
        });
      }
    }

    // Sort by highest cosine similarity
    results.sort((a, b) => b.similarityScore - a.similarityScore);

    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }
}

