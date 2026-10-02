import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

/** Stable internal citation resolver. It exposes lineage; it makes no quality judgment. */
export const NuruCitationService = {
  async forClaim(claimId: string, workspaceId: string) {
    const claim = await nuruKnowledgeRepository.nuruClaimCandidate.findUnique({ where: { id: claimId } }) as Record<string, unknown> | null;
    if (!claim || claim.workspaceId !== workspaceId) throw new AppError(404, "claim_candidate_not_found", "The claim candidate was not found in this workspace.");
    return { citationId: `NURU-CIT-${claimId}`, claimId, normalizedDocumentId: claim.normalizedDocumentId, rawArtifactId: claim.rawArtifactId, sourceRegistryId: claim.sourceRegistryId, passageReference: claim.passageReference, passageText: claim.passageText, claimText: claim.claimText, status: claim.status };
  },
};
