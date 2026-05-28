import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeAntiEmergence(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  if (input.antiEmergenceResult.record.classification === "contained"
    && !input.runtimeTopology.hiddenOrchestrationDetected
    && !input.runtimeTopology.recursiveCoordinationDetected
    && !input.runtimeTopology.runtimeCreatedRuntimesDetected) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_ANTI_EMERGENCE_VIOLATION",
    message: "Runtime admissibility detected hidden orchestration, recursive coordination, or emergent runtime creation.",
    path: "antiEmergenceResult.record.classification",
  })]);
}
