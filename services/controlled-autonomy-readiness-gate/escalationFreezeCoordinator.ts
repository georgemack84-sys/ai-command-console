import type { ControlledAutonomyGateError } from "./controlledAutonomyReadinessGate";

export function shouldFreezeEscalation(errors: readonly ControlledAutonomyGateError[]): boolean {
  return errors.some((item) => item.code.includes("SUPPRESSION") || item.code.includes("NOT_DETERMINISTIC"));
}
