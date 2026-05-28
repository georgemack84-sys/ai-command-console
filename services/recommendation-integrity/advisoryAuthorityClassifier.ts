import type { RecommendationIntegrityError, RecommendationIntegrityInput } from "@/types/recommendation-integrity";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function classifyAdvisoryAuthority(input: RecommendationIntegrityInput): readonly RecommendationIntegrityError[] {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (!serialized.includes("advisoryauthority") && !serialized.includes("selfauthorize")) {
    return Object.freeze([]);
  }
  return Object.freeze([
    error(
      "RECOMMENDATION_AUTHORITY_DRIFT",
      "Recommendations attempted to become self-authorizing.",
      "metadata",
    ),
  ]);
}
