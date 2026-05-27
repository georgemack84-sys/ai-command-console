import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import type { ProposalFreezeError, ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function detectProposalReplayDrift(
  input: ProposalFreezeInput,
): {
  replayDrift: boolean;
  reconstructionFailure: boolean;
  errors: readonly ProposalFreezeError[];
} {
  const errors: ProposalFreezeError[] = [];
  const replayStatus = input.recommendationReplayResult.status;
  const ledgerStatus = input.immutableRecommendationLedgerResult.status;
  const enforcementStatus = input.constitutionalEnforcementResult.status;

  if (replayStatus !== "COMPLETED") {
    errors.push({
      code: replayStatus === "FROZEN"
        ? "PROPOSAL_FREEZE_REPLAY_DRIFT"
        : "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE",
      message: "Recommendation replay is not in a completed reconstructive state.",
      path: "recommendationReplayResult.status",
    });
  }
  if (!input.recommendationReplayResult.validationRecords.every((record) =>
    record.deterministicReplayVerified
    && record.governanceConsistencyVerified
    && record.lineageIntegrityVerified,
  )) {
    errors.push({
      code: "PROPOSAL_FREEZE_REPLAY_DRIFT",
      message: "Replay validation records indicate drift or reconstruction inconsistency.",
      path: "recommendationReplayResult.validationRecords",
    });
  }
  if (ledgerStatus !== "COMPLETED") {
    errors.push({
      code: "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE",
      message: "Immutable recommendation ledger is not replay-admissible.",
      path: "immutableRecommendationLedgerResult.status",
    });
  }
  if (enforcementStatus !== "COMPLETED" || input.constitutionalEnforcementResult.verdict.status !== "APPROVED") {
    errors.push({
      code: "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE",
      message: "Constitutional enforcement did not preserve an approved replay-safe recommendation surface.",
      path: "constitutionalEnforcementResult",
    });
  }

  return Object.freeze({
    replayDrift: errors.some((error) => error.code === "PROPOSAL_FREEZE_REPLAY_DRIFT"),
    reconstructionFailure: errors.some((error) => error.code === "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE"),
    errors: Object.freeze(errors),
  });
}

export function buildReplayDriftSnapshot(input: {
  proposalId: string;
  replayHash: string;
  recommendationReplayHash: string;
}): string {
  return hashProposalFreezeValue("proposal-freeze-replay-drift-snapshot", input);
}
