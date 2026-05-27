import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationGovernance(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    !input.constitutionalReplayResult.replayBinding.governanceBound
    || !input.humanSupremacyResult.record.governanceBound
    || normalized.includes("governancedetachment")
    || normalized.includes("governanceuncertainty")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_GOVERNANCE_DETACHED",
      message: "Escalation determinism requires governance-bound replay and supremacy history.",
      path: "constitutionalReplayResult.replayBinding.governanceBound",
    })]);
  }
  return Object.freeze([]);
}
