import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceGovernanceRecord, EvidenceReference } from "./types/evidenceAggregationTypes";

export function buildEvidenceGovernanceTraceability(input: {
  governanceRecord: EvidenceGovernanceRecord;
  references: readonly EvidenceReference[];
}): string {
  return hashEvidenceValue("evidence-governance-traceability", {
    governanceRecord: input.governanceRecord,
    governanceSnapshotIds: input.references.map((reference) => reference.governanceSnapshotId ?? "none"),
  });
}
