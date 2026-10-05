import { z } from "zod";
import { extractClaimCandidates } from "@/src/nuru/claim-extraction";
import type { ExtractedSection } from "@/src/nuru/document-extraction";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

const inputSchema = z.object({ normalizedDocumentId: z.string().min(1), workspaceId: z.string().min(1) });
type NormalizedDocument = { id: string; workspaceId: string; rawArtifactId: string; sourceRegistryId: string; status: string; sections: ExtractedSection[] };
function claimId() { return `CLM-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`; }

/** Creates evidence candidates only. Quality and curator systems must judge them separately. */
export const NuruClaimExtractionService = {
  async generate(rawInput: z.input<typeof inputSchema>, actor: string, correlationId: string) {
    const input = inputSchema.parse(rawInput);
    const document = await nuruKnowledgeRepository.nuruNormalizedDocument.findUnique({ where: { id: input.normalizedDocumentId } }) as NormalizedDocument | null;
    if (!document || document.workspaceId !== input.workspaceId) throw new AppError(404, "normalized_document_not_found", "The normalized document was not found in this workspace.");
    if (document.status !== "EXTRACTED") throw new AppError(409, "document_not_extractable", "Claim candidates require an extracted document.");
    const candidates = extractClaimCandidates(document.rawArtifactId, document.sections);
    const claims = await Promise.all(candidates.map(async (candidate) => {
      const claim = { id: claimId(), workspaceId: input.workspaceId, normalizedDocumentId: document.id, rawArtifactId: document.rawArtifactId, sourceRegistryId: document.sourceRegistryId, claimText: candidate.claimText, claimType: candidate.claimType, confidence: candidate.confidence, passageReference: candidate.passageReference, passageText: candidate.passageText, fingerprint: candidate.fingerprint, status: "CANDIDATE", extractionMethod: "nsi-claim-sentence-v1" };
      const stored = await nuruKnowledgeRepository.nuruClaimCandidate.upsert({ where: { normalizedDocumentId_fingerprint: { normalizedDocumentId: document.id, fingerprint: candidate.fingerprint } }, create: claim, update: { claimText: claim.claimText, claimType: claim.claimType, confidence: claim.confidence, passageReference: claim.passageReference, passageText: claim.passageText, extractionMethod: claim.extractionMethod } }) as Record<string, unknown> | null;
      return stored ? { ...claim, ...stored } : claim;
    }));
    await NuruAuditService.record({ operation: "NSI_CLAIM_CANDIDATES_GENERATED", actor, resourceId: document.id, inputReference: document.rawArtifactId, outputReference: document.id, decision: "CANDIDATE", reason: `Generated ${claims.length} provenance-bound claim candidates; none were admitted to knowledge.`, correlationId });
    return claims;
  },

  async listForDocument(normalizedDocumentId: string, workspaceId: string) {
    return nuruKnowledgeRepository.nuruClaimCandidate.findMany({ where: { normalizedDocumentId, workspaceId }, orderBy: { createdAt: "asc" } });
  },
};
