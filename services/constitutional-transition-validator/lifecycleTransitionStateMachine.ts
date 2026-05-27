import { getDeclaredTransitionTargets } from "./transitionPolicyRegistry";
import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type { ConstitutionalTransitionInput, ConstitutionalTransitionStateMachineRecord } from "./types/constitutionalTransitionTypes";

export function validateLifecycleTransitionStateMachine(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionStateMachineRecord {
  const documentedTargets = getDeclaredTransitionTargets(input.entityType, input.sourceState);
  const declared = documentedTargets.includes(input.targetState);
  return Object.freeze({
    entityType: input.entityType,
    sourceState: input.sourceState,
    targetState: input.targetState,
    declared,
    documentedTargets,
    stateMachineHash: hashConstitutionalTransitionValue("constitutional-transition-state-machine", {
      entityType: input.entityType,
      sourceState: input.sourceState,
      targetState: input.targetState,
      documentedTargets,
      declared,
    }),
  });
}
