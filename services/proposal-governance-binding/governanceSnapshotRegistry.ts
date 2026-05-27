import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import type { GovernanceBindingInput, GovernanceSnapshot, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function buildGovernanceSnapshot(input: GovernanceBindingInput): {
  snapshot: GovernanceSnapshot;
  errors: readonly ProposalGovernanceBindingError[];
} {
  const errors: ProposalGovernanceBindingError[] = [];
  const governanceSnapshotId = input.proposalIntegrityResult.proposal.governanceSnapshotId;

  if (!governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_MISSING_GOVERNANCE_SNAPSHOT",
      message: "Governance binding requires an immutable governance snapshot id.",
      path: "proposalIntegrityResult.proposal.governanceSnapshotId",
    });
  }

  if (!input.policySnapshotId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_MISSING_POLICY_SNAPSHOT",
      message: "Governance binding requires an immutable policy snapshot id.",
      path: "policySnapshotId",
    });
  }

  if (!input.replayContractId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_MISSING_REPLAY_CONTRACT",
      message: "Governance binding requires an immutable replay contract id.",
      path: "replayContractId",
    });
  }

  const snapshotCore = {
    governanceSnapshotId,
    governanceVersion: input.governanceVersion,
    policySnapshotId: input.policySnapshotId,
    authorityBoundaryId: input.authorityBoundary.authorityBoundaryId,
    replayContractId: input.replayContractId,
    validatorVersionSetId: input.validatorVersionSet.validatorVersionSetId,
    approvalRequirementSetId: input.approvalRequirementBinding.approvalRequirementSetId,
    createdAt: input.evaluatedAt,
  };

  return {
    snapshot: Object.freeze({
      ...snapshotCore,
      constitutionalRulesHash: hashGovernanceBindingValue("proposal-governance-binding-rules", {
        constitutionalVersion: input.constitutionalVersion,
        governanceVersion: input.governanceVersion,
        governancePolicyVersion: input.proposalStateEngineInput.governancePolicyVersion,
        constitutionalRuleSetVersion: input.proposalStateEngineInput.constitutionalRuleSetVersion,
      }),
    }),
    errors: Object.freeze(errors),
  };
}
