import { AppError } from "@/src/server/api/errors";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";
import { decideNuruCurationProposal } from "@/src/server/services/nuru-agent-service";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type Model = { findUnique(args: unknown): Promise<Record<string, unknown> | null> };
const proposals = (nuruKnowledgeRepository as unknown as { nuruCurationProposal: Model }).nuruCurationProposal;
const candidates = (nuruKnowledgeRepository as unknown as { nuruDiscoveryCandidate: Model }).nuruDiscoveryCandidate;
const authority: Record<string, "HIGH" | "MODERATE" | "LOW"> = { PRIMARY: "HIGH", SECONDARY: "MODERATE", COMMUNITY: "LOW", UNKNOWN: "LOW" };

/** Claim-bound NSI-24 admission. Source-level evidence cannot authorize a different candidate. */
export const NuruNsiCanonicalAdmissionService = {
  async approve(input: { proposalId: string; claimCandidateId: string; workspaceId: string; reason: string }, actor: string) {
    const proposal = await proposals.findUnique({ where: { id: input.proposalId } });
    if (!proposal || proposal.status !== "HUMAN_REVIEW_REQUIRED") throw new AppError(404, "proposal_not_reviewable", "The proposal is not awaiting human review.");
    const candidate = await candidates.findUnique({ where: { id: String(proposal.itemId) } });
    const source = (candidate?.source ?? {}) as Record<string, unknown>;
    if (typeof source.sourceId !== "string") throw new AppError(400, "missing_nsi_provenance", "Canonical admission requires NSI source provenance.");
    const [registry, claim] = await Promise.all([nuruKnowledgeRepository.nuruSourceRegistry.findUnique({ where: { id: source.sourceId } }), nuruKnowledgeRepository.nuruClaimCandidate.findUnique({ where: { id: input.claimCandidateId } })]) as [Record<string, unknown> | null, Record<string, unknown> | null];
    if (!registry || registry.workspaceId !== input.workspaceId || !claim || claim.workspaceId !== input.workspaceId || claim.sourceRegistryId !== source.sourceId) throw new AppError(400, "claim_provenance_mismatch", "The selected claim does not belong to this candidate's governed source.");
    const quality = await nuruKnowledgeRepository.nuruClaimEvidenceQuality.findMany({ where: { workspaceId: input.workspaceId, claimCandidateId: input.claimCandidateId }, orderBy: { createdAt: "desc" }, take: 1 }) as Record<string, unknown>[];
    const assessment = quality[0]; const gaps = Array.isArray(assessment?.missingEvidence) ? assessment.missingEvidence.length : 1;
    const decision = NuruGovernanceGate.evaluate({ proposalId: input.proposalId, recommendation: String(proposal.recommendation) as never, qualityStatus: assessment?.status === "CONFLICTED" ? "CONFLICT" : gaps ? "INSUFFICIENT_EVIDENCE" : "PASS", confidence: Number(proposal.confidence), evidenceQuality: gaps ? "LIMITED" : "SUFFICIENT", sourceAuthority: authority[String(registry.authorityClass)] ?? "LOW", requiredReview: true, humanApproved: true, conflictDetected: assessment?.conflicts === "DETECTED", policySatisfied: !gaps, correlationId: crypto.randomUUID() });
    if (decision.outcome !== "APPROVED") return { approved: false, decision };
    return { approved: true, decision, proposal: await decideNuruCurationProposal(input.proposalId, { action: "APPROVE", reason: input.reason }, actor) };
  },
};
