import type { DecisionAuditEpisodeError, DecisionAuditEpisodeInput } from "./types/decisionAuditEpisodeTypes";

export function buildReplayFreezeErrors(input: DecisionAuditEpisodeInput): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (!input.recommendationValidationResult.result.governanceSnapshotId) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_MISSING_GOVERNANCE_SNAPSHOT",
      message: "Governance snapshot is required for deterministic episode reconstruction.",
      path: "recommendationValidationResult.result.governanceSnapshotId",
    });
  }
  if (!input.proposalIntegrityResult.snapshot.snapshotId) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_MISSING_PROPOSAL_SNAPSHOT",
      message: "Proposal snapshot is required for deterministic episode reconstruction.",
      path: "proposalIntegrityResult.snapshot.snapshotId",
    });
  }
  if (input.proposalIntegrityResult.proposal.approvalDependencyIds.length === 0) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_MISSING_APPROVAL_LINEAGE",
      message: "Approval lineage is required for deterministic episode reconstruction.",
      path: "proposalIntegrityResult.proposal.approvalDependencyIds",
    });
  }
  if (!input.deterministicReplayResult.result.replayCertified) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_REPLAY_MISMATCH",
      message: "Replay must already be certified before episode reconstruction can be trusted.",
      path: "deterministicReplayResult.result.replayCertified",
    });
  }
  if (input.deterministicReplayResult.result.driftDetected) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_REPLAY_DRIFT",
      message: "Replay drift detected; episode reconstruction must freeze.",
      path: "deterministicReplayResult.result.driftDetected",
    });
  }
  return Object.freeze(errors);
}
