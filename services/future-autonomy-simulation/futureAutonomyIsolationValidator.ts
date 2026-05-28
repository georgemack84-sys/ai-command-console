import type { FutureAutonomyError, FutureAutonomySimulationInput } from "@/types/future-autonomy";

function normalize(value: unknown, output: string[]): void {
  if (typeof value === "string") {
    output.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => normalize(item, output));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      output.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalize(item, output);
    });
  }
}

export function validateFutureAutonomyIsolation(
  input: FutureAutonomySimulationInput,
): readonly FutureAutonomyError[] {
  const markers: string[] = [];
  normalize(input.metadata, markers);
  const errors: FutureAutonomyError[] = [];
  if (markers.some((item) =>
    item.includes("executionimport")
    || item.includes("orchestrationimport")
    || item.includes("schedulerimport"),
  )) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_EXECUTION_IMPORT",
      message: "Execution, orchestration, or scheduler imports violate isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) =>
    item.includes("runtimemutation")
    || item.includes("runtimecontamination")
    || item.includes("simulationruntimebridge")
    || item.includes("hiddenworkflow")
    || item.includes("workflowcontinuation")
    || item.includes("hiddenorchestration")
    || item.includes("l ivecoordination".replace(/\s+/g, ""))
  )) {
    errors.push(Object.freeze({
      code: markers.some((item) => item.includes("simulationruntimebridge"))
        ? "FUTURE_AUTONOMY_SIMULATION_RUNTIME_BRIDGE"
        : "FUTURE_AUTONOMY_RUNTIME_CONTAMINATION",
      message: "Runtime contamination or simulation/runtime bridging is forbidden.",
      path: "metadata",
    }));
  }
  if (markers.some((item) =>
    item.includes("adaptiveautonomy")
    || item.includes("runtimecapabilityacquisition")
    || item.includes("selfmodification"),
  )) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_ADAPTIVE_AUTONOMY",
      message: "Adaptive autonomy or capability acquisition is forbidden.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("recursivecoordination"))) {
    errors.push(Object.freeze({
      code: "FUTURE_AUTONOMY_RECURSIVE_WORKFLOW",
      message: "Recursive coordination violates isolation.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
