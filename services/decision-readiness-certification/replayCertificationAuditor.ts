import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function auditReplayCertification(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  const invalid =
    !input.deterministicReplayResult.result.deterministic
    || !input.deterministicReplayResult.result.replayCertified
    || input.deterministicReplayResult.result.driftDetected
    || input.metadata?.replayCorruption === true;
  return invalid
    ? Object.freeze([{
      code: "DECISION_READINESS_REPLAY_MISMATCH" as const,
      message: "Replay certification did not remain deterministic and replay-certified.",
      path: "deterministicReplayResult.result",
    }])
    : Object.freeze([]);
}
