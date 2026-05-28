import type { RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

const EVENT_ORDER: Record<RecommendationLedgerEvent["eventType"], number> = {
  "recommendation.generated": 0,
  "recommendation.constrained": 1,
  "recommendation.scored": 2,
  "recommendation.prioritized": 3,
  "recommendation.replayed": 4,
  "recommendation.archived": 5,
};

export function orderLedgerEventsDeterministically(events: readonly RecommendationLedgerEvent[]): RecommendationLedgerEvent[] {
  return [...events].sort((left, right) =>
    EVENT_ORDER[left.eventType] - EVENT_ORDER[right.eventType]
    || left.sequenceNumber - right.sequenceNumber
    || left.timestamp.localeCompare(right.timestamp)
    || left.ledgerEventId.localeCompare(right.ledgerEventId)
    || left.lineageHash.localeCompare(right.lineageHash),
  );
}
