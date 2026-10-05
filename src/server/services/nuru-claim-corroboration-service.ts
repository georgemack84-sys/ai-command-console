import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const corroborationSchema = z.object({ claimCandidateId: z.string().min(1), supportingClaimId: z.string().min(1), workspaceId: z.string().min(1), sourceRelationship: z.enum(["ORIGINAL", "DERIVED", "SYNDICATED", "CITED", "INDEPENDENT"]), supportsClaim: z.boolean(), rationale: z.string().trim().min(3).max(2_000) });
export const NuruClaimCorroborationService = {
  async record(raw: z.input<typeof corroborationSchema>, actor: string, correlationId: string) {
    const input = corroborationSchema.parse(raw); if (input.claimCandidateId === input.supportingClaimId) throw new AppError(400, "self_corroboration", "A claim cannot corroborate itself.");
    const claims = await nuruKnowledgeRepository.nuruClaimCandidate.findMany({ where: { id: { in: [input.claimCandidateId, input.supportingClaimId] }, workspaceId: input.workspaceId } }) as Record<string, unknown>[];
    if (claims.length !== 2) throw new AppError(404, "claim_candidate_not_found", "Both claim candidates must exist in this workspace.");
    const [claim, supporting] = [claims.find((item) => item.id === input.claimCandidateId)!, claims.find((item) => item.id === input.supportingClaimId)!];
    if (input.sourceRelationship === "INDEPENDENT" && claim.sourceRegistryId === supporting.sourceRegistryId) throw new AppError(400, "independence_conflict", "Claims from the same registered source cannot be marked independent.");
    const row = await nuruKnowledgeRepository.nuruClaimCorroboration.upsert({ where: { claimCandidateId_supportingClaimId: { claimCandidateId: input.claimCandidateId, supportingClaimId: input.supportingClaimId } }, create: { id: `NSI-CORR-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, ...input, recordedBy: actor }, update: { sourceRelationship: input.sourceRelationship, supportsClaim: input.supportsClaim, rationale: input.rationale, recordedBy: actor } }) as Record<string, unknown>;
    await NuruAuditService.record({ operation: "QUALITY_FLAGGED", actor, resourceId: input.claimCandidateId, inputReference: input.supportingClaimId, outputReference: String(row.id), decision: input.sourceRelationship, reason: input.rationale, correlationId }); return row;
  },
  async listForClaim(claimCandidateId: string, workspaceId: string) { return nuruKnowledgeRepository.nuruClaimCorroboration.findMany({ where: { claimCandidateId, workspaceId }, orderBy: { createdAt: "desc" } }); },
};
