import type { AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectHiddenRetry(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("hiddenretrypersistence") || normalized.includes("hiddenretries");
  return Object.freeze({
    domain: "hidden_retry",
    triggered,
    severity: triggered ? "high" : "none",
    reason: triggered ? "Hidden retry persistence markers were detected." : "No hidden retry markers were detected.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:hidden-retry", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}
