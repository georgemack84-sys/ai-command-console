import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function certifyReplayLineage(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const errors: ControlledAutonomyGateError[] = [];
  if (input.constitutionalReadinessResult.lineage.entries.length === 0) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_LINEAGE_MISSING",
      message: "Replay certification requires immutable readiness lineage.",
      path: "constitutionalReadinessResult.lineage.entries",
    }));
  }
  return Object.freeze(errors);
}
