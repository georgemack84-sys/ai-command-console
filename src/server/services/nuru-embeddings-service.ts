import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

const DIMENSIONS = 64;
const index = new Map<string, { itemId: string; chunkId: string; text: string; vector: number[] }>();

export interface NuruEmbeddingProvider {
  embed(input: string): Promise<number[]>;
  readonly name: string;
  readonly model: string;
}

function tokenHash(token: string) {
  let hash = 2166136261;
  for (const character of token) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Local deterministic fallback; replace with a hosted provider without changing callers. */
export const deterministicEmbeddingProvider: NuruEmbeddingProvider = {
  name: "deterministic", model: "token-hash-v1",
  async embed(input) {
    const vector = Array.from({ length: DIMENSIONS }, () => 0);
    for (const token of input.toLowerCase().match(/[a-z0-9]+/g) ?? []) vector[tokenHash(token) % DIMENSIONS] += 1;
    const magnitude = Math.hypot(...vector) || 1;
    return vector.map((value) => value / magnitude);
  },
};

export function chunkText(content: string, size = 800) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  return Array.from({ length: Math.ceil(words.length / size) }, (_, index) => words.slice(index * size, (index + 1) * size).join(" ")).filter(Boolean);
}

function cosine(left: number[], right: number[]) { return left.reduce((total, value, index) => total + value * (right[index] ?? 0), 0); }

export class NuruEmbeddingsService {
  constructor(private readonly provider: NuruEmbeddingProvider = deterministicEmbeddingProvider) {}

  embed(content: string) { return this.provider.embed(content); }

  async index(itemId: string, content: string) {
    const chunks = chunkText(content);
    await this.remove(itemId);
    await Promise.all(chunks.map(async (text, position) => {
      const chunkId = `${itemId}:${position}`;
      index.set(chunkId, { itemId, chunkId, text, vector: await this.embed(text) });
      await nuruKnowledgeRepository.nuruEmbeddingReference.upsert({ where: { provider_externalRef: { provider: this.provider.name, externalRef: chunkId } }, create: { itemId, provider: this.provider.name, model: this.provider.model, externalRef: chunkId }, update: { itemId, model: this.provider.model } });
    }));
    return { itemId, chunks: chunks.length, provider: this.provider.name, model: this.provider.model };
  }

  async remove(itemId: string) {
    for (const [chunkId, entry] of index) if (entry.itemId === itemId) index.delete(chunkId);
    await nuruKnowledgeRepository.nuruEmbeddingReference.deleteMany({ where: { itemId, provider: this.provider.name } });
  }

  async similar(content: string, limit = 10, excludeItemId?: string) {
    const query = await this.embed(content);
    return [...index.values()].filter((entry) => entry.itemId !== excludeItemId).map((entry) => ({ itemId: entry.itemId, chunkId: entry.chunkId, score: cosine(query, entry.vector), excerpt: entry.text.slice(0, 240) })).sort((left, right) => right.score - left.score).slice(0, Math.max(1, Math.min(limit, 100)));
  }
}

export const nuruEmbeddingsService = new NuruEmbeddingsService();
