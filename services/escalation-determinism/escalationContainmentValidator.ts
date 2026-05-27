import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationContainment(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    input.humanSupremacyResult.record.failClosed
    || input.constitutionalReplayResult.record.failClosed
    || normalized.includes("containmentdegradation")
    || normalized.includes("containmentinstability")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_CONTAINMENT_DEGRADED",
      message: "Escalation determinism requires stable containment and inherited fail-closed containment blocks certification.",
      path: "humanSupremacyResult.record.failClosed",
    })]);
  }
  return Object.freeze([]);
}
