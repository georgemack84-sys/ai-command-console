import { bindRecommendationGovernance } from "@/services/recommendation-synthesis/recommendationGovernanceBinder";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAggregationInput, EvidenceGovernanceRecord } from "./types/evidenceAggregationTypes";

export function bindEvidenceGovernance(input: EvidenceAggregationInput): EvidenceGovernanceRecord {
  const bindings = bindRecommendationGovernance(input.recommendationSynthesisInput);
  return Object.freeze({
    governanceSnapshotId: bindings[0]?.governanceSnapshotId ?? "",
    governanceHash: bindings[0]?.governanceHash ?? "",
    policySnapshotIds: Object.freeze([...input.recommendationSynthesisInput.policySnapshotIds].sort((a, b) => a.localeCompare(b))),
    governanceRecordHash: hashEvidenceValue("evidence-governance-record", {
      bindings,
      policies: input.recommendationSynthesisInput.policySnapshotIds,
    }),
  });
}
