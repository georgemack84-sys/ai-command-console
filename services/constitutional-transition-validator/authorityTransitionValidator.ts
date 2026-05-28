import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type {
  ConstitutionalTransitionAuthorityRecord,
  ConstitutionalTransitionInput,
} from "./types/constitutionalTransitionTypes";

export function validateTransitionAuthority(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionAuthorityRecord {
  const operatorCompatible =
    input.overrideCompatible
    && input.recommendationValidationResult.result.operatorReviewRequired
    && input.operatorAuthorityResult.action.operatorReviewRequired;
  return Object.freeze({
    authorityBasisId: input.authorityBasisId,
    operatorCompatible,
    suppressed: input.operatorAuthorityResult.suppression.suppressed,
    continuityInvalidated: input.operatorAuthorityResult.suppression.continuityInvalidated,
    authorityHash: hashConstitutionalTransitionValue("constitutional-transition-authority-record", {
      authorityBasisId: input.authorityBasisId,
      operatorCompatible,
      suppressionHash: input.operatorAuthorityResult.suppression.suppressionHash,
      actionType: input.operatorAuthorityResult.action.actionType,
    }),
  });
}
