import type { EscalationDeterminismError, EscalationDeterminismInput } from "./escalationStateTypes";
import { normalizeEscalationMetadata } from "./escalationSchemas";

export function validateEscalationReplay(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const normalized = normalizeEscalationMetadata(input.metadata);
  if (
    input.constitutionalReplayResult.record.classification !== "STABLE"
    || normalized.includes("replayreconstructionfailure")
    || normalized.includes("replaymismatch")
  ) {
    return Object.freeze([Object.freeze({
      code: "ESCALATION_DETERMINISM_REPLAY_MISMATCH",
      message: "Escalation replay validation detected replay mismatch or replay reconstruction failure.",
      path: "constitutionalReplayResult.record.classification",
    })]);
  }
  return Object.freeze([]);
}
