import { z } from "zod";
import { NuruSearchService } from "@/src/server/services/nuru-search-service";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
import { nuruEmbeddingsService, type NuruEmbeddingsService } from "@/src/server/services/nuru-embeddings-service";

export const crossProjectConnectionInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), primaryProject: z.string().min(1), relatedProjects: z.array(z.string()).default([]), limit: z.number().int().min(1).max(20).default(10) });
export const crossProjectConnectionSchema = z.object({ itemId: z.string(), targetItemId: z.string(), targetProject: z.string(), relationshipType: z.literal("RELATED_TO"), confidence: z.number().min(0).max(1), evidence: z.string(), status: z.literal("PROPOSED") });
export type CrossProjectConnection = z.infer<typeof crossProjectConnectionSchema>;

/** Deterministic ecosystem retrieval. The Connection Agent decides whether candidate edges are meaningful. */
export class NuruCrossProjectConnectionService {
  constructor(private readonly search: Pick<typeof NuruSearchService, "search"> = NuruSearchService, private readonly archive: Pick<typeof NuruArchiveService, "retrieve"> = NuruArchiveService, private readonly embeddings: Pick<NuruEmbeddingsService, "similar"> = nuruEmbeddingsService) {}

  async find(rawInput: z.input<typeof crossProjectConnectionInputSchema>): Promise<CrossProjectConnection[]> {
    const input = crossProjectConnectionInputSchema.parse(rawInput);
    const [keyword, semantic] = await Promise.all([this.search.search({ query: input.title, metadata: {}, limit: input.limit * 2 }), this.embeddings.similar(input.content, input.limit * 2, input.itemId)]);
    const scores = new Map<string, number>();
    for (const candidate of keyword) scores.set(candidate.id, candidate.confidence);
    for (const candidate of semantic) scores.set(candidate.itemId, Math.max(scores.get(candidate.itemId) ?? 0, candidate.score));
    const records = await Promise.all([...scores.keys()].map(async (id) => ({ id, score: scores.get(id) ?? 0, item: await this.archive.retrieve(id) })));
    return records.filter(({ id, item }) => id !== input.itemId && Boolean(item?.project) && item?.project !== input.primaryProject).sort((left, right) => right.score - left.score).slice(0, input.limit).map(({ id, score, item }) => crossProjectConnectionSchema.parse({ itemId: input.itemId, targetItemId: id, targetProject: item?.project, relationshipType: "RELATED_TO", confidence: Math.max(0.4, score), evidence: `Cross-project retrieval found related ${item?.project} knowledge: “${item?.title}”.`, status: "PROPOSED" }));
  }
}

export const nuruCrossProjectConnectionService = new NuruCrossProjectConnectionService();
