import type { GovernanceBindingInput, GovernanceSnapshot, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validatePolicyBinding(input: {
  bindingInput: GovernanceBindingInput;
  snapshot: GovernanceSnapshot;
}): readonly ProposalGovernanceBindingError[] {
  const errors: ProposalGovernanceBindingError[] = [];
  const replayPolicySnapshotId = input.bindingInput.recommendationReplayResult.episodes[0]?.governanceReplay.policySnapshotId ?? "";

  if (!replayPolicySnapshotId || input.snapshot.policySnapshotId !== replayPolicySnapshotId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION",
      message: "Policy binding drifted away from the original replay-governance snapshot.",
      path: "policySnapshotId",
    });
  }

  const metadataHaystack = JSON.stringify(input.bindingInput.metadata ?? {}).toLowerCase();
  if (metadataHaystack.includes("latest policy") || metadataHaystack.includes("migrate policy")) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION",
      message: "Detected policy substitution or governance migration semantics.",
      path: "metadata",
    });
  }

  return Object.freeze(errors);
}
