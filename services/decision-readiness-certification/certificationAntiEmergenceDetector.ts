import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function detectCertificationAntiEmergence(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  const tripped =
    input.metadata?.recursiveRecommendationChain === true
    || input.metadata?.orchestrationSynthesis === true
    || input.metadata?.capabilityMutation === true
    || input.metadata?.dynamicAuthorityInheritance === true
    || input.metadata?.runtimeSemanticDrift === true
    || input.metadata?.selfModifyingCertificationLogic === true;
  return tripped
    ? Object.freeze([{
      code: "DECISION_READINESS_ANTI_EMERGENCE" as const,
      message: "Anti-emergence detector found forbidden autonomy growth semantics.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
