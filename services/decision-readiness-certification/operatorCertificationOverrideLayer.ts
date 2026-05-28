import { hashCertificationValue } from "./certificationHashEngine";
import type { DecisionReadinessCertificationInput } from "./types/decisionReadinessCertificationTypes";

export function buildOperatorCertificationOverrideLayer(input: DecisionReadinessCertificationInput) {
  return Object.freeze({
    pause: true,
    freeze: true,
    deny: true,
    revoke: true,
    escalate: true,
    inspectReplay: true,
    inspectAudit: true,
    emergencyStop: true,
    killSwitch: true,
    deterministicHash: hashCertificationValue("decision-readiness-operator-layer", {
      actionType: input.operatorAuthorityResult.action.actionType,
      recommendationSystemId: input.recommendationSystemId,
    }),
  });
}
