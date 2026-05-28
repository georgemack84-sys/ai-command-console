import type { CoordinationRiskProfile } from "@/types/escalation-aware-coordination";

export function shouldTriggerGovernanceReview(risk: CoordinationRiskProfile): boolean {
  return risk.reviewRequired || risk.freezeRequired;
}
