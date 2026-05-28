import type { RecommendationIntegrityError } from "@/types/recommendation-integrity";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function detectFabricatedEvidence(input: RecommendationIntegrityInput): readonly RecommendationIntegrityError[] {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (!serialized.includes("fabricatedevidence") && !serialized.includes("missingevidence")) {
    return Object.freeze([]);
  }
  return Object.freeze([
    error(
      "RECOMMENDATION_FABRICATED_EVIDENCE",
      "Recommendation evidence was fabricated or missing.",
      "metadata",
    ),
  ]);
}

import type { RecommendationIntegrityInput } from "@/types/recommendation-integrity";
