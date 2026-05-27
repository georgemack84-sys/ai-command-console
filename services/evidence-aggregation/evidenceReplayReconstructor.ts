import { reconstructRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayReconstructor";
import { bindEvidenceReplay } from "./evidenceReplayBinder";
import type { EvidenceAggregationInput, EvidenceReplayRecord } from "./types/evidenceAggregationTypes";

export function reconstructEvidenceReplay(input: EvidenceAggregationInput): EvidenceReplayRecord {
  reconstructRecommendationReplay(input.recommendationSynthesisInput);
  return bindEvidenceReplay(input);
}
