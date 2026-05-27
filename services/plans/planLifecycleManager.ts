import { transition } from "./planLifecycle";
import type { PersistedPlanState, PlanActor } from "./planContracts";

export function transitionPlanLifecycle(input: {
  planId: string;
  fromState: PersistedPlanState;
  toState: PersistedPlanState;
  actor: PlanActor;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt?: number;
}) {
  return transition(input);
}
