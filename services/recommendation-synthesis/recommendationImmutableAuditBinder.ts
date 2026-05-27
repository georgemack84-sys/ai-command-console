import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationAuditRecord,
  RecommendationEnvelope,
  RecommendationSynthesisLineageLedger,
} from "./types/recommendationSynthesisTypes";

export function bindRecommendationImmutableAudit(input: {
  recommendationId: string;
  envelope: RecommendationEnvelope;
  lineage: RecommendationSynthesisLineageLedger;
}): RecommendationAuditRecord {
  return Object.freeze({
    recordId: `${input.recommendationId}:audit`,
    recommendationId: input.recommendationId,
    lineageHash: input.lineage.lineageHash,
    auditHash: hashRecommendationValue("recommendation-synthesis-audit-record", {
      recommendationId: input.recommendationId,
      envelopeHash: input.envelope.envelopeHash,
      lineageHash: input.lineage.lineageHash,
    }),
  });
}
