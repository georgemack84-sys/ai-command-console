import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateReplayDriftResistance(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.replayReadiness.replayScore < 1) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_DRIFT_RESISTANCE_FAILED",
      message: "Replay drift resistance could not be validated.",
      path: "constitutionalReadinessResult.replayReadiness.replayScore",
    })]);
  }
  return Object.freeze([]);
}
