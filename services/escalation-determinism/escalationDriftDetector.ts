import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function detectEscalationDrift(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    normalized.includes("escalationdrift")
    || normalized.includes("coordinationdrift")
    || normalized.includes("lineagecorruption")
    || normalized.includes("overridecorruption")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_DRIFT_DETECTED",
      message: "Escalation drift, coordination drift, or lineage corruption markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
