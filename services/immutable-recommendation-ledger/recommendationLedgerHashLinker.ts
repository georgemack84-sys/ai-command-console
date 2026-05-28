import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";
import type { RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

export function hashRecommendationLedgerEvent(value: {
  eventType: RecommendationLedgerEvent["eventType"];
  recommendationId: string;
  timestamp: string;
  sequenceNumber: number;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  evidenceBundleId: string;
  canonicalPayload: unknown;
}): string {
  return hashReplayValue("immutable-recommendation-ledger-event", value);
}
