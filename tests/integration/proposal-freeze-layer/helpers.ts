import { freezeProposal } from "@/services/proposal-freeze-layer/proposalFreezeEngine";
import type { ProposalFreezeInput } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import { buildProposalStateEngineFixture } from "@/tests/integration/proposal-state-engine/helpers";

export function buildProposalFreezeFixture(
  overrides: Partial<ProposalFreezeInput> = {},
) {
  const stateFixture = buildProposalStateEngineFixture();
  const baseInput = Object.freeze({
    freezeRunId: "proposal-freeze-run-1",
    evaluatedAt: "2026-05-21T03:00:00.000Z",
    constitutionalVersion: "5.2B",
    proposalStateEngineInput: stateFixture.input,
    proposalStateEngineResult: stateFixture.result,
    proposalIntegrityResult: stateFixture.input.proposalIntegrityResult,
    recommendationReplayResult: stateFixture.input.recommendationReplayResult,
    immutableRecommendationLedgerResult: stateFixture.input.immutableRecommendationLedgerResult,
    constitutionalEnforcementResult: stateFixture.input.constitutionalEnforcementResult,
    metadata: Object.freeze({
      containmentMode: "quarantine-only",
    }),
  } satisfies ProposalFreezeInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalFreezeInput;

  return Object.freeze({
    stateFixture,
    constitutionalFixture: stateFixture.constitutionalFixture,
    input,
    result: freezeProposal(input),
  });
}
