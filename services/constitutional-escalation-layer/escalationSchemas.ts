import type {
  ConstitutionalEscalationError,
  ConstitutionalEscalationRecommendation,
  EscalationLevel,
} from "@/types/constitutional-escalation-layer";
import { createEscalationError } from "./escalationErrors";

const LEVELS: readonly EscalationLevel[] = ["E0", "E1", "E2", "E3", "E4", "E5"];

export function validateEscalationTimestamp(timestamp: string, path: string): readonly ConstitutionalEscalationError[] {
  return Object.freeze(
    !timestamp || Number.isNaN(Date.parse(timestamp))
      ? [createEscalationError("ESCALATION_STATE_INVALID", "Escalation timestamps must be immutable and valid.", path)]
      : [],
  );
}

export function validateEscalationRecommendation(
  recommendation: ConstitutionalEscalationRecommendation,
): readonly ConstitutionalEscalationError[] {
  const errors: ConstitutionalEscalationError[] = [];
  if (!LEVELS.includes(recommendation.severity)) {
    errors.push(createEscalationError("ESCALATION_STATE_INVALID", "Unknown escalation severity.", "recommendation.severity"));
  }
  if (recommendation.derivedOnly !== true || recommendation.executable !== false) {
    errors.push(createEscalationError("ESCALATION_STATE_INVALID", "Escalation recommendation must remain derived-only and non-executable.", "recommendation"));
  }
  if (!recommendation.evidenceRefs.length) {
    errors.push(createEscalationError("ESCALATION_STATE_INVALID", "Escalation recommendation requires evidence references.", "recommendation.evidenceRefs"));
  }
  errors.push(...validateEscalationTimestamp(recommendation.createdAt, "recommendation.createdAt"));
  return Object.freeze(errors);
}
