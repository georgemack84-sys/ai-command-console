import type { AntiEmergenceError, AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectFanoutExpansion(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("hiddenfanoutexpansion");
  return Object.freeze({
    domain: "fanout_expansion",
    triggered,
    severity: triggered ? "high" : "none",
    reason: triggered ? "Hidden fanout expansion markers were detected." : "Coordination fanout remained bounded.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:fanout-expansion", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}

export function validateCoordinationFanout(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const signal = detectFanoutExpansion(input);
  if (!signal.triggered) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "ANTI_EMERGENCE_DRIFT_DETECTED",
    message: "Hidden fanout expansion markers were detected.",
    path: "metadata",
  })]);
}
