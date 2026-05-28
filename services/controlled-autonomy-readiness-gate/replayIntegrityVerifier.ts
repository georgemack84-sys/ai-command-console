import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function verifyReplayIntegrity(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (!input.constitutionalReadinessResult.record.replaySafe) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_INTEGRITY_FAILURE",
      message: "Upstream readiness result is not replay-safe.",
      path: "constitutionalReadinessResult.record.replaySafe",
    }));
  }
  if (normalized.includes("lateststatereconstruction") || normalized.includes("replayrepair")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_REPAIR_ATTEMPT",
      message: "Latest-state reconstruction or replay repair markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
