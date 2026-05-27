import type { ControlledAutonomyGateError } from "./controlledAutonomyReadinessGate";

export function shouldFailClosedEscalation(errors: readonly ControlledAutonomyGateError[]): boolean {
  return errors.length > 0;
}
