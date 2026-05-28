import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationIsolation(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    normalized.includes("recursiveescalation")
    || normalized.includes("escalationschedulingsemantics")
    || normalized.includes("hiddenescalationrouting")
    || normalized.includes("escalationdrivenexecution")
    || normalized.includes("runtimeexecution")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_ISOLATION_VIOLATION",
      message: "Recursive escalation, scheduling semantics, hidden routing, or execution markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
