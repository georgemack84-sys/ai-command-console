import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";

export function validateHiddenExecution(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  if (normalized.includes("coordinationbecomingexecution") || normalized.includes("executionmarkers")) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_ISOLATION_VIOLATION",
      message: "Execution markers or coordination-to-execution emergence were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
