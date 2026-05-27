import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function hashRecommendationIntegrityValue(scope: string, value: unknown): string {
  return hashCoordinationReplayValue(`recommendation-integrity:${scope}`, value);
}
