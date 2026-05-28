import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectRecursiveApproval(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("recursiveapproval") || normalized.includes("circularapproval")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RECURSIVE_APPROVAL",
      message: "Recursive or circular approval markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
