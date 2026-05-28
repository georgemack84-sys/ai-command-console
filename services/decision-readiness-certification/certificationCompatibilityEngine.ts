import { hashCertificationValue } from "./certificationHashEngine";
import type { DecisionReadinessCertificationInput } from "./types/decisionReadinessCertificationTypes";

export function buildCertificationCompatibility(input: DecisionReadinessCertificationInput) {
  const compatible =
    input.constitutionalTransitionResult.compatibility.pauseAvailable
    && input.constitutionalTransitionResult.compatibility.freezeAvailable
    && input.constitutionalTransitionResult.compatibility.emergencyStopAvailable;
  return Object.freeze({
    compatible,
    compatibilityHash: hashCertificationValue("decision-readiness-compatibility", {
      compatible,
      actionType: input.operatorAuthorityResult.action.actionType,
    }),
  });
}
