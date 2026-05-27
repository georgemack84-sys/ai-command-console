import type {
  ConfidenceLineageRecord,
  DeterministicConfidenceError,
} from "./types/confidenceTypes";

export function auditConfidenceReplayLineage(
  lineage: ConfidenceLineageRecord,
): readonly DeterministicConfidenceError[] {
  if (!lineage.lineageHash || !lineage.replayLineageId || !lineage.proposalLineageId) {
    return Object.freeze([{
      code: "DETERMINISTIC_CONFIDENCE_REPLAY_LINEAGE_MISSING",
      message: "Confidence replay lineage is incomplete.",
      path: "lineage",
    } satisfies DeterministicConfidenceError]);
  }

  return Object.freeze([]);
}
