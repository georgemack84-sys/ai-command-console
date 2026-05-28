import { buildEvidenceAggregationPipeline } from "./evidenceAggregationPipeline";

export function validateEvidenceAggregationLifecycle(): boolean {
  return buildEvidenceAggregationPipeline().length > 0;
}
