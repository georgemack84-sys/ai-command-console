import type { AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectRecursiveCoordination(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("recursivecoordination") || normalized.includes("recursivecoordinationloops");
  return Object.freeze({
    domain: "recursive_coordination",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Recursive coordination markers were detected." : "No recursive coordination markers were detected.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:recursive-coordination", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}
