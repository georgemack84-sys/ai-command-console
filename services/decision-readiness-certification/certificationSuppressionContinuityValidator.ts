import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function validateCertificationSuppressionContinuity(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  const broken =
    !input.operatorAuthorityResult.suppression.suppressed
    || !input.operatorAuthorityResult.suppression.continuityInvalidated
    || !input.constitutionalTransitionResult.authorityRecord.continuityInvalidated;
  return broken
    ? Object.freeze([{
      code: "DECISION_READINESS_OPERATOR_OVERRIDE_FAILURE" as const,
      message: "Suppression continuity is not strong enough for readiness certification.",
      path: "operatorAuthorityResult.suppression",
    }])
    : Object.freeze([]);
}
