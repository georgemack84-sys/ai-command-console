import type { ImmutableRecommendationLedgerError, RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

export function validateAppendOnlyLedger(args: {
  existingEvents: readonly RecommendationLedgerEvent[];
  nextEvents: readonly RecommendationLedgerEvent[];
}): ImmutableRecommendationLedgerError[] {
  const errors: ImmutableRecommendationLedgerError[] = [];
  const existingById = new Map(args.existingEvents.map((event) => [event.ledgerEventId, event]));

  for (const event of args.nextEvents) {
    const existing = existingById.get(event.ledgerEventId);
    if (existing) {
      errors.push({
        code: "LEDGER_APPEND_ONLY_VIOLATION",
        message: "Ledger append attempted to rewrite an existing ledger event.",
        path: `event.${event.ledgerEventId}`,
      });
    }
  }

  let previousSequence = args.existingEvents
    .filter((event) => event.recommendationId === args.nextEvents[0]?.recommendationId)
    .reduce((max, event) => Math.max(max, event.sequenceNumber), 0);
  for (const event of args.nextEvents) {
    if (event.sequenceNumber <= previousSequence) {
      errors.push({
        code: "LEDGER_SEQUENCE_CORRUPTION",
        message: "Ledger sequence numbers must strictly increase for a recommendation.",
        path: `event.${event.ledgerEventId}.sequenceNumber`,
      });
    }
    previousSequence = event.sequenceNumber;
  }

  return errors;
}
