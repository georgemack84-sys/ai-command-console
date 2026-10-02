import { z } from "zod";
import { sourceAuthorityClasses, sourceClassificationContexts } from "@/src/nuru/source-intelligence";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const sourceClassificationSchema = z.object({
  claimCandidateId: z.string().min(1), workspaceId: z.string().min(1),
  sourceClass: z.enum(sourceAuthorityClasses), context: z.enum(sourceClassificationContexts),
  rationale: z.string().trim().min(3).max(2_000),
});

/** Context-bound authority assessment. This intentionally records no support or admission decision. */
export const NuruSourceClassificationService = {
  async classify(rawInput: z.input<typeof sourceClassificationSchema>, actor: string, correlationId: string) {
    const input = sourceClassificationSchema.parse(rawInput);
    const claim = await nuruKnowledgeRepository.nuruClaimCandidate.findUnique({ where: { id: input.claimCandidateId } }) as Record<string, unknown> | null;
    if (!claim || claim.workspaceId !== input.workspaceId) throw new AppError(404, "claim_candidate_not_found", "The claim candidate was not found in this workspace.");
    const id = `NSI-CLASS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const classification = await nuruKnowledgeRepository.nuruSourceClassification.upsert({
      where: { claimCandidateId_sourceRegistryId: { claimCandidateId: input.claimCandidateId, sourceRegistryId: String(claim.sourceRegistryId) } },
      create: { id, workspaceId: input.workspaceId, claimCandidateId: input.claimCandidateId, sourceRegistryId: String(claim.sourceRegistryId), sourceClass: input.sourceClass, context: input.context, rationale: input.rationale, classifiedBy: actor },
      update: { sourceClass: input.sourceClass, context: input.context, rationale: input.rationale, classifiedBy: actor },
    }) as Record<string, unknown>;
    await NuruAuditService.record({ operation: "NSI_SOURCE_CLASSIFIED", actor, resourceId: input.claimCandidateId, inputReference: String(claim.sourceRegistryId), outputReference: String(classification.id), decision: input.sourceClass, reason: input.rationale, correlationId });
    return classification;
  },
  async listForClaim(claimCandidateId: string, workspaceId: string) {
    return nuruKnowledgeRepository.nuruSourceClassification.findMany({ where: { claimCandidateId, workspaceId }, orderBy: { createdAt: "desc" } });
  },
};
