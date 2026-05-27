import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceReplayRecord } from "./types/evidenceAggregationTypes";

export function buildEvidenceReplayLineage(record: EvidenceReplayRecord): string {
  return hashEvidenceValue("evidence-replay-lineage", record);
}
