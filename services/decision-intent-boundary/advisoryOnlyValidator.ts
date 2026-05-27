import type { DecisionIntentArtifact, DecisionIntentBoundaryError } from "./decisionIntentStateTypes";

export function validateAdvisoryOnlyArtifact(
  artifact: DecisionIntentArtifact,
): readonly DecisionIntentBoundaryError[] {
  return artifact.advisoryOnly
    && artifact.executable === false
    && artifact.executionAuthorized === false
    && artifact.orchestrationAllowed === false
    && artifact.runtimeMutationAllowed === false
    && artifact.authorityMutationAllowed === false
    && artifact.governanceMutationAllowed === false
    && artifact.schedulerRegistrationAllowed === false
    && artifact.operatorReviewRequired
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_ADVISORY_ONLY_VIOLATION",
      message: "Intent artifact violated advisory-only constraints.",
      path: "artifact",
    }]);
}
