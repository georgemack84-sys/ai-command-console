import type { FutureAutonomyError, FutureAutonomySimulationInput } from "@/types/future-autonomy";

export function validateFutureAutonomyReplay(
  input: FutureAutonomySimulationInput,
): readonly FutureAutonomyError[] {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const errors: FutureAutonomyError[] = [];
  if (!input.governanceDriftResult.record.replaySafe || normalized.includes("replaymismatch")) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_REPLAY_MISMATCH",
      message: "Future autonomy replay must bind to original replay-safe constitutional state.",
      path: "governanceDriftResult.record.replaySafe",
    }));
  }
  if (normalized.includes("currentstatesubstitution") || normalized.includes("latestgovernancestate") || normalized.includes("currentruntimetopology")) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_CURRENT_STATE_SUBSTITUTION",
      message: "Current-state substitution is forbidden in future autonomy replay.",
      path: "metadata",
    }));
  }
  if (normalized.includes("replayrepair") || normalized.includes("inferredtransitions") || normalized.includes("synthesizedorchestrationassumptions")) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_REPLAY_MISMATCH",
      message: "Replay repair or inferred continuity is forbidden.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
