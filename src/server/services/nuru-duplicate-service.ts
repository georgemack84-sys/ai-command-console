import { createHash } from "node:crypto";
import { z } from "zod";
import { nuruKnowledgeRepository, type NuruArchiveModel } from "@/src/server/repositories/nuru-knowledge-repository";
import { nuruEmbeddingsService, type NuruEmbeddingsService } from "@/src/server/services/nuru-embeddings-service";

export const duplicateResults = ["NOT_DUPLICATE", "EXACT_DUPLICATE", "POSSIBLE_DUPLICATE", "SEMANTIC_DUPLICATE", "UPDATED_VERSION"] as const;
export const duplicateAssessmentInputSchema = z.object({ itemId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), contentType: z.string().optional(), metadata: z.record(z.string(), z.unknown()).default({}), limit: z.number().int().min(1).max(50).default(20) });
export const duplicateAssessmentSchema = z.object({ itemId: z.string(), result: z.enum(duplicateResults), matchedItemId: z.string().optional(), contentHash: z.string(), metadataScore: z.number().min(0).max(1), semanticScore: z.number().min(-1).max(1), confidence: z.number().min(0).max(1), evidence: z.array(z.string()) });
export type DuplicateAssessment = z.infer<typeof duplicateAssessmentSchema>;

const archiveRepository = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
function hash(content: string) { return createHash("sha256").update(content.trim().replace(/\s+/g, " ")).digest("hex"); }
function metadataScore(left: Record<string, unknown>, right: unknown) { const candidate = right && typeof right === "object" && !Array.isArray(right) ? right as Record<string, unknown> : {}; const keys = Object.keys(left); return keys.length ? keys.filter((key) => left[key] === candidate[key]).length / keys.length : 0; }

/** Deterministic duplicate detection; it supplies evidence for agents and governance, never an autonomous merge. */
export class NuruDuplicateService {
  constructor(private readonly embeddings: Pick<NuruEmbeddingsService, "similar"> = nuruEmbeddingsService) {}

  async assess(rawInput: z.input<typeof duplicateAssessmentInputSchema>): Promise<DuplicateAssessment> {
    const input = duplicateAssessmentInputSchema.parse(rawInput); const contentHash = hash(input.content);
    const candidates = await archiveRepository.findMany({ where: { ...(input.project ? { project: input.project } : {}), ...(input.contentType ? { contentType: input.contentType } : {}) }, take: input.limit, orderBy: { createdAt: "desc" } });
    const exact = candidates.find((candidate) => candidate.id !== input.itemId && hash(candidate.content) === contentHash);
    const titleMatch = candidates.find((candidate) => candidate.id !== input.itemId && candidate.title.trim().toLowerCase() === input.title.trim().toLowerCase());
    const metadataMatch = candidates.map((candidate) => ({ candidate, score: metadataScore(input.metadata, candidate.metadata) })).sort((left, right) => right.score - left.score)[0];
    const semantic = (await this.embeddings.similar(input.content, input.limit, input.itemId)).find((candidate) => candidate.score >= 0.75);
    const version = typeof input.metadata.version === "string";
    const result = exact ? "EXACT_DUPLICATE" : version && titleMatch ? "UPDATED_VERSION" : semantic?.score && semantic.score >= 0.88 ? "SEMANTIC_DUPLICATE" : titleMatch || (metadataMatch?.score ?? 0) >= 0.6 ? "POSSIBLE_DUPLICATE" : "NOT_DUPLICATE";
    const matchedItemId = exact?.id ?? (result === "SEMANTIC_DUPLICATE" ? semantic?.itemId : titleMatch?.id ?? metadataMatch?.candidate.id);
    const score = result === "EXACT_DUPLICATE" ? 1 : result === "SEMANTIC_DUPLICATE" ? semantic?.score ?? 0.88 : result === "UPDATED_VERSION" ? 0.85 : result === "POSSIBLE_DUPLICATE" ? Math.max(0.6, metadataMatch?.score ?? 0) : 0.2;
    const assessment = duplicateAssessmentSchema.parse({ itemId: input.itemId, result, matchedItemId, contentHash, metadataScore: metadataMatch?.score ?? 0, semanticScore: semantic?.score ?? 0, confidence: score, evidence: [exact ? "Normalized content hash matches an archived item." : null, titleMatch ? "Title matches an archived item." : null, semantic ? `Embedding similarity score: ${semantic.score.toFixed(2)}.` : null, metadataMatch?.score ? `Metadata overlap: ${Math.round(metadataMatch.score * 100)}%.` : null].filter(Boolean) });
    await nuruKnowledgeRepository.nuruDuplicateAssessment.create({ data: assessment });
    return assessment;
  }
}

export const nuruDuplicateService = new NuruDuplicateService();
