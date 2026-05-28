import type { BoundedCoordinationGateRecord, BoundedIntentLifecycleState, LifecycleError } from "@/types/lifecycle";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import { validateBoundedCoordinationTransition } from "./coordinationTransitionEngine";
import { createLifecycleError } from "@/services/lifecycle/lifecycleBoundaryGuards";

export function buildBoundedCoordinationGate(input: {
  currentState: BoundedIntentLifecycleState;
  nextState: BoundedIntentLifecycleState;
  coordinationRecord: IntentCoordinationGovernanceRecord;
}): BoundedCoordinationGateRecord {
  const transitionErrors = validateBoundedCoordinationTransition({
    coordinationRecord: input.coordinationRecord,
    nextState: input.nextState,
  });
  const additionalErrors: LifecycleError[] = [];

  if (input.nextState === "bounded_coordination" && input.currentState !== "revalidate") {
    additionalErrors.push(createLifecycleError(
      "LIFECYCLE_COORDINATION_INFERENCE_REJECTED",
      "Bounded coordination is only reachable from explicit revalidate state.",
      "currentState",
    ));
  }

  return Object.freeze({
    gateId: `${input.coordinationRecord.coordinationId}:${input.currentState}->${input.nextState}`,
    valid: transitionErrors.length === 0 && additionalErrors.length === 0,
    coordinationState: input.coordinationRecord.state,
    derivedOnly: true,
    errors: Object.freeze([...transitionErrors, ...additionalErrors]),
  });
}
