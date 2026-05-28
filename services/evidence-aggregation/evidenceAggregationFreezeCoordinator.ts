import { buildEvidenceFreeze } from "./evidenceFreezeEngine";
import { shouldEvidenceFailClosed } from "./evidenceFailClosedController";
import type { EvidenceAggregationError, EvidenceAggregationFreezeRecord } from "./types/evidenceAggregationTypes";

export function coordinateEvidenceAggregationFreeze(
  errors: readonly EvidenceAggregationError[],
): EvidenceAggregationFreezeRecord {
  const freeze = buildEvidenceFreeze(errors);
  if (!shouldEvidenceFailClosed(errors)) {
    return freeze;
  }
  return Object.freeze({
    ...freeze,
    frozen: true,
    escalated: true,
  });
}
