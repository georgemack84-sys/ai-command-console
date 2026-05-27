import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { evaluateConstitutionalFreezePropagation } from "@/services/validation/constitutionalFreezePropagation";
import type { StructuredIntent, IntentLifecycleEvent, IntentLifecycleState, IntentActor } from "@/types/intentContracts";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { appendSemanticParseAudit } from "./semanticAudit";
import { appendIntentAudit } from "./intentAuditAppender";
import { buildStructuredIntent } from "./intentStabilizer";

type IntentStoreState = {
  intents: Map<string, StructuredIntent>;
  lifecycleEvents: Map<string, IntentLifecycleEvent[]>;
  auditEntries: Map<string, ImmutableAuditLedgerEntry<unknown>[]>;
};

const store: IntentStoreState = {
  intents: new Map(),
  lifecycleEvents: new Map(),
  auditEntries: new Map(),
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function buildLifecycleHash(intentId: string, lifecycleEvents: IntentLifecycleEvent[]) {
  return hashEvidence({ intentId, lifecycleEvents });
}

function persist(intent: StructuredIntent) {
  store.intents.set(intent.intentId, clone(intent));
  return clone(intent);
}

export function resetIntentStore() {
  store.intents.clear();
  store.lifecycleEvents.clear();
  store.auditEntries.clear();
}

export function appendIntentAuditEntry(intentId: string, entry: ImmutableAuditLedgerEntry<unknown>) {
  const entries = store.auditEntries.get(intentId) ?? [];
  entries.push(entry);
  store.auditEntries.set(intentId, entries);
  return entry;
}

export function readIntentAuditEntries(intentId: string) {
  return [...(store.auditEntries.get(intentId) ?? [])];
}

export function readIntent(intentId: string) {
  const intent = store.intents.get(intentId);
  return intent ? clone(intent) : undefined;
}

export function getIntent(intentId: string) {
  const intent = readIntent(intentId);
  if (!intent) {
    throw new Error(INTENT_ERROR_CODES.INTENT_NOT_FOUND);
  }
  return intent;
}

export function readIntentLifecycleEvents(intentId: string) {
  return (store.lifecycleEvents.get(intentId) ?? []).map(clone);
}

export function appendIntentLifecycleEvent(event: IntentLifecycleEvent) {
  const events = store.lifecycleEvents.get(event.intentId) ?? [];
  events.push(clone(event));
  store.lifecycleEvents.set(event.intentId, events);
  return clone(event);
}

export function updateIntentState(intentId: string, lifecycleState: IntentLifecycleState) {
  const intent = getIntent(intentId);
  const updated = {
    ...intent,
    lifecycleState,
    replayHash: hashEvidence({
      intentId: intent.intentId,
      normalizedInput: intent.normalizedInput,
      lifecycleState,
      intent: intent.intent,
      confidence: intent.confidence,
    }),
    immutableHash: hashEvidence({
      intentId: intent.intentId,
      rawInput: intent.rawInput,
      normalizedInput: intent.normalizedInput,
      lifecycleState,
      intent: intent.intent,
      warnings: intent.warnings,
      semanticWarnings: intent.semanticWarnings,
    }),
  };
  return persist(updated);
}

function buildEvent(intentId: string, previousState: IntentLifecycleState | undefined, nextState: IntentLifecycleState, actor: IntentActor, timestamp: number, reason?: string) {
  return {
    eventId: `intent-event:${intentId}:${previousState ?? "NONE"}:${nextState}:${actor}:${timestamp}`,
    intentId,
    previousState,
    nextState,
    actor,
    timestamp,
    reason,
    createdAt: timestamp,
  } satisfies IntentLifecycleEvent;
}

export function createStructuredIntentRecord(input: {
  intentId: string;
  rawInput: string;
  createdAt?: number;
}) {
  if (readIntent(input.intentId)) {
    throw new Error("INTENT_ALREADY_EXISTS");
  }

  const createdAt = input.createdAt ?? 0;
  const structured = buildStructuredIntent({
    intentId: input.intentId,
    rawInput: input.rawInput,
    createdAt,
  });
  const freeze = evaluateConstitutionalFreezePropagation({
    governanceDecision: structured.lifecycleState === "FROZEN" ? "FREEZE" : structured.lifecycleState === "DISPUTED" ? "DISPUTED" : "ALLOW",
    disputed: structured.lifecycleState === "DISPUTED",
    containmentActive: false,
    constitutionalConflict: structured.dangerous,
    operatorSupremacyPreserved: true,
    immutableAuditIdPresent: true,
    driftDetected: false,
    versionConflict: false,
  });

  const intent = persist({
    ...structured,
    lifecycleState: freeze.frozen ? "FROZEN" : structured.lifecycleState,
    semanticWarnings: freeze.frozen
      ? Array.from(new Set([...structured.semanticWarnings, ...freeze.freezeReasons]))
      : structured.semanticWarnings,
  });

  const events: IntentLifecycleEvent[] = [
    buildEvent(intent.intentId, undefined, "RECEIVED", "system", createdAt),
    buildEvent(intent.intentId, "RECEIVED", "NORMALIZING", "system", createdAt + 1),
    buildEvent(intent.intentId, "NORMALIZING", "CLASSIFYING", "system", createdAt + 2),
    buildEvent(intent.intentId, "CLASSIFYING", "VALIDATING", "system", createdAt + 3),
    buildEvent(intent.intentId, "VALIDATING", intent.lifecycleState, "system", createdAt + 4),
  ];
  events.forEach(appendIntentLifecycleEvent);

  const finalIntent = persist({
    ...intent,
    replayHash: hashEvidence({
      intentId: intent.intentId,
      normalizedInput: intent.normalizedInput,
      intent: intent.intent,
      source: intent.source,
      lifecycleEvents: readIntentLifecycleEvents(intent.intentId),
    }),
    immutableHash: hashEvidence({
      ...intent,
      lifecycleEvents: readIntentLifecycleEvents(intent.intentId),
    }),
  });

  appendSemanticParseAudit({
    intentId: finalIntent.intentId,
    source: finalIntent.source,
    confidence: finalIntent.confidence,
    lifecycleState: finalIntent.lifecycleState,
    warnings: finalIntent.warnings,
  });
  appendIntentAudit({
    intentId: finalIntent.intentId,
    eventType: "intent.created",
    details: {
      lifecycleState: finalIntent.lifecycleState,
      supported: finalIntent.supported,
      dangerous: finalIntent.dangerous,
    },
  });

  return finalIntent;
}

export function getIntentHistory(intentId: string) {
  return {
    intent: getIntent(intentId),
    lifecycleEvents: readIntentLifecycleEvents(intentId),
    auditEntries: readIntentAuditEntries(intentId),
  };
}
