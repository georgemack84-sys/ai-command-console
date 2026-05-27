import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectOrchestrationLoop(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("orchestrationloop") || normalized.includes("recursivecoordination")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ORCHESTRATION_LOOP",
      message: "Recursive coordination or orchestration loop markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
