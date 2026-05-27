import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

export function validateDriftContainment(input: GovernanceDriftInput): readonly GovernanceDriftError[] {
  const errors: GovernanceDriftError[] = [];
  if (input.replayAttackResult.record.failClosed) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_FAIL_CLOSED",
      message: "Inherited replay attack fail-closed state cannot be bypassed by drift detection.",
      path: "replayAttackResult.record.failClosed",
    }));
  }
  return Object.freeze(errors);
}
