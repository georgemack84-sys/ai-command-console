import type { FutureAutonomyError, FutureAutonomySimulationInput } from "@/types/future-autonomy";

export function validateFutureAutonomyContainment(
  input: FutureAutonomySimulationInput,
): readonly FutureAutonomyError[] {
  const errors: FutureAutonomyError[] = [];
  if (input.governanceDriftResult.record.failClosed) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_FAIL_CLOSED",
      message: "Inherited constitutional fail-closed state blocks future autonomy simulation.",
      path: "governanceDriftResult.record.failClosed",
    }));
  }
  return Object.freeze(errors);
}
