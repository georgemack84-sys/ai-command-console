import type { ImmutableRecommendationLedgerError, RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

export function validateLedgerGovernanceCorrelation(args: {
  event: RecommendationLedgerEvent;
  expectedGovernanceSnapshotId: string;
  expectedReplaySnapshotId: string;
}): ImmutableRecommendationLedgerError[] {
  const errors: ImmutableRecommendationLedgerError[] = [];
  if (args.event.governanceSnapshotId !== args.expectedGovernanceSnapshotId) {
    errors.push({
      code: "LEDGER_GOVERNANCE_CORRELATION_FAILURE",
      message: "Ledger governance snapshot does not match replay-bound governance lineage.",
      path: `event.${args.event.ledgerEventId}.governanceSnapshotId`,
    });
  }
  if (args.event.replaySnapshotId !== args.expectedReplaySnapshotId) {
    errors.push({
      code: "LEDGER_REPLAY_INVALID",
      message: "Ledger replay snapshot does not match replay-bound lineage.",
      path: `event.${args.event.ledgerEventId}.replaySnapshotId`,
    });
  }
  return errors;
}
