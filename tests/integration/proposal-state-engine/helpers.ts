import { evaluateProposalStateTransition } from "@/services/proposal-state-engine/proposalStateEngine";
import type {
  ProposalStateEngineInput,
  ProposalTransitionDeclaration,
} from "@/services/proposal-state-engine/types/proposalStateTypes";
import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

function buildBaseTransition(
  fixture: ReturnType<typeof buildConstitutionalEnforcementFixture>,
  overrides: Partial<ProposalTransitionDeclaration> = {},
): ProposalTransitionDeclaration {
  const proposalIntegrity = fixture.input.replayInput.recommendationSynthesisInput.proposalIntegrityResult;
  return Object.freeze({
    transitionId: "proposal-transition-1",
    proposalId: proposalIntegrity.proposal.proposalId,
    sourceState: "generated" as const,
    targetState: "validated" as const,
    governanceAuthorityId: "governance-authority-1",
    governanceSnapshotId: proposalIntegrity.proposal.governanceSnapshotId,
    replayLineageId: fixture.input.replayResult.lineageRecords[0]!.lineageHash,
    approvalLineageId: proposalIntegrity.approvalBinding.approvalHash,
    dependencyLineageId: proposalIntegrity.lineageBinding.recommendationLineageHash,
    auditLineageId: fixture.input.immutableLedgerResult.events[0]!.lineageHash,
    requestedBy: "operator" as const,
    requestedAt: "2026-05-21T02:00:00.000Z",
    reason: "Operator validated deterministic proposal state for governance review.",
    ...overrides,
  });
}

export function buildProposalStateEngineFixture(
  overrides: Partial<ProposalStateEngineInput> = {},
) {
  const constitutionalFixture = buildConstitutionalEnforcementFixture();
  const proposalIntegrityResult = constitutionalFixture.input.replayInput.recommendationSynthesisInput.proposalIntegrityResult;
  const transition = buildBaseTransition(constitutionalFixture, overrides.transition);

  const baseInput = Object.freeze({
    stateEngineRunId: "proposal-state-engine-run-1",
    evaluatedAt: "2026-05-21T02:00:00.000Z",
    constitutionalVersion: "5.2A",
    governancePolicyVersion: "governance-policy-v1",
    constitutionalRuleSetVersion: "proposal-state-rules-v1",
    currentState: "generated" as const,
    transition,
    proposalIntegrityResult,
    recommendationReplayResult: constitutionalFixture.input.replayResult,
    immutableRecommendationLedgerResult: constitutionalFixture.input.immutableLedgerResult,
    constitutionalEnforcementResult: constitutionalFixture.result,
  } satisfies ProposalStateEngineInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalStateEngineInput;

  return Object.freeze({
    constitutionalFixture,
    input,
    result: evaluateProposalStateTransition(input),
  });
}
