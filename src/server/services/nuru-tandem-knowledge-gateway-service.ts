import { z } from "zod";
import { tandemKnowledgePackageSchema, tandemKnowledgeRequestSchema, type TandemKnowledgePackage, type TandemKnowledgeRequest } from "@/src/tandem/nuru-knowledge-contracts";
import { buildNuruSearchWhere } from "@/src/server/services/nuru-search-service";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruProvenanceService } from "@/src/server/services/nuru-provenance-service";
import { NuruTemporalClaimService } from "@/src/server/services/nuru-temporal-claim-service";
import { nuruEntityResolutionService, type NuruEntityResolution } from "@/src/server/services/nuru-entity-resolution-service";

type CanonicalKnowledgeRecord = {
  id: string; title: string; content: string; contentType: string; status: string; confidence: number; createdAt: Date; source: unknown;
};
type ProvenanceRecord = { stage: string; referenceId: string; actor: string; createdAt?: Date };
type TemporalClaimRecord = {
  id: string; subjectId: string; predicate: string; value: unknown; normalizedValue: string; state: string; effectiveFrom: Date; effectiveTo: Date | null;
  assertedAt: Date; observedAt: Date; evidence: unknown;
};

export type NuruTandemKnowledgeSource = {
  resolveEntity(subject: string): Promise<NuruEntityResolution>;
  findApproved(subject: string, limit: number): Promise<CanonicalKnowledgeRecord[]>;
  provenanceFor(knowledgeItemId: string): Promise<ProvenanceRecord[]>;
  timeline(workspaceId: string, subject: string): Promise<TemporalClaimRecord[]>;
  relatedApproved?(itemIds: string[], limit: number): Promise<{ records: CanonicalKnowledgeRecord[]; relationships: Array<{ sourceItemId: string; targetItemId: string; relationshipType: string; confidence: number; evidence: string }> }>;
};

const sourceSchema = z.object({ sourceType: z.string().min(1), origin: z.string().min(1), uri: z.string().url().optional(), authority: z.string().min(1) });
const claimEvidenceSchema = z.array(z.object({ referenceId: z.string().min(1), detail: z.string().min(1) })).min(1);

const defaultSource: NuruTandemKnowledgeSource = {
  resolveEntity: (subject) => nuruEntityResolutionService.resolve(subject),
  async findApproved(subject, limit) {
    const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as { findMany(args: unknown): Promise<CanonicalKnowledgeRecord[]> };
    return archive.findMany({ where: buildNuruSearchWhere({ query: subject, metadata: {}, statuses: ["APPROVED"], limit }), orderBy: [{ confidence: "desc" }, { createdAt: "desc" }], take: limit });
  },
  provenanceFor: (knowledgeItemId) => NuruProvenanceService.chain(knowledgeItemId) as Promise<ProvenanceRecord[]>,
  timeline: (workspaceId, subject) => NuruTemporalClaimService.timeline(workspaceId, subject) as unknown as Promise<TemporalClaimRecord[]>,
  async relatedApproved(itemIds, limit) { const relationships = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { status: "APPROVED", OR: [{ sourceItemId: { in: itemIds } }, { targetItemId: { in: itemIds } }] } }) as Array<{ sourceItemId: string; targetItemId: string; relationshipType: string; confidence: number; evidence: string }>; const ids = [...new Set(relationships.flatMap((r) => [r.sourceItemId, r.targetItemId]).filter((id) => !itemIds.includes(id)))]; const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as { findMany(args: unknown): Promise<CanonicalKnowledgeRecord[]> }; return { relationships, records: ids.length ? await archive.findMany({ where: { id: { in: ids }, status: "APPROVED" }, take: limit }) : [] }; },
};

function toIso(value: Date) { return value.toISOString(); }

/**
 * Nuru's Tandem boundary. It retrieves approved, traceable knowledge only and
 * never imports mission output, participant suggestions, or agent output into Nuru.
 */
export class NuruTandemKnowledgeGatewayService {
  constructor(private readonly source: NuruTandemKnowledgeSource = defaultSource) {}

  async retrieve(rawRequest: TandemKnowledgeRequest, context: { workspaceId: string }): Promise<TandemKnowledgePackage> {
    const request = tandemKnowledgeRequestSchema.parse(rawRequest);
    const resolvedEntity = await this.source.resolveEntity(request.subject);
    if (resolvedEntity.status !== "RESOLVED" || !resolvedEntity.canonicalId || !resolvedEntity.canonicalName) {
      return tandemKnowledgePackageSchema.parse({
        packageId: `NURU-PKG-${crypto.randomUUID()}`,
        authority: "NURU", authorityVersion: "NURU_TANDEM_V1", requestId: request.requestId, missionId: request.missionId, subject: request.subject, resolvedEntity,
        retrievedAt: new Date().toISOString(), freshnessRequirement: request.freshnessRequirement, knowledge: [], temporalClaims: [], relationships: [], uncertainties: [],
        openQuestions: [resolvedEntity.status === "AMBIGUOUS" ? "The requested entity is ambiguous; select a canonical Nuru entity before retrieval." : "The requested entity is not registered as an approved Nuru entity."],
        writePolicy: "READ_ONLY_NO_CANONICAL_WRITE",
      });
    }
    const [records, timeline] = await Promise.all([
      this.source.findApproved(resolvedEntity.canonicalName, request.maxResults),
      this.source.timeline(context.workspaceId, resolvedEntity.canonicalId),
    ]);
    const related = this.source.relatedApproved ? await this.source.relatedApproved(records.map((record) => record.id), request.maxResults) : { records: [], relationships: [] };
    records.push(...related.records);
    const provenance = await Promise.all(records.map((record) => this.source.provenanceFor(record.id)));
    const withheld = records.length - provenance.filter((chain, index) => chain.length > 0 && sourceSchema.safeParse(records[index].source).success).length;
    const knowledge = records.flatMap((record, index) => {
      const source = sourceSchema.safeParse(record.source);
      const chain = provenance[index];
      if (!source.success || chain.length === 0) return [];
      return [{ id: record.id, title: record.title, content: record.content, contentType: record.contentType, confidence: record.confidence, createdAt: toIso(record.createdAt), source: source.data, provenance: chain.map((step) => ({ stage: step.stage, referenceId: step.referenceId, actor: step.actor, ...(step.createdAt ? { recordedAt: toIso(step.createdAt) } : {}) })) }];
    });
    const asOf = request.asOf ?? new Date();
    const temporalClaims = timeline.flatMap((claim) => {
      const evidence = claimEvidenceSchema.safeParse(claim.evidence);
      const activeAtRequestedTime = claim.effectiveFrom <= asOf && (!claim.effectiveTo || claim.effectiveTo > asOf);
      if (!activeAtRequestedTime || !evidence.success || (claim.state !== "VERIFIED" && claim.state !== "DISPUTED")) return [];
      return [{ ...claim, state: claim.state as "VERIFIED" | "DISPUTED", effectiveFrom: toIso(claim.effectiveFrom), effectiveTo: claim.effectiveTo ? toIso(claim.effectiveTo) : null, assertedAt: toIso(claim.assertedAt), observedAt: toIso(claim.observedAt), evidence: evidence.data }];
    });
    const uncertainties = [
      ...(withheld ? [`${withheld} matching approved record${withheld === 1 ? " was" : "s were"} withheld because complete provenance is unavailable.`] : []),
      ...temporalClaims.filter((claim) => claim.state === "DISPUTED").map((claim) => `Temporal claim ${claim.id} is disputed.`),
    ];
    return tandemKnowledgePackageSchema.parse({
      packageId: `NURU-PKG-${crypto.randomUUID()}`,
      authority: "NURU", authorityVersion: "NURU_TANDEM_V1", requestId: request.requestId, missionId: request.missionId, subject: request.subject, resolvedEntity,
      retrievedAt: new Date().toISOString(), freshnessRequirement: request.freshnessRequirement, knowledge, temporalClaims, relationships: related.relationships, uncertainties,
      openQuestions: knowledge.length === 0 ? ["No approved, fully traceable Nuru knowledge matched this request."] : [],
      writePolicy: "READ_ONLY_NO_CANONICAL_WRITE",
    });
  }
}

export const nuruTandemKnowledgeGatewayService = new NuruTandemKnowledgeGatewayService();
