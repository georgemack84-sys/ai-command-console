import { z } from "zod";
import { relationshipTypes, sourceTypes } from "@/src/nuru/domain";
import { nuruKnowledgeRepository, type ArchiveKnowledgeRow } from "@/src/server/repositories/nuru-knowledge-repository";
import type { NuruArchiveModel } from "@/src/server/repositories/nuru-knowledge-repository";

export const nuruSearchSchema = z.object({
  query: z.string().trim().max(500).optional(),
  project: z.string().trim().max(120).optional(),
  type: z.string().trim().max(160).optional(),
  sourceType: z.enum(sourceTypes).optional(),
  statuses: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  metadata: z.record(z.string().max(100), z.string().max(300)).default({}),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  relationshipFrom: z.string().min(1).optional(),
  relationshipTypes: z.array(z.enum(relationshipTypes)).max(20).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type NuruSearch = z.infer<typeof nuruSearchSchema>;

const archiveRepository = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;

export function buildNuruSearchWhere(search: NuruSearch, ids?: string[]) {
  const filters: Record<string, unknown>[] = [];
  if (search.query) filters.push({ OR: [{ title: { contains: search.query, mode: "insensitive" } }, { content: { contains: search.query, mode: "insensitive" } }] });
  if (search.project) filters.push({ project: search.project });
  if (search.type) filters.push({ contentType: search.type });
  if (search.sourceType) filters.push({ source: { path: ["sourceType"], equals: search.sourceType } });
  if (search.statuses?.length) filters.push({ status: { in: search.statuses } });
  if (search.createdAfter || search.createdBefore) filters.push({ createdAt: { ...(search.createdAfter ? { gte: search.createdAfter } : {}), ...(search.createdBefore ? { lte: search.createdBefore } : {}) } });
  for (const [key, value] of Object.entries(search.metadata)) filters.push({ metadata: { path: [key], equals: value } });
  if (ids) filters.push({ id: { in: ids } });
  return filters.length ? { AND: filters } : {};
}

export type NuruSearchCandidate = Pick<ArchiveKnowledgeRow, "id" | "title" | "contentType" | "status" | "project" | "confidence" | "createdAt">;

/** Deterministic retrieval only: candidate interpretation remains an agent responsibility. */
export const NuruSearchService = {
  async search(rawSearch: NuruSearch): Promise<NuruSearchCandidate[]> {
    const search = nuruSearchSchema.parse(rawSearch);
    let relationshipIds: string[] | undefined;
    if (search.relationshipFrom) {
      const relationships = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { OR: [{ sourceItemId: search.relationshipFrom }, { targetItemId: search.relationshipFrom }], ...(search.relationshipTypes ? { relationshipType: { in: search.relationshipTypes } } : {}), status: "APPROVED" } });
      relationshipIds = [...new Set(relationships.map((relationship) => relationship.sourceItemId === search.relationshipFrom ? relationship.targetItemId : relationship.sourceItemId))];
      if (relationshipIds.length === 0) return [];
    }
    return archiveRepository.findMany({ where: buildNuruSearchWhere(search, relationshipIds), orderBy: [{ confidence: "desc" }, { createdAt: "desc" }], take: search.limit }).then((items) => items.map(({ id, title, contentType, status, project, confidence, createdAt }) => ({ id, title, contentType, status, project, confidence, createdAt })));
  },
};
