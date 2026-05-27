import { hashCertificationValue } from "./certificationHashEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessContainmentRecord,
  DecisionReadinessCertificationError,
} from "./types/decisionReadinessCertificationTypes";

export function certifyCapabilityContainment(
  input: DecisionReadinessCertificationInput,
): {
  record: DecisionReadinessContainmentRecord;
  errors: readonly DecisionReadinessCertificationError[];
} {
  const hiddenExecutionPreventionVerified = !input.hiddenExecutionDetectionResult.report.blocked;
  const capabilityContainmentVerified =
    input.recommendationValidationResult.result.containmentValidated
    && input.proposalIntegrityResult.proposal.executionAuthorized === false
    && input.constitutionalTransitionResult.compatibility.overrideCompatible;
  const transitionVisibilityVerified = input.constitutionalTransitionResult.transition.operatorVisibilityRequired;
  const record = Object.freeze({
    capabilityContainmentVerified,
    transitionVisibilityVerified,
    hiddenExecutionPreventionVerified,
    containmentHash: hashCertificationValue("decision-readiness-containment-record", {
      capabilityContainmentVerified,
      transitionVisibilityVerified,
      hiddenExecutionPreventionVerified,
    }),
  });
  const errors = capabilityContainmentVerified
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_READINESS_CONTAINMENT_INSTABILITY" as const,
      message: "Capability containment requirements were not preserved.",
      path: "containment",
    }]);
  return { record, errors };
}
