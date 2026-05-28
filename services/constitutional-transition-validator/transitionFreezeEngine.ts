import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type { ConstitutionalTransitionError, ConstitutionalTransitionFreezeRecord } from "./types/constitutionalTransitionTypes";

export function buildTransitionFreezeRecord(
  errors: readonly ConstitutionalTransitionError[],
): ConstitutionalTransitionFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  const frozen = reasons.length > 0;
  return Object.freeze({
    frozen,
    escalated: frozen,
    reasons,
    freezeHash: hashConstitutionalTransitionValue("constitutional-transition-freeze-record", {
      frozen,
      escalated: frozen,
      reasons,
    }),
  });
}
