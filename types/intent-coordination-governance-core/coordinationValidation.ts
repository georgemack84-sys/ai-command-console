import type { CoordinationState, CoordinationTransition } from "./coordinationState";

export type CoordinationValidation = Readonly<{
  validationId: string;
  currentState: CoordinationState;
  requestedTransition: CoordinationTransition;
  resultingState: CoordinationState;
  lifecycleValid: boolean;
  topologyValid: boolean;
  replayValid: boolean;
  governanceValid: boolean;
  readinessValid: boolean;
  escalationValid: boolean;
  containmentValid: boolean;
  executionLeakAbsent: boolean;
  reasons: readonly string[];
  createdAt: string;
}>;
