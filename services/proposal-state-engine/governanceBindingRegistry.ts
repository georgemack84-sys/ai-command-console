import { hashProposalTransitionValue } from "./proposalTransitionHasher";
import type {
  GovernanceBindingRecord,
  ProposalStateEngineInput,
  ProposalStateError,
} from "./types/proposalStateTypes";

export function buildGovernanceBindingRecord(
  input: ProposalStateEngineInput,
): {
  record: GovernanceBindingRecord;
  errors: readonly ProposalStateError[];
} {
  const expectedGovernanceSnapshotId = input.proposalIntegrityResult.proposal.governanceSnapshotId;
  const enforcementGovernanceSnapshotId = input.constitutionalEnforcementResult.lineage.governanceSnapshotId;
  const errors: ProposalStateError[] = [];

  if (
    !input.transition.governanceSnapshotId
    || input.transition.governanceSnapshotId !== expectedGovernanceSnapshotId
    || input.transition.governanceSnapshotId !== enforcementGovernanceSnapshotId
  ) {
    errors.push({
      code: "PROPOSAL_STATE_GOVERNANCE_BINDING_MISSING",
      message: "Transition governance snapshot does not match immutable proposal and enforcement governance bindings.",
      path: "transition.governanceSnapshotId",
    });
  }

  const enforcementResult =
    input.transition.targetState === "revoked"
      ? "revoked"
      : errors.length > 0
        ? "blocked"
        : input.transition.targetState === "frozen"
          ? "frozen"
          : "allowed";

  const record: GovernanceBindingRecord = Object.freeze({
    bindingId: `governance-binding:${input.transition.transitionId}`,
    proposalId: input.transition.proposalId,
    transitionId: input.transition.transitionId,
    governanceSnapshotId: input.transition.governanceSnapshotId,
    governancePolicyVersion: input.governancePolicyVersion,
    constitutionalRuleSetVersion: input.constitutionalRuleSetVersion,
    authorityBasis: input.transition.governanceAuthorityId,
    enforcementResult,
    boundAt: input.evaluatedAt,
  });

  return {
    record,
    errors: Object.freeze(errors),
  };
}
