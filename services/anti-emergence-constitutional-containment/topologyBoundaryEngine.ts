import type { AntiEmergenceError, AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectTopologyMutation(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("topologymutation") || normalized.includes("undeclaredorchestrationedges");
  return Object.freeze({
    domain: "topology_mutation",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Topology mutation or undeclared orchestration edge markers were detected." : "Topology remained stable.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:topology-mutation", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}

export function validateTopologyBoundary(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const signal = detectTopologyMutation(input);
  if (!signal.triggered) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "ANTI_EMERGENCE_BOUNDARY_VIOLATION",
    message: "Topology mutation or undeclared orchestration edges were detected.",
    path: "metadata",
  })]);
}
