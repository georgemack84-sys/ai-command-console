import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";
import type {
  ImmutableRecommendationLedgerError,
  RecommendationLedgerFreezeRecord,
} from "./types/immutableRecommendationLedgerTypes";

export function buildRecommendationLedgerFreezeRecord(
  errors: readonly ImmutableRecommendationLedgerError[],
): RecommendationLedgerFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  const failedClosed = errors.some((error) => error.code !== "LEDGER_GOVERNANCE_CORRELATION_FAILURE");
  return Object.freeze({
    frozen: errors.length > 0,
    failedClosed,
    reasons,
    freezeHash: hashReplayValue("immutable-recommendation-ledger-freeze", { reasons, failedClosed }),
  });
}
