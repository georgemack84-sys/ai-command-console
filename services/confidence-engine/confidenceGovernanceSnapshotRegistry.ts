import type { DeterministicConfidenceInput, DeterministicConfidenceError } from "./types/confidenceTypes";

export function resolveConfidenceGovernanceSnapshot(
  input: DeterministicConfidenceInput,
): {
  governanceSnapshotId: string;
  policyLineageId: string;
  errors: readonly DeterministicConfidenceError[];
} {
  const governanceSnapshotId = input.proposalGovernanceBindingResult.binding.governanceSnapshotId;
  const policySnapshotId = input.proposalGovernanceBindingResult.binding.policySnapshotId;
  const errors: DeterministicConfidenceError[] = [];

  if (!governanceSnapshotId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_GOVERNANCE_SNAPSHOT_MISSING",
      message: "Confidence scoring requires an immutable governance snapshot id.",
      path: "proposalGovernanceBindingResult.binding.governanceSnapshotId",
    });
  }

  if (!policySnapshotId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_POLICY_LINEAGE_UNRESOLVED",
      message: "Confidence scoring requires an immutable policy snapshot lineage.",
      path: "proposalGovernanceBindingResult.binding.policySnapshotId",
    });
  }

  return {
    governanceSnapshotId,
    policyLineageId: `${governanceSnapshotId}:${policySnapshotId}`,
    errors: Object.freeze(errors),
  };
}
