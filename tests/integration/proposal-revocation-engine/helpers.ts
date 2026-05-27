import { revokeProposal } from "@/services/proposal-revocation-engine/proposalRevocationEngine";
import type { ProposalRevocationInput } from "@/services/proposal-revocation-engine/proposalRevocationTypes";
import { buildProposalFreezeFixture } from "@/tests/integration/proposal-freeze-layer/helpers";

export function buildProposalRevocationFixture(
  overrides: Partial<ProposalRevocationInput> = {},
) {
  const freezeFixture = buildProposalFreezeFixture();
  const proposal = freezeFixture.input.proposalIntegrityResult.proposal;
  const baseInput = Object.freeze({
    revocationRunId: "proposal-revocation-run-1",
    evaluatedAt: "2026-05-21T04:00:00.000Z",
    constitutionalVersion: "5.2C",
    request: Object.freeze({
      proposalId: proposal.proposalId,
      revocationReason: "MANUAL_OPERATOR_REVOCATION" as const,
      requestedBy: "OPERATOR" as const,
      governanceSnapshotId: proposal.governanceSnapshotId,
      replaySnapshotId: proposal.replaySnapshotId,
      auditSnapshotId: freezeFixture.input.proposalStateEngineResult.transitionResult.auditEventId,
      dependencySnapshotId: freezeFixture.input.proposalIntegrityResult.lineageBinding.recommendationLineageHash,
      executionAuthorized: false as const,
    }),
    proposalStateEngineInput: freezeFixture.input.proposalStateEngineInput,
    proposalStateEngineResult: freezeFixture.input.proposalStateEngineResult,
    proposalFreezeResult: freezeFixture.result,
    proposalIntegrityResult: freezeFixture.input.proposalIntegrityResult,
    recommendationReplayResult: freezeFixture.input.recommendationReplayResult,
    constitutionalEnforcementResult: freezeFixture.input.constitutionalEnforcementResult,
    metadata: Object.freeze({
      containmentMode: "revocation-only",
    }),
  } satisfies ProposalRevocationInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalRevocationInput;

  return Object.freeze({
    freezeFixture,
    stateFixture: freezeFixture.stateFixture,
    input,
    result: revokeProposal(input),
  });
}
