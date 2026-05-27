import { replayProposal } from "@/services/proposal-replay/proposalReplayEngine";
import type { ProposalReplayInput } from "@/services/proposal-replay/replayTypes";
import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

export function buildProposalReplayFixture(
  overrides: Partial<ProposalReplayInput> = {},
) {
  const governanceFixture = buildProposalGovernanceBindingFixture();

  const baseInput = Object.freeze({
    replayRunId: "proposal-replay-run-1",
    replayedAt: "2026-05-21T06:00:00.000Z",
    constitutionalVersion: "5.2E",
    proposalStateEngineInput: governanceFixture.input.proposalStateEngineInput,
    proposalStateEngineResult: governanceFixture.input.proposalStateEngineResult,
    proposalFreezeResult: governanceFixture.input.proposalFreezeResult,
    proposalRevocationResult: governanceFixture.input.proposalRevocationResult,
    proposalGovernanceBindingResult: governanceFixture.result,
    proposalIntegrityResult: governanceFixture.input.proposalIntegrityResult,
    recommendationReplayResult: governanceFixture.input.recommendationReplayResult,
    constitutionalEnforcementResult: governanceFixture.input.constitutionalEnforcementResult,
    metadata: Object.freeze({
      replayMode: "historical-only",
    }),
  } satisfies ProposalReplayInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalReplayInput;

  return Object.freeze({
    governanceFixture,
    revocationFixture: governanceFixture.revocationFixture,
    freezeFixture: governanceFixture.freezeFixture,
    stateFixture: governanceFixture.stateFixture,
    input,
    result: replayProposal(input),
  });
}
