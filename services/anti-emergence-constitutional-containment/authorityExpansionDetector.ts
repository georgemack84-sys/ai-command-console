import type { AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectAuthorityExpansion(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("authorityexpansion") || normalized.includes("authoritydrift");
  return Object.freeze({
    domain: "authority_expansion",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Authority expansion or drift markers were detected." : "Authority remained bounded.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:authority-expansion", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}
