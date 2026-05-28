import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type {
  ConstitutionalTransitionCompatibilityRecord,
  ConstitutionalTransitionInput,
} from "./types/constitutionalTransitionTypes";

export function validateTransitionCompatibility(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionCompatibilityRecord {
  return Object.freeze({
    operatorVisibilityRequired: input.operatorVisibilityRequired,
    overrideCompatible: input.overrideCompatible,
    pauseAvailable: true,
    freezeAvailable: true,
    denyAvailable: true,
    inspectAvailable: true,
    escalateAvailable: true,
    emergencyStopAvailable: true,
    compatibilityHash: hashConstitutionalTransitionValue("constitutional-transition-compatibility", {
      operatorVisibilityRequired: input.operatorVisibilityRequired,
      overrideCompatible: input.overrideCompatible,
      operatorActionType: input.operatorAuthorityResult.action.actionType,
    }),
  });
}
