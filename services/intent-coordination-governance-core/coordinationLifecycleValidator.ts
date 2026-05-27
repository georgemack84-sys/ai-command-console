import type { CoordinationGovernanceError, CoordinationState, CoordinationTransition } from "@/types/intent-coordination-governance-core";
import { resolveCoordinationTransition } from "./coordinationTransitionValidator";

export function validateCoordinationLifecycle(input: {
  currentState: CoordinationState;
  requestedTransition: CoordinationTransition;
  escalationActive: boolean;
  errorsPresent: boolean;
}): Readonly<{
  resultingState: CoordinationState;
  errors: readonly CoordinationGovernanceError[];
}> {
  return resolveCoordinationTransition(input);
}
