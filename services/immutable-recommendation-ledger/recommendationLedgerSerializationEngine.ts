import { canonicalizeRecommendationLedgerToString } from "./recommendationLedgerCanonicalizer";
import type { RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

export function serializeRecommendationLedgerEvent(event: RecommendationLedgerEvent): string {
  return canonicalizeRecommendationLedgerToString(event);
}
