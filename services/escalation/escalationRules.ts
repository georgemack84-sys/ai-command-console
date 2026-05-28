import type { EscalationCoordinationInput } from "./contracts/escalationTypes";

export type EscalationRulesResult = {
  ok: boolean;
  blocked: boolean;
  frozen: boolean;
  disputed: boolean;
  reasons: string[];
};

export function evaluateEscalationRules(input: EscalationCoordinationInput): EscalationRulesResult {
  const reasons: string[] = [];
  let blocked = false;
  let frozen = false;
  let disputed = false;

  if (input.evidence.length === 0) {
    blocked = true;
    reasons.push("ESCALATION_EVIDENCE_MISSING");
  }
  if (!input.reason.trim()) {
    blocked = true;
    reasons.push("ESCALATION_REASON_MISSING");
  }
  if (input.stabilityAssessment.disputed) {
    disputed = true;
    reasons.push("ESCALATION_STABILITY_DISPUTED");
  }
  if (input.stabilityAssessment.confidence < 0.3) {
    blocked = true;
    reasons.push("ESCALATION_CONFIDENCE_TOO_LOW");
  }
  if (input.requestedType === "emergency" && input.evidence.length < 2) {
    blocked = true;
    reasons.push("ESCALATION_EMERGENCY_EVIDENCE_INSUFFICIENT");
  }

  const unresolvedSameType = (input.existingEscalations || []).filter((entry) =>
    entry.escalationType === input.requestedType
    && !["RESOLVED", "VERIFIED"].includes(entry.escalationState),
  );
  if (unresolvedSameType.length > 0) {
    frozen = true;
    reasons.push("ESCALATION_DUPLICATE_UNRESOLVED");
  }

  return {
    ok: !blocked,
    blocked,
    frozen,
    disputed,
    reasons: Array.from(new Set(reasons)),
  };
}
