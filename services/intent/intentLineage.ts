import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { getIntent } from "./intentPersistence";

export function verifyIntentLineage(intentId: string) {
  const intent = getIntent(intentId);
  const issues = [
    ...(intent.lineageId ? [] : [INTENT_ERROR_CODES.INTENT_LINEAGE_CORRUPTED]),
    ...(intent.lineageId.includes(intent.intentId) ? [] : []),
  ];

  return {
    intentId,
    valid: issues.length === 0,
    issues,
  };
}
