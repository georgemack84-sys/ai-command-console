import { auditRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayAuditor";
import type { ConfidenceScoringError, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function validateConfidenceReplay(
  input: ConfidenceScoringInput,
): readonly ConfidenceScoringError[] {
  return Object.freeze(
    auditRecommendationReplay(input.recommendationSynthesisInput).map((error) => ({
      code: "CONFIDENCE_SCORING_REPLAY_MISMATCH" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
