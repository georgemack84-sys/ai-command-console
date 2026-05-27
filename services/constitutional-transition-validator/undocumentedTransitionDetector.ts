import type {
  ConstitutionalTransitionError,
  ConstitutionalTransitionStateMachineRecord,
} from "./types/constitutionalTransitionTypes";
import { ConstitutionalTransitionErrorCode } from "./types/constitutionalTransitionTypes";

export function detectUndocumentedTransition(
  stateMachine: ConstitutionalTransitionStateMachineRecord,
): readonly ConstitutionalTransitionError[] {
  return stateMachine.declared
    ? Object.freeze([])
    : Object.freeze([{
      code: ConstitutionalTransitionErrorCode.UNDOCUMENTED_TRANSITION,
      message: "Transition target is not declared in the constitutional transition policy registry.",
      path: `${stateMachine.entityType}.${stateMachine.sourceState}.${stateMachine.targetState}`,
    }]);
}
