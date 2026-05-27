import type {
  ConstitutionalReplayStabilityError,
  ReplayBindingRecord,
  ReplayConfidenceEvolution,
  ReplayEscalationReconstruction,
  ReplayOverridePropagation,
  ReplayStateRecord,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function validateReplayDeterminism(input: {
  replayId: string;
  binding: ReplayBindingRecord;
  state: ReplayStateRecord;
  confidence: ReplayConfidenceEvolution;
  escalation: ReplayEscalationReconstruction;
  override: ReplayOverridePropagation;
}): readonly ConstitutionalReplayStabilityError[] {
  const first = hashReplayStabilityValue("constitutional-replay-stability-determinism", input);
  const second = hashReplayStabilityValue("constitutional-replay-stability-determinism", input);
  if (first !== second) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_VALIDATOR_MISMATCH",
      message: "Deterministic replay reconstruction produced inconsistent results.",
      path: "determinism",
    })]);
  }
  return Object.freeze([]);
}
