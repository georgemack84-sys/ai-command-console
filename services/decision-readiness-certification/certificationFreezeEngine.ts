import { hashCertificationValue } from "./certificationHashEngine";
import type { DecisionReadinessCertificationError, DecisionReadinessFreezeRecord } from "./types/decisionReadinessCertificationTypes";

export function buildCertificationFreeze(
  errors: readonly DecisionReadinessCertificationError[],
): DecisionReadinessFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  const frozen = reasons.length > 0;
  return Object.freeze({
    frozen,
    escalated: frozen,
    reasons,
    freezeHash: hashCertificationValue("decision-readiness-freeze", {
      frozen,
      escalated: frozen,
      reasons,
    }),
  });
}
