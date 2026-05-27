import { scoreDeterministicConfidence } from "@/services/confidence-engine/deterministicConfidenceEngine";
import type { DeterministicConfidenceInput } from "@/services/confidence-engine/types/confidenceTypes";
import { buildProposalApprovalBindingFixture } from "@/tests/integration/proposal-approval-binding/helpers";

export function buildDeterministicConfidenceFixture(
  overrides: Partial<DeterministicConfidenceInput> = {},
) {
  const approvalFixture = buildProposalApprovalBindingFixture();

  const baseInput = Object.freeze({
    confidenceRunId: "deterministic-confidence-run-1",
    generatedAt: "2026-05-21T08:00:00.000Z",
    constitutionalVersion: "5.3A",
    scoringModelVersion: "deterministic-confidence-model-v1",
    normalizationVersion: "confidence-normalization-v1",
    weightTableVersion: "confidence-weight-table-v1",
    proposalStateEngineResult: approvalFixture.input.proposalStateEngineResult,
    proposalFreezeResult: Object.freeze({
      ...approvalFixture.input.proposalFreezeResult,
      status: "ACTIVE" as const,
    }),
    proposalRevocationResult: approvalFixture.input.proposalRevocationResult,
    proposalGovernanceBindingResult: Object.freeze({
      ...approvalFixture.input.proposalGovernanceBindingResult,
      status: "BOUND" as const,
      binding: Object.freeze({
        ...approvalFixture.input.proposalGovernanceBindingResult.binding,
        bindingStatus: "BOUND" as const,
      }),
    }),
    proposalReplayResult: Object.freeze({
      ...approvalFixture.input.proposalReplayResult,
      status: "COMPLETED" as const,
      replay: Object.freeze({
        ...approvalFixture.input.proposalReplayResult.replay,
        deterministic: true as const,
      }),
      certification: Object.freeze({
        ...approvalFixture.input.proposalReplayResult.certification,
        certified: true,
      }),
    }),
    proposalApprovalBindingResult: approvalFixture.result,
    proposalIntegrityResult: Object.freeze({
      ...approvalFixture.input.proposalIntegrityResult,
      status: "replay_verified" as const,
    }),
    constitutionalEnforcementResult: approvalFixture.input.constitutionalEnforcementResult,
    recommendationId: approvalFixture.input.constitutionalEnforcementResult.verdict.recommendationId,
    metadata: Object.freeze({
      confidenceMode: "deterministic-only",
    }),
  } satisfies DeterministicConfidenceInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as DeterministicConfidenceInput;

  return Object.freeze({
    approvalFixture,
    replayFixture: approvalFixture.replayFixture,
    governanceFixture: approvalFixture.governanceFixture,
    input,
    result: scoreDeterministicConfidence(input),
  });
}
