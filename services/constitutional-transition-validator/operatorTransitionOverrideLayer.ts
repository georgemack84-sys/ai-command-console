import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type { ConstitutionalTransitionInput } from "./types/constitutionalTransitionTypes";

export function buildOperatorTransitionOverrideLayer(input: ConstitutionalTransitionInput) {
  return Object.freeze({
    actionType: input.operatorAuthorityResult.action.actionType,
    operatorId: input.operatorAuthorityResult.action.operatorId,
    emergencyStopAvailable: true,
    deterministicHash: hashConstitutionalTransitionValue("constitutional-transition-override-layer", {
      actionType: input.operatorAuthorityResult.action.actionType,
      operatorId: input.operatorAuthorityResult.action.operatorId,
      operatorReviewRequired: input.operatorAuthorityResult.action.operatorReviewRequired,
    }),
  });
}
