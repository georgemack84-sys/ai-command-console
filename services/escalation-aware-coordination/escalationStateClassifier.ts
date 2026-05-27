import type { CoordinationRiskProfile, EscalationReason, EscalationState } from "@/types/escalation-aware-coordination";

export function classifyEscalationState(input: {
  risk: CoordinationRiskProfile;
  errorCodes: readonly string[];
}): {
  escalationState: EscalationState;
  escalationReason: EscalationReason;
  failClosed: boolean;
} {
  if (input.errorCodes.some((code) => code.includes("REPLAY_AMBIGUITY") || code.includes("SYNTHETIC_CONTINUITY"))) {
    return { escalationState: "critical", escalationReason: "replay_break", failClosed: true };
  }
  if (input.errorCodes.some((code) => code.includes("GOVERNANCE_MISMATCH"))) {
    return { escalationState: "frozen", escalationReason: "governance_mismatch", failClosed: true };
  }
  if (input.errorCodes.some((code) => code.includes("APPROVAL_INCOMPLETE"))) {
    return { escalationState: "restricted", escalationReason: "approval_incomplete", failClosed: true };
  }
  return {
    escalationState: input.risk.escalationState,
    escalationReason: input.risk.escalationReason,
    failClosed: input.risk.freezeRequired,
  };
}
