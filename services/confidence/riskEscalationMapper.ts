import type { EscalationSeverity, EscalationState } from "@/types/escalation";

export function mapRiskToEscalation(input: {
  escalationState: EscalationState;
  driftRiskScore: number;
  uncertaintyScore: number;
}): Readonly<{
  severity: EscalationSeverity;
  freezeRecommended: boolean;
  pauseRecommended: boolean;
}> {
  if (input.escalationState === "fail_closed") {
    return Object.freeze({ severity: "critical", freezeRecommended: true, pauseRecommended: true });
  }
  if (input.escalationState === "frozen") {
    return Object.freeze({ severity: "critical", freezeRecommended: true, pauseRecommended: true });
  }
  if (input.escalationState === "critical") {
    return Object.freeze({ severity: "severe", freezeRecommended: input.driftRiskScore >= 0.8, pauseRecommended: true });
  }
  if (input.escalationState === "restricted") {
    return Object.freeze({ severity: "high", freezeRecommended: false, pauseRecommended: true });
  }
  if (input.escalationState === "review") {
    return Object.freeze({ severity: input.uncertaintyScore >= 0.5 ? "moderate" : "low", freezeRecommended: false, pauseRecommended: false });
  }
  return Object.freeze({ severity: "low", freezeRecommended: false, pauseRecommended: false });
}
