import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateReplayProof(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (!input.constitutionalReadinessResult.replayVerification.replayDeterministic) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_NOT_PROVEN",
      message: "Replay determinism could not be constitutionally proven.",
      path: "constitutionalReadinessResult.replayVerification.replayDeterministic",
    }));
  }
  if (normalized.includes("replayambiguity") || normalized.includes("replaycorruption")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_AMBIGUITY",
      message: "Replay ambiguity or corruption markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
