import type { SemanticGovernanceResult } from "@/types/intentValidation";

export function routeSemanticGovernanceEscalation(input: {
  freezeActive: boolean;
  plannerAdmissible: boolean;
  clarificationRequired: boolean;
  escalationRequired: boolean;
  approvalRequired: boolean;
}): SemanticGovernanceResult["nextState"] {
  if (input.freezeActive) {
    return "FREEZE";
  }
  if (!input.plannerAdmissible) {
    return "BLOCK";
  }
  if (input.clarificationRequired) {
    return "REQUEST_CLARIFICATION";
  }
  if (input.escalationRequired) {
    return "ESCALATE";
  }
  if (input.approvalRequired) {
    return "REQUIRE_APPROVAL";
  }
  return "ALLOW_PLANNING";
}
