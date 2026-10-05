import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export type NuruEntityResolution = {
  query: string;
  status: "RESOLVED" | "UNRESOLVED" | "AMBIGUOUS";
  canonicalId: string | null;
  canonicalName: string | null;
  entityType: string | null;
  confidence: number;
  candidates: Array<{ id: string; name: string; entityType: string }>;
};
type EntityRow = { id: string; canonicalName: string; entityType: string };

function normalizeEntityQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/**
 * Resolves only curator-approved entity identities and aliases. It deliberately
 * declines fuzzy or model-inferred matches so Tandem cannot attach a package to
 * the wrong mission subject.
 */
export class NuruEntityResolutionService {
  constructor(private readonly findCandidates: (normalizedQuery: string) => Promise<EntityRow[]> = async (normalizedQuery) => {
    const entity = nuruKnowledgeRepository.nuruEntity as unknown as { findMany(args: unknown): Promise<EntityRow[]> };
    return entity.findMany({ where: { status: "APPROVED", aliases: { some: { normalizedAlias: normalizedQuery } } }, select: { id: true, canonicalName: true, entityType: true }, take: 11 });
  }) {}

  async resolve(query: string): Promise<NuruEntityResolution> {
    const normalizedQuery = normalizeEntityQuery(query);
    if (!normalizedQuery) return { query, status: "UNRESOLVED", canonicalId: null, canonicalName: null, entityType: null, confidence: 0, candidates: [] };
    const candidates = (await this.findCandidates(normalizedQuery)).slice(0, 10).map((entity) => ({ id: entity.id, name: entity.canonicalName, entityType: entity.entityType }));
    if (candidates.length === 1) return { query, status: "RESOLVED", canonicalId: candidates[0].id, canonicalName: candidates[0].name, entityType: candidates[0].entityType, confidence: 1, candidates };
    if (candidates.length > 1) return { query, status: "AMBIGUOUS", canonicalId: null, canonicalName: null, entityType: null, confidence: 0, candidates };
    return { query, status: "UNRESOLVED", canonicalId: null, canonicalName: null, entityType: null, confidence: 0, candidates: [] };
  }
}

export const nuruEntityResolutionService = new NuruEntityResolutionService();
