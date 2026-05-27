import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";
import { buildProposalIntegrity } from "@/services/proposal-integrity/proposalIntegrityEngine";
import type {
  ProposalIntegrityInput,
  ProposalIntegrityLedgerEntry,
  ProposalIntegrityLineageLedger,
} from "@/services/proposal-integrity/proposalIntegrityStateTypes";

export function buildProposalIntegrityFixture(
  overrides: Partial<ProposalIntegrityInput> = {},
) {
  const recommendationFixture = buildRecommendationLineageFixture();
  const baseInput = {
    proposalId: "proposal-integrity-1",
    proposalType: "bounded_recommendation",
    title: "Operator-reviewed bounded proposal",
    summary: "Summarize a non-executable proposal for operator review and constitutional inspection.",
    scopeBoundaries: Object.freeze([
      { boundaryId: "scope-1", domain: "coordination", description: "bounded coordination analysis", immutable: true as const },
      { boundaryId: "scope-2", domain: "review", description: "operator review only", immutable: true as const },
    ]),
    decisionIntentBoundaryResult: recommendationFixture.input.decisionIntentBoundaryResult,
    recommendationLineageResult: recommendationFixture.result,
    constitutionalCertificationResult: recommendationFixture.input.constitutionalCertificationResult,
    constitutionalReadinessResult: recommendationFixture.input.constitutionalReadinessResult,
    constitutionalReplayResult: recommendationFixture.input.constitutionalReplayResult,
    runtimeAdmissibilityResult: recommendationFixture.input.runtimeAdmissibilityResult,
    humanSupremacyResult: recommendationFixture.input.humanSupremacyResult,
    escalationDeterminismResult: recommendationFixture.input.escalationDeterminismResult,
    deterministicSeed: "proposal-integrity-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T11:00:00.000Z",
  } satisfies ProposalIntegrityInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalIntegrityInput;

  return Object.freeze({
    input,
    result: buildProposalIntegrity({
      ...input,
      existingLineage: overrides.existingLineage as ProposalIntegrityLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly ProposalIntegrityLedgerEntry[] | undefined,
    }),
  });
}
