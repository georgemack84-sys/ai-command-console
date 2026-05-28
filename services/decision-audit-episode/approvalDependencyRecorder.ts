import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function recordApprovalDependencies(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: input.proposalIntegrityResult.approvalBinding.approvalHash,
    snapshotType: "approval_dependency",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-approval", {
      approvalDependencyIds: input.proposalIntegrityResult.proposal.approvalDependencyIds,
      approvalHash: input.proposalIntegrityResult.approvalBinding.approvalHash,
    }),
    lineageHash: input.recommendationLineageResult.lineage.lineageHash,
    immutable: true as const,
  });
}
