import type { AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectOrchestrationDrift(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("hiddenorchestrationinjection") || normalized.includes("orchestrationmutation");
  return Object.freeze({
    domain: "hidden_orchestration",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Hidden orchestration or orchestration mutation markers were detected." : "No hidden orchestration markers were detected.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:hidden-orchestration", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}
