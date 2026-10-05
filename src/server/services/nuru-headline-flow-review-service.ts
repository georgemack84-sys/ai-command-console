import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type Proposal = Record<string, unknown> & { id: string };
type Receipt = { workspaceId: string; eventId: string; eventVersion: number; subjectId: string; developmentId: string; curationProposalId: string };
type Development = { id: string; summary: string; eventTime: Date; verificationState: string; sourceAuthority: string; claims: unknown; evidence: unknown };
type TemporalClaim = { id: string; subjectId: string; predicate: string; value: unknown; state: string; effectiveFrom: Date };
type Correction = { id: string; subjectId: string; previousClaimId: string; correctedClaimId: string; reason: string; createdAt: Date };
type CorrectionDecision = { correctionId: string; action: string; createdAt: Date };

/** Adds read-only Headline Flow provenance to Nuru's existing human-review queue. */
export const NuruHeadlineFlowReviewService = {
  async enrich(proposals: Proposal[]) {
    if (!proposals.length) return proposals;
    const receipts = await (nuruKnowledgeRepository.nuruHeadlineFlowCandidate as unknown as { findMany(args: unknown): Promise<Receipt[]> }).findMany({ where: { curationProposalId: { in: proposals.map((proposal) => proposal.id) } } });
    if (!receipts.length) return proposals;
    const developments = await (nuruKnowledgeRepository.nuruKnowledgeDevelopment as unknown as { findMany(args: unknown): Promise<Development[]> }).findMany({ where: { id: { in: receipts.map((receipt) => receipt.developmentId) } } });
    const subjectIds = [...new Set(receipts.map((receipt) => receipt.subjectId))];
    const workspaceIds = [...new Set(receipts.map((receipt) => receipt.workspaceId))];
    const temporalClaims = await (nuruKnowledgeRepository.nuruTemporalClaim as unknown as { findMany(args: unknown): Promise<TemporalClaim[]> }).findMany({ where: { workspaceId: { in: workspaceIds }, subjectId: { in: subjectIds } }, orderBy: { effectiveFrom: "desc" }, take: 500 });
    const corrections = await (nuruKnowledgeRepository.nuruKnowledgeCorrection as unknown as { findMany(args: unknown): Promise<Correction[]> }).findMany({ where: { workspaceId: { in: workspaceIds }, subjectId: { in: subjectIds } }, orderBy: { createdAt: "desc" }, take: 500 });
    const decisions = corrections.length ? await (nuruKnowledgeRepository.nuruKnowledgeCorrectionDecision as unknown as { findMany(args: unknown): Promise<CorrectionDecision[]> }).findMany({ where: { correctionId: { in: corrections.map((correction) => correction.id) } } }) : [];
    const developmentsById = new Map(developments.map((development) => [development.id, development]));
    const receiptByProposalId = new Map(receipts.map((receipt) => [receipt.curationProposalId, receipt]));
    const claimsBySubject = new Map(subjectIds.map((subjectId) => [subjectId, temporalClaims.filter((claim) => claim.subjectId === subjectId)]));
    const correctionsBySubject = new Map(subjectIds.map((subjectId) => [subjectId, corrections.filter((correction) => correction.subjectId === subjectId)]));
    const decisionsByCorrectionId = new Map(decisions.map((decision) => [decision.correctionId, decision]));
    return proposals.map((proposal) => {
      const receipt = receiptByProposalId.get(proposal.id);
      if (!receipt) return proposal;
      const development = developmentsById.get(receipt.developmentId);
      const subjectClaims = claimsBySubject.get(receipt.subjectId) ?? [];
      const subjectCorrections = correctionsBySubject.get(receipt.subjectId) ?? [];
      return { ...proposal, headlineFlow: { event: null, development: development ? { id: development.id, summary: development.summary, eventTime: development.eventTime.toISOString(), verificationState: development.verificationState, sourceAuthority: development.sourceAuthority, claims: development.claims, evidence: development.evidence } : null, temporalContext: { subjectId: receipt.subjectId, claims: subjectClaims.map((claim) => ({ id: claim.id, predicate: claim.predicate, value: claim.value, state: claim.state, effectiveFrom: claim.effectiveFrom.toISOString() })), corrections: subjectCorrections.map((correction) => ({ id: correction.id, previousClaimId: correction.previousClaimId, correctedClaimId: correction.correctedClaimId, reason: correction.reason, decision: decisionsByCorrectionId.get(correction.id)?.action ?? null })) } } };
    });
  },
};
