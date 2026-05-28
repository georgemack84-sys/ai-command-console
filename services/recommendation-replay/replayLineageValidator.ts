import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type { RecommendationReplayEpisode, RecommendationReplayError, RecommendationReplayInput } from "./types/recommendationReplayTypes";

export function validateReplayLineage(
  input: RecommendationReplayInput,
  episode: RecommendationReplayEpisode,
): RecommendationReplayError[] {
  const errors: RecommendationReplayError[] = [];
  const ledgersAreValid = [
    verifyImmutableLedgerChain([...input.recommendationSynthesisResult.auditLedger]),
    verifyImmutableLedgerChain([...input.evidenceAggregationResult.auditLedger]),
    verifyImmutableLedgerChain([...input.recommendationPrioritizationResult.auditLedger]),
  ].every(Boolean);

  if (!ledgersAreValid) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_AUDIT_FAILURE",
      message: "One or more upstream immutable audit ledgers failed integrity validation.",
      path: "auditLedger",
    });
  }

  if (!episode.lineage.evidenceLineageId || !episode.lineage.confidenceLineageId || !episode.lineage.constraintLineageId) {
    errors.push({
      code: "RECOMMENDATION_REPLAY_MISSING_LINEAGE",
      message: "Replay lineage is incomplete.",
      path: `episode.${episode.recommendationId}.lineage`,
    });
  }

  return errors;
}
