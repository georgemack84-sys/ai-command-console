import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationDeterminism(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    !input.constitutionalReplayResult.record.replayDeterministic
    || !input.humanSupremacyResult.integrityReport.deterministic
    || normalized.includes("determinismmismatch")
    || normalized.includes("nondeterministic")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_DETERMINISM_VIOLATION",
      message: "Escalation determinism requires deterministic replay and deterministic supremacy lineage.",
      path: !input.constitutionalReplayResult.record.replayDeterministic
        ? "constitutionalReplayResult.record.replayDeterministic"
        : "humanSupremacyResult.integrityReport.deterministic",
    })]);
  }
  return Object.freeze([]);
}
