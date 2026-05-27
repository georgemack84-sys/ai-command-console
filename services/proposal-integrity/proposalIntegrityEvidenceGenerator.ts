import type { ProposalIntegrityEvidence, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";
import { hashProposalAuditValue } from "./proposalAuditHashEngine";

export function generateProposalIntegrityEvidence(input: {
  integrityInput: ProposalIntegrityInput;
  reasons: readonly string[];
}): ProposalIntegrityEvidence {
  const evidenceRefs = Object.freeze([
    input.integrityInput.decisionIntentBoundaryResult.artifact.intentId,
    input.integrityInput.recommendationLineageResult.artifact.lineageId,
    input.integrityInput.constitutionalReadinessResult.record.governanceSnapshotId,
    input.integrityInput.constitutionalReadinessResult.record.replaySnapshotId,
  ]);
  return Object.freeze({
    evidenceId: hashProposalAuditValue("proposal-evidence-id", {
      proposalId: input.integrityInput.proposalId,
    }),
    proposalId: input.integrityInput.proposalId,
    evidenceRefs,
    reasons: Object.freeze(input.reasons),
    evidenceHash: hashProposalAuditValue("proposal-evidence", {
      proposalId: input.integrityInput.proposalId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
