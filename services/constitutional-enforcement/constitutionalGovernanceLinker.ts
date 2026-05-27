import type { ImmutableRecommendationLedgerResult } from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";
import type { ConstitutionalEnforcementError } from "./types/constitutionalEnforcementTypes";

export function validateConstitutionalGovernanceCorrelation(input: {
  recommendationId: string;
  replayResult: RecommendationReplayResult;
  immutableLedgerResult: ImmutableRecommendationLedgerResult;
  expectedReplaySnapshotId: string;
}): readonly ConstitutionalEnforcementError[] {
  const episode = input.replayResult.episodes.find((entry) => entry.recommendationId === input.recommendationId)
    ?? input.replayResult.episodes[0];

  if (!episode) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID" as const,
      message: "Replay episode is missing for governance correlation.",
      path: "replayResult.episodes",
    }]);
  }

  const errors: ConstitutionalEnforcementError[] = [];
  for (const event of input.immutableLedgerResult.events) {
    if (event.recommendationId !== input.recommendationId) {
      continue;
    }
    if (event.governanceSnapshotId !== episode.governanceReplay.governanceSnapshotId) {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH",
        message: "Immutable ledger governance snapshot diverges from replay governance snapshot.",
        path: `immutableLedgerResult.events.${event.ledgerEventId}.governanceSnapshotId`,
      });
    }
    if (event.replaySnapshotId !== input.expectedReplaySnapshotId) {
      errors.push({
        code: "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH",
        message: "Immutable ledger replay snapshot diverges from the original bound replay snapshot.",
        path: `immutableLedgerResult.events.${event.ledgerEventId}.replaySnapshotId`,
      });
    }
  }

  return Object.freeze(errors);
}
