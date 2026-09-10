/**
 * @prosis/memory - 4-Stage Memory Ingestion Pipeline
 * Conversation
 *  ➔ 1. Candidate Memory Extraction
 *  ➔ 2. Importance Evaluation (Drop noise)
 *  ➔ 3. Permission / Scope & Secret Validation
 *  ➔ 4. Memory Storage (Embedding & TTL)
 */

import {
  MemoryCategory,
  MemoryImportance,
  MemoryRecord,
  MemorySource,
  MemoryStorageAdapter,
} from "../adapters/adapter";
import { generateEmbedding } from "../embedding";

export interface CandidateMemory {
  type: MemoryCategory;
  content: string;
  source: MemorySource;
  importance: MemoryImportance;
  confidence: number;
  key?: string;
  structuredData?: Record<string, unknown>;
  ttlDays?: number;
}

export class MemoryPipeline {
  private adapter: MemoryStorageAdapter;

  constructor(adapter: MemoryStorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Main Pipeline Entrypoint: Ingests a conversational exchange or system action.
   */
  public async processTurn(params: {
    userUtterance: string;
    assistantResponse?: string;
    organizationId: string;
    userId?: string;
    productScope?: string;
  }): Promise<MemoryRecord | null> {
    // Stage 1: Candidate Memory Extraction
    const candidate = this.extractCandidate(params.userUtterance, params.productScope);
    if (!candidate) return null;

    // Stage 2: Importance Evaluation (Discard low signal or transitory noise)
    const isValuable = this.evaluateImportance(candidate);
    if (!isValuable) return null;

    // Stage 3: Permission & Secret Validation
    const validation = this.validateCandidate(candidate, params.organizationId);
    if (!validation.valid) {
      console.warn(`[MemoryPipeline] Discarded candidate: ${validation.reason}`);
      return null;
    }

    // Stage 4: Memory Storage & Vectorization
    const now = new Date();
    let expiresAt: string | undefined;
    if (candidate.ttlDays) {
      const expDate = new Date(now.getTime() + candidate.ttlDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      organizationId: params.organizationId,
      userId: params.userId,
      type: candidate.type,
      key: candidate.key,
      content: validation.sanitizedContent,
      source: candidate.source,
      confidence: candidate.confidence,
      importance: candidate.importance,
      enabled: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt,
      productScope: params.productScope,
      structuredData: candidate.structuredData,
      embedding: generateEmbedding(validation.sanitizedContent),
    };

    return await this.adapter.store(record);
  }

  /**
   * Stage 1: Candidate Extraction
   */
  private extractCandidate(text: string, productScope?: string): CandidateMemory | null {
    const normalized = text.trim();
    const lower = normalized.toLowerCase();

    // 1. Trivial chit-chat filter (discard immediately)
    const trivialPatterns = [
      /^(hi|hello|hey|good morning|good evening|thanks|thank you|ok|okay|bye|goodbye)$/i,
      /^what(?:'s| is) the (?:weather|time)/i,
    ];
    if (trivialPatterns.some((p) => p.test(lower))) {
      return null;
    }

    // 2. User Preferences (e.g. "Keep my business reports concise", "I prefer...")
    if (
      lower.includes("i prefer") ||
      lower.includes("keep my") ||
      lower.includes("always format") ||
      lower.includes("don't show me") ||
      lower.includes("my preference is")
    ) {
      return {
        type: "user_preference",
        content: normalized,
        source: "user_statement",
        importance: "high",
        confidence: 0.95,
        key: `pref_${Date.now()}`,
      };
    }

    // 3. Company Memory / Policy statements
    if (
      lower.includes("our policy is") ||
      lower.includes("primarily serves") ||
      lower.includes("company rule") ||
      lower.includes("operating standard") ||
      lower.includes("our restaurants")
    ) {
      return {
        type: "company_memory",
        content: normalized,
        source: "user_statement",
        importance: "critical",
        confidence: 0.98,
        key: `rule_${Date.now()}`,
      };
    }

    // 4. Task Memory (e.g. "Currently investigating declining reservations")
    if (
      lower.includes("investigating") ||
      lower.includes("current task") ||
      lower.includes("focus on") ||
      lower.includes("working on")
    ) {
      return {
        type: "task_memory",
        content: normalized,
        source: "user_statement",
        importance: "medium",
        confidence: 0.85,
        ttlDays: 7, // Ephemeral task memory
        key: `task_${Date.now()}`,
      };
    }

    // 5. Product Context
    if (lower.includes("working inside") || lower.includes("using product")) {
      return {
        type: "product_context",
        content: normalized,
        source: "system_inference",
        importance: "medium",
        confidence: 0.9,
        ttlDays: 30,
        key: `context_${Date.now()}`,
      };
    }

    return null;
  }

  /**
   * Stage 2: Importance Evaluation
   */
  private evaluateImportance(candidate: CandidateMemory): boolean {
    // Ephemeral or very short candidate statements below 8 chars are dropped
    if (candidate.content.length < 8) return false;

    // Critical and high importance are always retained
    if (candidate.importance === "critical" || candidate.importance === "high") {
      return true;
    }

    // Medium and low require confidence >= 0.75
    return candidate.confidence >= 0.75;
  }

  /**
   * Stage 3: Permission & Secret Validation
   */
  private validateCandidate(
    candidate: CandidateMemory,
    organizationId: string
  ): { valid: boolean; sanitizedContent: string; reason?: string } {
    if (!organizationId) {
      return { valid: false, sanitizedContent: "", reason: "Missing organizationId boundary" };
    }

    let sanitized = candidate.content;

    // Detect and scrub passwords, credit cards, or API secrets
    const sensitivePatterns = [
      /password\s*[:=]\s*[^\s]+/gi,
      /api[_-]?key\s*[:=]\s*[^\s]+/gi,
      /bearer\s+[A-Za-z0-9_\-\.]+/gi,
      /\b(?:\d[ -]*?){13,16}\b/g, // Credit card numbers
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
      }
    }

    // If candidate was purely a secret or credential dump, reject it
    if (sanitized === "[REDACTED_SECRET]" || sanitized.trim().length === 0) {
      return { valid: false, sanitizedContent: "", reason: "Contains sensitive secret or token" };
    }

    return { valid: true, sanitizedContent: sanitized };
  }
}

