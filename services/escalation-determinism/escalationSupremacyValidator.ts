import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationSupremacy(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    input.humanSupremacyResult.record.enforcementState === "INVALID"
    || normalized.includes("overridesuppression")
    || normalized.includes("kill-switchbypass".replace(/[^a-z0-9]+/g, ""))
    || normalized.includes("escalationsurvivesrevocation")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_SUPREMACY_VIOLATION",
      message: "Escalation cannot suppress override lineage, bypass kill-switch lineage, or survive revocation.",
      path: "humanSupremacyResult.record.enforcementState",
    })]);
  }
  return Object.freeze([]);
}
