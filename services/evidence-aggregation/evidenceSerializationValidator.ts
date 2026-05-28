import { serializeEvidenceValue } from "./evidenceSerializationEngine";
import type { EvidenceAggregationError } from "./types/evidenceAggregationTypes";

export function validateEvidenceSerialization(input: {
  value: unknown;
  expectedCanonical: string;
  path: string;
}): readonly EvidenceAggregationError[] {
  const replayed = serializeEvidenceValue(input.value);
  if (replayed !== input.expectedCanonical) {
    return Object.freeze([{
      code: "EVIDENCE_AGGREGATION_SERIALIZATION_INSTABILITY",
      message: "Evidence serialization drift detected.",
      path: input.path,
    }]);
  }
  return Object.freeze([]);
}
