import { evaluateConstitutionalFreezePropagation } from "@/services/validation/constitutionalFreezePropagation";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { appendIntentAudit } from "./intentAuditAppender";
import { getIntent, updateIntentState } from "./intentPersistence";

export function freezeIntent(intentId: string, reason: string) {
  const intent = getIntent(intentId);
  if (intent.lifecycleState === "FROZEN") {
    return intent;
  }

  const freeze = evaluateConstitutionalFreezePropagation({
    governanceDecision: "FREEZE",
    disputed: false,
    containmentActive: false,
    constitutionalConflict: true,
    operatorSupremacyPreserved: true,
    immutableAuditIdPresent: true,
    driftDetected: false,
    versionConflict: false,
  });
  const next = updateIntentState(intentId, "FROZEN");
  appendIntentAudit({
    intentId,
    eventType: "intent.frozen",
    details: {
      reason,
      freezeReasons: freeze.freezeReasons,
    },
  });
  return next;
}

export function isIntentFrozen(intentId: string) {
  return getIntent(intentId).lifecycleState === "FROZEN";
}

export function enforceIntentFreezeProtection(intentId: string) {
  if (isIntentFrozen(intentId)) {
    throw new Error(INTENT_ERROR_CODES.INTENT_FROZEN);
  }
}
