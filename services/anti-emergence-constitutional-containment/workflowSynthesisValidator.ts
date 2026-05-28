import type { AntiEmergenceError, AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectWorkflowSynthesis(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("synthesizedworkflowgraphs") || normalized.includes("workflowsynthesis");
  return Object.freeze({
    domain: "workflow_synthesis",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Workflow synthesis markers were detected." : "No workflow synthesis markers were detected.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:workflow-synthesis", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}

export function validateWorkflowSynthesis(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const signal = detectWorkflowSynthesis(input);
  if (!signal.triggered) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "ANTI_EMERGENCE_BOUNDARY_VIOLATION",
    message: "Workflow synthesis markers were detected.",
    path: "metadata",
  })]);
}
