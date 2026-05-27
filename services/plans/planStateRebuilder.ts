import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { PersistedPlanState } from "./planContracts";
import { getPlanHistory } from "./planPersistence";

export function reconstructPlanState(planId: string) : PersistedPlanState | "MISSING" {
  const history = getPlanHistory(planId);
  return (history.lifecycleEvents.at(-1)?.nextState as PersistedPlanState | undefined) ?? "MISSING";
}

export function rebuildLifecycleHash(planId: string) {
  const history = getPlanHistory(planId);
  return hashEvidence({
    planId,
    lifecycleEvents: history.lifecycleEvents.map((event) => ({
      eventId: event.eventId,
      previousState: event.previousState ?? null,
      nextState: event.nextState,
      actor: event.actor,
      timestamp: event.timestamp,
      reason: event.reason ?? null,
    })),
  });
}

export function rebuildPlanLifecycle(planId: string) {
  const history = getPlanHistory(planId);
  return {
    planId,
    reconstructedState: reconstructPlanState(planId),
    lifecycleHash: rebuildLifecycleHash(planId),
    eventCount: history.lifecycleEvents.length,
  };
}
