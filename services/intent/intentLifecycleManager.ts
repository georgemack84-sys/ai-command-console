import type { IntentActor, IntentLifecycleEvent, IntentLifecycleState } from "@/types/intentContracts";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { appendIntentAudit } from "./intentAuditAppender";
import { appendIntentLifecycleEvent, getIntent, updateIntentState } from "./intentPersistence";
import { isAllowedIntentTransition } from "./intentTransitionMatrix";

export function transitionIntentLifecycle(input: {
  intentId: string;
  fromState: IntentLifecycleState;
  toState: IntentLifecycleState;
  actor: IntentActor;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}) {
  const timestamp = input.timestamp ?? 0;
  const intent = getIntent(input.intentId);

  if (intent.lifecycleState !== input.fromState) {
    throw new Error(INTENT_ERROR_CODES.INTENT_STATE_MISMATCH);
  }
  if (intent.lifecycleState === "FROZEN" && input.toState !== "DISPUTED") {
    throw new Error(INTENT_ERROR_CODES.INTENT_FROZEN);
  }
  if (intent.lifecycleState === "DISPUTED" && input.toState !== "VALIDATING" && input.toState !== "FROZEN") {
    throw new Error(INTENT_ERROR_CODES.SEMANTIC_CONFLICT);
  }
  if (!isAllowedIntentTransition(input.fromState, input.toState)) {
    appendIntentAudit({
      intentId: input.intentId,
      eventType: "intent.transition_rejected",
      details: {
        fromState: input.fromState,
        toState: input.toState,
      },
    });
    throw new Error(INTENT_ERROR_CODES.INTENT_TRANSITION_DENIED);
  }
  if ((input.toState === "ACCEPTED" || input.toState === "VALIDATING") && (!intent.semanticIntegrityVerified || intent.clarificationRequired)) {
    throw new Error(INTENT_ERROR_CODES.LOW_CONFIDENCE);
  }

  const nextIntent = updateIntentState(input.intentId, input.toState);
  const event: IntentLifecycleEvent = {
    eventId: `intent-event:${input.intentId}:${input.fromState}:${input.toState}:${input.actor}:${timestamp}`,
    intentId: input.intentId,
    previousState: input.fromState,
    nextState: input.toState,
    actor: input.actor,
    timestamp,
    createdAt: timestamp,
    reason: input.reason,
    metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
  };
  appendIntentLifecycleEvent(event);
  appendIntentAudit({
    intentId: input.intentId,
    eventType: "intent.transition_applied",
    details: {
      fromState: input.fromState,
      toState: input.toState,
      actor: input.actor,
      reason: input.reason ?? null,
    },
  });

  return {
    intent: nextIntent,
    event,
  };
}
