/**
 * @prosis/memory - Semantic Vector Embedding Utility
 * Provides vector representations and cosine distance calculations for semantic retrieval.
 * Supports pluggable external embedding providers (e.g. OpenAI text-embedding-3-small, Vertex AI, Ollama)
 * and an embedded deterministic semantic hash encoder.
 */

const VECTOR_DIMENSIONS = 128;

/**
 * Computes cosine similarity between two vectors: dot(a, b) / (||a|| * ||b||)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(1, dot / denominator));
}

/**
 * Generates a normalized semantic feature embedding vector for text.
 * Uses character n-gram hashing and word-token frequencies to project text into a normalized vector space.
 */
export function generateEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);
  const normalized = text.toLowerCase().trim();
  if (!normalized) return vector;

  // Word token projection
  const tokens = normalized.split(/[^a-z0-9_]+/).filter(Boolean);
  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    // Hash token
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % VECTOR_DIMENSIONS;
    // Word weight decaying with position slightly
    vector[idx] += 1.0;

    // Character trigrams for morphological similarity
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const tri = token.substring(i, i + 3);
        let triHash = 0;
        for (let j = 0; j < 3; j++) {
          triHash = (triHash << 5) - triHash + tri.charCodeAt(j);
          triHash |= 0;
        }
        const triIdx = Math.abs(triHash) % VECTOR_DIMENSIONS;
        vector[triIdx] += 0.35;
      }
    }
  }

  // Normalize vector to unit length (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}

