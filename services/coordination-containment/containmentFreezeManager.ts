import type { AntiEmergenceValidationResult, ContainmentState } from "@/types/coordination-containment";

export function resolveContainmentState(validation: AntiEmergenceValidationResult): ContainmentState {
  if (validation.failClosed) {
    return "fail_closed";
  }
  if (validation.violations.some((violation) => violation.severity === "critical")) {
    return "frozen";
  }
  if (validation.violations.some((violation) => violation.severity === "high")) {
    return "blocked";
  }
  if (validation.violations.some((violation) => violation.severity === "elevated")) {
    return "restricted";
  }
  return validation.containmentState;
}
