import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";

export function enforceEmergenceBoundary(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  if (
    normalized.includes("presentstatesubstitution")
    || normalized.includes("adaptiveinterpretation")
    || normalized.includes("adaptivecontainment")
    || normalized.includes("topologysynthesis")
    || normalized.includes("replayrepair")
  ) {
    return Object.freeze([Object.freeze({
      code: "ANTI_EMERGENCE_BOUNDARY_VIOLATION",
      message: "Present-state substitution, adaptive containment, topology synthesis, or replay repair markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
