import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function enforceEscalationBoundary(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    normalized.includes("presentstatesubstitution")
    || normalized.includes("replayrepair")
    || normalized.includes("dynamicreconstruction")
    || normalized.includes("presentstateauthority")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_BOUNDARY_VIOLATION",
      message: "Present-state substitution, replay repair, or dynamic reconstruction markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
