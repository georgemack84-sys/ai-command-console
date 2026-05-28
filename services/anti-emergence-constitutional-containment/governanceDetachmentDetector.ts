import type { AntiEmergenceError, AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import { normalizeAntiEmergenceMetadata } from "./antiEmergenceSchemas";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function detectGovernanceDetachment(input: AntiEmergenceInput): EmergenceSignal {
  const normalized = normalizeAntiEmergenceMetadata(input.metadata);
  const triggered = normalized.includes("governancedetachment") || !input.constitutionalReplayResult.replayBinding.governanceBound;
  return Object.freeze({
    domain: "governance_detachment",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Governance detachment markers were detected." : "Governance remained attached.",
    deterministicHash: hashEmergenceValue("anti-emergence-signal:governance-detachment", {
      containmentId: input.containmentId,
      triggered,
    }),
  });
}

export function validateGovernanceDetachment(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const signal = detectGovernanceDetachment(input);
  if (!signal.triggered) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "ANTI_EMERGENCE_GOVERNANCE_DETACHED",
    message: "Governance detachment markers were detected.",
    path: "constitutionalReplayResult.replayBinding.governanceBound",
  })]);
}
