import { hashRecommendationValue } from "./recommendationHashEngine";
import type { RecommendationEvidenceReference } from "./types/recommendationSynthesisTypes";

function inferSourceType(sourceId: string): RecommendationEvidenceReference["sourceType"] {
  if (sourceId.includes("telemetry")) return "telemetry";
  if (sourceId.includes("governance")) return "governance";
  if (sourceId.includes("replay")) return "replay";
  if (sourceId.includes("proposal")) return "proposal";
  if (sourceId.includes("approval")) return "approval";
  if (sourceId.includes("audit")) return "audit";
  if (sourceId.includes("operator")) return "operator";
  return "validation";
}

export function buildRecommendationEvidenceReferences(
  sourceIds: readonly string[],
): readonly RecommendationEvidenceReference[] {
  return Object.freeze(sourceIds.map((sourceId, index) => Object.freeze({
    referenceId: `evidence-reference-${index + 1}`,
    sourceType: inferSourceType(sourceId),
    sourceId,
    order: index,
    referenceHash: hashRecommendationValue("recommendation-synthesis-evidence-reference", {
      sourceId,
      order: index,
    }),
  } satisfies RecommendationEvidenceReference)));
}
