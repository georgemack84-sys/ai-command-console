import { bindProposalGovernance } from "@/services/proposal-governance-binding/governanceBindingEngine";
import type { GovernanceBindingInput } from "@/services/proposal-governance-binding/governanceBindingTypes";
import { buildProposalRevocationFixture } from "@/tests/integration/proposal-revocation-engine/helpers";

export function buildProposalGovernanceBindingFixture(
  overrides: Partial<GovernanceBindingInput> = {},
) {
  const revocationFixture = buildProposalRevocationFixture();
  const proposal = revocationFixture.input.proposalIntegrityResult.proposal;
  const replayEpisode = revocationFixture.input.recommendationReplayResult.episodes[0]!;

  const baseInput = Object.freeze({
    bindingRunId: "proposal-governance-binding-run-1",
    evaluatedAt: "2026-05-21T05:00:00.000Z",
    constitutionalVersion: "5.2D",
    governanceVersion: "governance-v1",
    policySnapshotId: replayEpisode.governanceReplay.policySnapshotId,
    authorityBoundary: Object.freeze({
      authorityBoundaryId: `authority-boundary:${proposal.proposalId}`,
      proposalId: proposal.proposalId,
      allowedScopes: Object.freeze(["proposal.review", "proposal.audit"]),
      forbiddenScopes: Object.freeze(["runtime.execute", "runtime.schedule", "runtime.mutate"]),
      executionAllowed: false as const,
      schedulingAllowed: false as const,
      runtimeMutationAllowed: false as const,
      maxAuthorityLevel: "REVIEW_ONLY" as const,
      createdAt: "2026-05-21T05:00:00.000Z",
    }),
    replayContractId: `replay-contract:${replayEpisode.replayId}`,
    validatorVersionSet: Object.freeze({
      validatorVersionSetId: "validator-version-set-v1",
      transitionValidatorVersion: "proposal-state-engine-v1",
      policyValidatorVersion: "proposal-governance-binding-policy-v1",
      authorityValidatorVersion: "proposal-governance-binding-authority-v1",
      approvalValidatorVersion: "proposal-governance-binding-approval-v1",
      replayValidatorVersion: "recommendation-replay-v1",
      freezeValidatorVersion: "proposal-freeze-layer-v1",
      revocationValidatorVersion: "proposal-revocation-engine-v1",
      createdAt: "2026-05-21T05:00:00.000Z",
    }),
    approvalRequirementBinding: Object.freeze({
      approvalRequirementSetId: "approval-requirements-v1",
      requiredApproverRoles: Object.freeze(["operator", "governance"]),
      requiredApprovalCount: 1,
      escalationRequired: false,
      operatorOverrideAllowed: true,
      createdAt: "2026-05-21T05:00:00.000Z",
    }),
    proposalStateEngineInput: revocationFixture.input.proposalStateEngineInput,
    proposalStateEngineResult: revocationFixture.input.proposalStateEngineResult,
    proposalFreezeResult: revocationFixture.input.proposalFreezeResult,
    proposalRevocationResult: revocationFixture.result,
    proposalIntegrityResult: revocationFixture.input.proposalIntegrityResult,
    recommendationReplayResult: revocationFixture.input.recommendationReplayResult,
    constitutionalEnforcementResult: revocationFixture.input.constitutionalEnforcementResult,
    metadata: Object.freeze({
      containmentMode: "governance-binding-only",
    }),
  } satisfies GovernanceBindingInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as GovernanceBindingInput;

  return Object.freeze({
    revocationFixture,
    freezeFixture: revocationFixture.freezeFixture,
    stateFixture: revocationFixture.stateFixture,
    input,
    result: bindProposalGovernance(input),
  });
}
