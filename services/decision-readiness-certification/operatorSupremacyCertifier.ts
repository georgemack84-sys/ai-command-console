import { hashCertificationValue } from "./certificationHashEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessCertificationError,
  DecisionReadinessOperatorRecord,
} from "./types/decisionReadinessCertificationTypes";

export function certifyOperatorSupremacy(
  input: DecisionReadinessCertificationInput,
): {
  record: DecisionReadinessOperatorRecord;
  errors: readonly DecisionReadinessCertificationError[];
} {
  const operatorSupremacyVerified =
    input.operatorAuthorityResult.suppression.suppressed
    && input.operatorAuthorityResult.suppression.continuityInvalidated
    && input.constitutionalTransitionResult.compatibility.emergencyStopAvailable;
  const record = Object.freeze({
    operatorSupremacyVerified,
    suppressionContinuityVerified: input.constitutionalTransitionResult.authorityRecord.continuityInvalidated,
    operatorHash: hashCertificationValue("decision-readiness-operator-record", {
      actionType: input.operatorAuthorityResult.action.actionType,
      operatorSupremacyVerified,
      suppressionContinuityVerified: input.constitutionalTransitionResult.authorityRecord.continuityInvalidated,
    }),
  });
  const errors = operatorSupremacyVerified
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_READINESS_OPERATOR_OVERRIDE_FAILURE" as const,
      message: "Operator supremacy verification failed.",
      path: "operatorAuthorityResult",
    }]);
  return { record, errors };
}
