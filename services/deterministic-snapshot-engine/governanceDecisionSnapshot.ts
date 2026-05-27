import type { ConstitutionalSnapshotBuildInput, GovernanceDecisionRecord } from "@/types/deterministic-snapshot-engine";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export function captureGovernanceDecisionSnapshot(
  input: ConstitutionalSnapshotBuildInput,
  governanceDecision: GovernanceDecisionRecord,
): unknown {
  return canonicalizeSnapshotValue({
    kind: "governance_decision",
    decision: governanceDecision,
    policyExplanationHash: input.sourceArtifacts.policyExplanation?.explanationHash,
    governanceEvidenceHash: input.sourceArtifacts.policyExplanation?.governanceReasoning.governanceEvidenceHash,
    sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
  });
}
