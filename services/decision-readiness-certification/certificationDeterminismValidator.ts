import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function validateCertificationDeterminism(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  const mismatch =
    input.deterministicReplayResult.result.replayHash !== input.decisionAuditEpisodeResult.episode.replayHash
    || input.deterministicReplayResult.result.replayHash !== input.constitutionalTransitionResult.transition.replayHash;
  return mismatch
    ? Object.freeze([{
      code: "DECISION_READINESS_CANONICALIZATION_MISMATCH" as const,
      message: "Deterministic replay hashes diverged across certified dependencies.",
      path: "replayHash",
    }])
    : Object.freeze([]);
}
