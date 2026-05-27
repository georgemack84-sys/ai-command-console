import type { IntentLifecycleState } from "@/types/intentContracts";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { getIntentHistory } from "./intentPersistence";

export function reconstructIntentState(intentId: string) {
  const history = getIntentHistory(intentId);
  return (history.lifecycleEvents.at(-1)?.nextState ?? "MISSING") as IntentLifecycleState | "MISSING";
}

export function rebuildIntentLifecycle(intentId: string) {
  const history = getIntentHistory(intentId);
  return {
    intentId,
    reconstructedState: reconstructIntentState(intentId),
    lifecycleHash: hashEvidence({
      intentId,
      lifecycleEvents: history.lifecycleEvents,
    }),
    eventCount: history.lifecycleEvents.length,
  };
}

export function rebuildIntentReplayHash(intentId: string) {
  const history = getIntentHistory(intentId);
  return hashEvidence({
    intentId,
    normalizedInput: history.intent.normalizedInput,
    intent: history.intent.intent,
    source: history.intent.source,
    lifecycleEvents: history.lifecycleEvents,
  });
}
