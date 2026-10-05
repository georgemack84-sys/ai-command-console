import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

const claimStates = ["CANDIDATE", "VERIFIED", "DISPUTED", "RETRACTED"] as const;
const correctionActions = ["ACCEPT", "REJECT"] as const;

export const temporalClaimInputSchema = z.object({
  subjectId: z.string().min(1).max(200), predicate: z.string().min(1).max(200), value: z.unknown().refine((value) => value !== undefined, "A claim value is required."), normalizedValue: z.string().min(1).max(2_000),
  state: z.enum(claimStates), effectiveFrom: z.coerce.date(), effectiveTo: z.coerce.date().optional(), assertedAt: z.coerce.date(), observedAt: z.coerce.date(), developmentId: z.string().min(1).optional(),
  evidence: z.array(z.object({ referenceId: z.string().min(1), detail: z.string().min(1).max(2_000) })).min(1).max(100),
  provenance: z.object({ normalizedDocumentIds: z.array(z.string().min(1)).max(100).default([]), developmentId: z.string().min(1).optional() }).refine((value) => value.normalizedDocumentIds.length > 0 || Boolean(value.developmentId), "A temporal claim requires source provenance."),
}).superRefine((value, context) => { if (value.effectiveTo && value.effectiveTo <= value.effectiveFrom) context.addIssue({ code: z.ZodIssueCode.custom, path: ["effectiveTo"], message: "effectiveTo must be after effectiveFrom." }); });

export const correctionRequestSchema = z.object({ previousClaimId: z.string().min(1), correctedClaimId: z.string().min(1), reason: z.string().min(3).max(2_000), evidence: z.array(z.object({ referenceId: z.string().min(1), detail: z.string().min(1).max(2_000) })).min(1).max(100) }).refine((value) => value.previousClaimId !== value.correctedClaimId, "A correction requires distinct claim versions.");
export const correctionDecisionSchema = z.object({ correctionId: z.string().min(1), action: z.enum(correctionActions), reason: z.string().min(3).max(2_000) });

type ClaimRow = { id: string; workspaceId: string; subjectId: string; predicate: string };
const claims = nuruKnowledgeRepository.nuruTemporalClaim as unknown as { create(args: unknown): Promise<ClaimRow>; findMany(args: unknown): Promise<ClaimRow[]>; findUnique(args: unknown): Promise<ClaimRow | null> };
type CorrectionRow = { id: string; workspaceId: string; subjectId: string; correctedClaimId: string };
type DecisionRow = { correctionId: string; action: string; createdAt: Date };
const corrections = nuruKnowledgeRepository.nuruKnowledgeCorrection as unknown as { create(args: unknown): Promise<{ id: string }>; findMany(args: unknown): Promise<CorrectionRow[]>; findUnique(args: unknown): Promise<{ id: string; workspaceId: string } | null> };
const decisions = nuruKnowledgeRepository.nuruKnowledgeCorrectionDecision as unknown as { create(args: unknown): Promise<unknown>; findMany(args: unknown): Promise<DecisionRow[]>; findUnique(args: unknown): Promise<{ id: string } | null> };

/** Evidence-only claim history. This service has no dependency on the canonical archive writer. */
export const NuruTemporalClaimService = {
  async record(raw: z.input<typeof temporalClaimInputSchema>, context: { workspaceId: string; actor: string; correlationId: string }) {
    const input = temporalClaimInputSchema.parse(raw);
    const claim = await claims.create({ data: { id: `NURU-CLAIM-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, workspaceId: context.workspaceId, ...input, recordedAt: new Date(), developmentId: input.developmentId ?? input.provenance.developmentId ?? null, createdBy: context.actor, correlationId: context.correlationId } });
    await NuruAuditService.record({ operation: "TEMPORAL_CLAIM_RECORDED", actor: context.actor, resourceId: claim.id, inputReference: input.subjectId, decision: "EVIDENCE_RECORDED", reason: "Temporal claim recorded as evidence; canonical knowledge was not changed.", correlationId: context.correlationId });
    return claim;
  },

  async requestCorrection(raw: z.input<typeof correctionRequestSchema>, context: { workspaceId: string; actor: string; correlationId: string }) {
    const input = correctionRequestSchema.parse(raw);
    const [previous, corrected] = await Promise.all([claims.findUnique({ where: { id: input.previousClaimId } }), claims.findUnique({ where: { id: input.correctedClaimId } })]);
    if (!previous || !corrected || previous.workspaceId !== context.workspaceId || corrected.workspaceId !== context.workspaceId) throw new AppError(404, "temporal_claim_not_found", "Both temporal claims must exist in this workspace.");
    if (previous.subjectId !== corrected.subjectId || previous.predicate !== corrected.predicate) throw new AppError(400, "incompatible_correction", "A correction must concern the same subject and predicate.");
    const correction = await corrections.create({ data: { id: `NURU-CORR-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, workspaceId: context.workspaceId, subjectId: previous.subjectId, ...input, requestedBy: context.actor, correlationId: context.correlationId } });
    await NuruAuditService.record({ operation: "KNOWLEDGE_CORRECTION_PROPOSED", actor: context.actor, resourceId: correction.id, inputReference: previous.id, outputReference: corrected.id, decision: "PENDING_REVIEW", reason: input.reason, correlationId: context.correlationId });
    return correction;
  },

  async decideCorrection(raw: z.input<typeof correctionDecisionSchema>, context: { workspaceId: string; actor: string; correlationId: string }) {
    const input = correctionDecisionSchema.parse(raw);
    const correction = await corrections.findUnique({ where: { id: input.correctionId } });
    if (!correction || correction.workspaceId !== context.workspaceId) throw new AppError(404, "correction_not_found", "The correction was not found in this workspace.");
    if (await decisions.findUnique({ where: { correctionId: input.correctionId } })) throw new AppError(409, "correction_already_decided", "This correction already has an immutable decision.");
    const decision = await decisions.create({ data: { id: `NURU-CORR-DEC-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, correctionId: correction.id, action: input.action, reason: input.reason, decidedBy: context.actor, correlationId: context.correlationId } });
    await NuruAuditService.record({ operation: "KNOWLEDGE_CORRECTION_REVIEWED", actor: context.actor, resourceId: correction.id, decision: input.action, reason: input.reason, correlationId: context.correlationId });
    return decision;
  },

  async timeline(workspaceId: string, subjectId: string) { return claims.findMany({ where: { workspaceId, subjectId }, orderBy: [{ predicate: "asc" }, { effectiveFrom: "asc" }, { recordedAt: "asc" }], take: 500 }); },
  async correctionHistory(workspaceId: string, subjectId: string) {
    const items = await corrections.findMany({ where: { workspaceId, subjectId }, orderBy: { createdAt: "asc" }, take: 500 });
    const reviewRecords = items.length ? await decisions.findMany({ where: { correctionId: { in: items.map((item) => item.id) } }, orderBy: { createdAt: "asc" } }) : [];
    const reviews = new Map(reviewRecords.map((review) => [review.correctionId, review]));
    return items.map((item) => ({ ...item, decision: reviews.get(item.id) ?? null }));
  },
};
