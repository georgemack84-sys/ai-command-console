import type { ConstitutionalEnforcementAction, RecoveryDecisionIntelligenceResult } from "./recoveryDecisionTypes";

export function applyRecoveryDecisionPolicies(input: {
  constitutionalAction: ConstitutionalEnforcementAction;
  constitutionallyAllowed: boolean;
  governanceRisk: number;
  continuityImpact: number;
  requiresContainment: boolean;
  requiresEscalation: boolean;
  disputed: boolean;
}) {
  let recommendedAction: RecoveryDecisionIntelligenceResult["recommendedAction"] = "HOLD";

  if (input.constitutionalAction === "DENY") recommendedAction = "FREEZE";
  else if (input.constitutionalAction === "FREEZE") recommendedAction = "FREEZE";
  else if (input.constitutionalAction === "CONTAIN" || input.requiresContainment) recommendedAction = "CONTAIN";
  else if (input.constitutionalAction === "REQUIRE_APPROVAL" || input.disputed) recommendedAction = "GOVERNANCE_REVIEW";
  else if (input.constitutionalAction === "ESCALATE" || input.requiresEscalation) recommendedAction = "ESCALATE";
  else if (input.continuityImpact >= 0.7) recommendedAction = "CONTINUE_DEGRADED";

  return {
    recommendedAction,
    requiresApproval: input.constitutionalAction === "REQUIRE_APPROVAL" || input.disputed,
    requiresEscalation: input.constitutionalAction === "ESCALATE" || input.requiresEscalation,
    requiresContainment: input.constitutionalAction === "CONTAIN" || input.requiresContainment,
  };
}
