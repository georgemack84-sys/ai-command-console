import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeTopology(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const errors: RuntimeAdmissibilityError[] = [];
  if (input.runtimeTopology.hiddenOrchestrationDetected || input.runtimeTopology.synthesizedOrchestrationDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_HIDDEN_ORCHESTRATION",
      message: "Runtime topology contains hidden or synthesized orchestration.",
      path: "runtimeTopology.hiddenOrchestrationDetected",
    }));
  }
  if (input.runtimeTopology.recursiveCoordinationDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_RECURSIVE_COORDINATION",
      message: "Runtime topology contains recursive coordination.",
      path: "runtimeTopology.recursiveCoordinationDetected",
    }));
  }
  if (input.runtimeTopology.invisibleSchedulingDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_INVISIBLE_SCHEDULING",
      message: "Runtime topology contains invisible scheduling semantics.",
      path: "runtimeTopology.invisibleSchedulingDetected",
    }));
  }
  if (input.runtimeTopology.hiddenRetryDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_HIDDEN_RETRY",
      message: "Runtime topology contains hidden retry semantics.",
      path: "runtimeTopology.hiddenRetryDetected",
    }));
  }
  if (input.runtimeTopology.authorityExpansionDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_AUTHORITY_EXPANSION",
      message: "Runtime topology widens authority outside constitutional ceilings.",
      path: "runtimeTopology.authorityExpansionDetected",
    }));
  }
  if (input.runtimeTopology.runtimeCreatedRuntimesDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_RUNTIME_CREATED_RUNTIME",
      message: "Runtime topology indicates runtime-created runtimes.",
      path: "runtimeTopology.runtimeCreatedRuntimesDetected",
    }));
  }
  if (input.runtimeTopology.executionMarkersDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_HIDDEN_EXECUTION",
      message: "Runtime topology contains execution markers, which are constitutionally inadmissible.",
      path: "runtimeTopology.executionMarkersDetected",
    }));
  }
  if (errors.length > 0) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_TOPOLOGY_MUTATION",
      message: "Runtime topology is no longer constitutionally stable.",
      path: "runtimeTopology.topologyHash",
    }));
  }
  return Object.freeze(errors);
}
