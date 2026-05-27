import type {
  ConstitutionalReplayStabilityError,
  ReplayBindingRecord,
  ReplayConfidenceEvolution,
  ReplayEscalationReconstruction,
  ReplayOverridePropagation,
  ReplayStateRecord,
} from "./replayStateTypes";

export function detectReplayDrift(input: {
  binding: ReplayBindingRecord;
  state: ReplayStateRecord;
  confidence: ReplayConfidenceEvolution;
  escalation: ReplayEscalationReconstruction;
  override: ReplayOverridePropagation;
}): readonly ConstitutionalReplayStabilityError[] {
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!input.binding.governanceBound || !input.binding.replayBound) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_DRIFT_DETECTED",
      message: "Replay binding drift was detected.",
      path: "binding",
    }));
  }
  if (input.confidence.volatilityDetected || input.escalation.escalationState !== "stable" || !input.override.operatorSupremacyPreserved) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_DRIFT_DETECTED",
      message: "Confidence, escalation, or override drift was detected during replay reconstruction.",
      path: "state",
    }));
  }
  return Object.freeze(errors);
}
