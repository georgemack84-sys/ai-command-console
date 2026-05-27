import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function detectCertificationReplayDrift(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  const drift =
    input.decisionAuditEpisodeResult.episode.replayHash !== input.deterministicReplayResult.result.replayHash
    || input.constitutionalTransitionResult.transition.replayHash !== input.deterministicReplayResult.result.replayHash
    || input.metadata?.replayDrift === true;
  return drift
    ? Object.freeze([{
      code: "DECISION_READINESS_REPLAY_DRIFT" as const,
      message: "Replay drift was detected across certification dependencies.",
      path: "replayHash",
    }])
    : Object.freeze([]);
}
