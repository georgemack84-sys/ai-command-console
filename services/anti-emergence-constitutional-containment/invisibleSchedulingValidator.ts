import type { AntiEmergenceError, AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectInvisibleScheduling(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("invisiblescheduling") || normalized.includes("schedulingsemantics");
  return Object.freeze({
    domain: "invisible_scheduling",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Invisible scheduling or scheduling semantics markers were detected." : "No scheduling markers were detected.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:invisible-scheduling", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}

export function validateInvisibleScheduling(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const signal = detectInvisibleScheduling(input);
  if (!signal.triggered) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "ANTI_EMERGENCE_ISOLATION_VIOLATION",
    message: "Invisible scheduling or scheduling semantics markers were detected.",
    path: "metadata",
  })]);
}
