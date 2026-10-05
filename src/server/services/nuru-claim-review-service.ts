import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const claimReviewActions = ["RETAIN", "REJECT"] as const;
export const claimReviewSchema = z.object({ claimId: z.string().min(1), workspaceId: z.string().min(1), action: z.enum(claimReviewActions), reason: z.string().trim().min(3).max(2_000) });

export const NuruClaimReviewService = {
  async review(rawInput: z.input<typeof claimReviewSchema>, actor: string, correlationId: string) {
    const input = claimReviewSchema.parse(rawInput);
    const claim = await nuruKnowledgeRepository.nuruClaimCandidate.findUnique({ where: { id: input.claimId } }) as Record<string, unknown> | null;
    if (!claim || claim.workspaceId !== input.workspaceId) throw new AppError(404, "claim_candidate_not_found", "The claim candidate was not found in this workspace.");
    const status = input.action === "RETAIN" ? "RETAINED_FOR_QUALITY" : "REJECTED";
    const updated = await nuruKnowledgeRepository.nuruClaimCandidate.update({ where: { id: input.claimId }, data: { status, reviewedBy: actor, reviewReason: input.reason, reviewedAt: new Date() } }) as Record<string, unknown> | null;
    await NuruAuditService.record({ operation: "NSI_CLAIM_REVIEWED", actor, resourceId: input.claimId, inputReference: String(claim.passageReference), outputReference: input.claimId, decision: status, reason: input.reason, correlationId });
    return updated ? { ...claim, ...updated } : { ...claim, status, reviewedBy: actor, reviewReason: input.reason };
  },
};
