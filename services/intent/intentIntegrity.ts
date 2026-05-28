import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { getIntentHistory } from "./intentPersistence";
import { verifyIntentLineage } from "./intentLineage";
import { verifyIntentReplayIntegrity } from "./intentReplayInspector";

export function verifyIntentIntegrity(intentId: string) {
  const history = getIntentHistory(intentId);
  const lineage = verifyIntentLineage(intentId);
  const replay = verifyIntentReplayIntegrity(intentId);
  const timestampCorruption = history.lifecycleEvents.some((event, index, events) =>
    index === 0
      ? event.timestamp < history.intent.createdAt
      : event.timestamp < (events[index - 1]?.timestamp ?? 0));

  const seen = new Set<string>();
  const duplicateTransitions = history.lifecycleEvents.some((event) => {
    const key = `${event.previousState ?? "NONE"}:${event.nextState}:${event.timestamp}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
    return false;
  });

  const reasons = [
    ...(verifyImmutableLedgerChain(history.auditEntries) ? [] : [INTENT_ERROR_CODES.INTENT_AUDIT_CORRUPTED]),
    ...(lineage.valid ? [] : lineage.issues),
    ...(replay.driftDetected ? replay.reasons : []),
    ...(timestampCorruption ? [INTENT_ERROR_CODES.INTENT_INTEGRITY_FAILURE] : []),
    ...(duplicateTransitions ? [INTENT_ERROR_CODES.INTENT_INTEGRITY_FAILURE] : []),
    ...(history.intent.immutableHash ? [] : [INTENT_ERROR_CODES.INTENT_IMMUTABLE_MUTATION]),
  ];

  return {
    intentId,
    valid: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    duplicateTransitions,
    timestampCorruption,
    orphaned: history.lifecycleEvents.length === 0,
  };
}
