/**
 * @prosis/memory - Pluggable Storage Adapter Architecture
 * Defines the contract for persistent vector backends (PostgreSQL + pgvector, InMemory, Pinecone, etc.)
 * Ensures the memory service can change vector database engines without affecting business logic.
 */

export type MemoryCategory =
  | "conversation"
  | "user_preference"
  | "company_memory"
  | "task_memory"
  | "product_context";

export type MemoryImportance = "low" | "medium" | "high" | "critical";

export type MemorySource =
  | "user_statement"
  | "system_inference"
  | "admin_configuration"
  | "task_execution";

export interface MemoryRecord {
  id: string;
  organizationId: string;
  userId?: string;
  type: MemoryCategory;
  key?: string;
  content: string;
  source: MemorySource;
  confidence: number; // 0.0 - 1.0
  importance: MemoryImportance;
  enabled: boolean; // User can toggle memory off without deleting
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601 (TTL)
  productScope?: string;
  structuredData?: Record<string, unknown>;
  embedding?: number[]; // Vector embedding for cosine similarity search
}

export interface MemoryQueryFilter {
  organizationId: string;
  userId?: string;
  type?: MemoryCategory;
  productScope?: string;
  enabledOnly?: boolean;
  minImportance?: MemoryImportance;
  includeExpired?: boolean;
  limit?: number;
}

export interface SemanticSearchOptions {
  limit?: number;
  minSimilarity?: number; // 0.0 - 1.0
  type?: MemoryCategory;
  productScope?: string;
  userId?: string;
}

export interface MemorySearchResult {
  memory: MemoryRecord;
  similarityScore: number;
}

/**
 * Storage Adapter Interface
 */
export interface MemoryStorageAdapter {
  name: string;
  initialize(): Promise<void>;
  store(record: MemoryRecord): Promise<MemoryRecord>;
  getById(id: string, organizationId: string): Promise<MemoryRecord | null>;
  update(
    id: string,
    organizationId: string,
    updates: Partial<Omit<MemoryRecord, "id" | "organizationId" | "createdAt">>
  ): Promise<MemoryRecord | null>;
  delete(id: string, organizationId: string): Promise<boolean>;
  query(filter: MemoryQueryFilter): Promise<MemoryRecord[]>;
  searchSemantic(
    queryEmbedding: number[],
    organizationId: string,
    options?: SemanticSearchOptions
  ): Promise<MemorySearchResult[]>;
}

