import type { RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

export function appendRecommendationLedgerEvents(args: {
  existingEvents: readonly RecommendationLedgerEvent[];
  nextEvents: readonly RecommendationLedgerEvent[];
}): readonly RecommendationLedgerEvent[] {
  return Object.freeze([...args.existingEvents, ...args.nextEvents]);
}
