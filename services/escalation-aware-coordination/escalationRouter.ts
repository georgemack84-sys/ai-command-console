import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { EscalationReason, EscalationState } from "@/types/escalation-aware-coordination";

export function routeEscalation(input: {
  escalationState: EscalationState;
  escalationReason: EscalationReason;
}): ApprovalAwareRoutingResult["target"] {
  if (input.escalationState === "critical" || input.escalationState === "frozen") {
    return "coordination_hold";
  }
  if (input.escalationReason === "governance_mismatch" || input.escalationReason === "policy_uncertainty") {
    return "governance_review";
  }
  if (input.escalationReason === "approval_incomplete") {
    return "approval_review";
  }
  if (input.escalationReason === "replay_break") {
    return "replay_review";
  }
  return "human_review";
}
