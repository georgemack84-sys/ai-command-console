import type {
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function validateConfidencePolicy(
  input: DeterministicConfidenceInput,
): readonly DeterministicConfidenceError[] {
  const errors: DeterministicConfidenceError[] = [];
  const binding = input.proposalGovernanceBindingResult.binding;
  const snapshot = input.proposalGovernanceBindingResult.snapshot;

  if (binding.governanceSnapshotId !== snapshot.governanceSnapshotId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT",
      message: "Confidence scoring detected governance snapshot substitution.",
      path: "proposalGovernanceBindingResult.binding.governanceSnapshotId",
    });
  }

  if (binding.policySnapshotId !== snapshot.policySnapshotId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT",
      message: "Confidence scoring detected policy snapshot substitution.",
      path: "proposalGovernanceBindingResult.snapshot.policySnapshotId",
    });
  }

  return Object.freeze(errors);
}
