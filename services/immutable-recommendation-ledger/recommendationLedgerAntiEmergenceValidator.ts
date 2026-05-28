import type { ImmutableRecommendationLedgerError, RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "executionIntent",
  "dispatchMetadata",
  "retryInstructions",
  "schedulerMetadata",
  "orchestrationHints",
  "escalationCommands",
  "autonomousRepair",
  "authorityExpansion",
  "runtimeMutationInstructions",
]);

export function validateRecommendationLedgerAntiEmergence(event: RecommendationLedgerEvent): ImmutableRecommendationLedgerError[] {
  const payloadKeys = Object.keys(event.payload);
  const forbiddenKey = payloadKeys.find((key) => FORBIDDEN_PAYLOAD_KEYS.has(key));
  if (forbiddenKey) {
    return [{
      code: "LEDGER_REPLAY_INVALID",
      message: `Ledger payload contains forbidden anti-emergence key: ${forbiddenKey}.`,
      path: `event.${event.ledgerEventId}.payload.${forbiddenKey}`,
    }];
  }

  if (event.metadata.executable !== false) {
    return [{
      code: "LEDGER_REPLAY_INVALID",
      message: "Ledger events must remain non-executable.",
      path: `event.${event.ledgerEventId}.metadata.executable`,
    }];
  }

  return [];
}
