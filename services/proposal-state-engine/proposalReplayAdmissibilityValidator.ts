import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import type {
  ProposalReplayAdmissibilityRecord,
  ProposalStateEngineInput,
  ProposalStateError,
} from "./types/proposalStateTypes";

export function validateProposalReplayAdmissibility(
  input: ProposalStateEngineInput,
): {
  record: ProposalReplayAdmissibilityRecord;
  errors: readonly ProposalStateError[];
} {
  const replayLineageId = input.recommendationReplayResult.lineageRecords[0]?.lineageHash ?? "";
  const replayAdmissible =
    input.recommendationReplayResult.status === "COMPLETED"
    && input.immutableRecommendationLedgerResult.status === "COMPLETED"
    && input.constitutionalEnforcementResult.status === "COMPLETED"
    && input.constitutionalEnforcementResult.verdict.status === "APPROVED";

  const errors: ProposalStateError[] = [];
  if (!replayLineageId || input.transition.replayLineageId !== replayLineageId) {
    errors.push({
      code: "PROPOSAL_STATE_REPLAY_LINEAGE_MISSING",
      message: "Transition replay lineage does not match the immutable replay lineage.",
      path: "transition.replayLineageId",
    });
  }
  if (!replayAdmissible) {
    errors.push({
      code: "PROPOSAL_STATE_REPLAY_LINEAGE_MISSING",
      message: "Replay admissibility requires completed replay, ledger, and constitutional enforcement results.",
      path: "replayAdmissibility",
    });
  }

  const record: ProposalReplayAdmissibilityRecord = Object.freeze({
    proposalId: input.transition.proposalId,
    replayAdmissible: replayAdmissible && errors.length === 0,
    replayLineageId: replayLineageId || input.transition.replayLineageId,
    governanceSnapshotId: input.constitutionalEnforcementResult.lineage.governanceSnapshotId,
    admissibilityHash: hashProposalTransitionValue("proposal-state-replay-admissibility", {
      proposalId: input.transition.proposalId,
      replayAdmissible: replayAdmissible && errors.length === 0,
      replayLineageId: replayLineageId || input.transition.replayLineageId,
      governanceSnapshotId: input.constitutionalEnforcementResult.lineage.governanceSnapshotId,
    }),
  });

  return {
    record,
    errors: Object.freeze(errors),
  };
}
