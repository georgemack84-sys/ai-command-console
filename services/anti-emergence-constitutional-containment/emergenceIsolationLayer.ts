import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";

export function validateEmergenceIsolation(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  if (
    normalized.includes("executionmarkers")
    || normalized.includes("containmentbecomingorchestration")
    || normalized.includes("runtimeexecution")
    || normalized.includes("taskrunners")
    || normalized.includes("jobschedulers")
  ) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_ISOLATION_VIOLATION",
      message: "Execution, orchestration, runtime, or scheduler markers were detected in the anti-emergence layer.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
