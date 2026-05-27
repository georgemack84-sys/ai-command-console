import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";
import { buildDeterministicDecisionReplay } from "@/services/deterministic-replay/deterministicReplayEngine";
import type {
  DeterministicReplayInput,
  DeterministicReplayLedgerEntry,
  DeterministicReplayLineageLedger,
} from "@/services/deterministic-replay/types/deterministicReplayTypes";

export function buildDeterministicReplayFixture(
  overrides: Partial<DeterministicReplayInput> = {},
) {
  const validationFixture = buildConstitutionalRecommendationValidationFixture();
  const proposalFixture = buildProposalIntegrityFixture({
    decisionIntentBoundaryResult: validationFixture.input.decisionIntentBoundaryResult,
    constitutionalCertificationResult: validationFixture.input.constitutionalCertificationResult,
    constitutionalReadinessResult: validationFixture.input.constitutionalReadinessResult,
    constitutionalReplayResult: validationFixture.input.constitutionalReplayResult,
    humanSupremacyResult: validationFixture.input.humanSupremacyResult,
    escalationDeterminismResult: validationFixture.input.escalationDeterminismResult,
  });
  const operatorFixture = buildOperatorAuthorityFixture({
    recommendationValidationResult: validationFixture.result,
    constitutionalReplayResult: validationFixture.input.constitutionalReplayResult,
    humanSupremacyResult: validationFixture.input.humanSupremacyResult,
    escalationDeterminismResult: validationFixture.input.escalationDeterminismResult,
  });

  const baseInput = {
    request: {
      replayId: "deterministic-replay-1",
      recommendationId: validationFixture.result.result.recommendationId,
      replaySnapshotId: validationFixture.result.result.replaySnapshotId,
      governanceSnapshotId: validationFixture.result.result.governanceSnapshotId,
      validatorSnapshotIds: ["validator-v1", "operator-authority-validator-v1"],
      policySnapshotIds: [proposalFixture.input.recommendationLineageResult.policyLineage.policySnapshotId],
      approvalDependencyIds: [...proposalFixture.input.recommendationLineageResult.approvalLineage.approvalDependencies],
      evidenceSnapshotIds: [...proposalFixture.input.recommendationLineageResult.artifact.evidenceSnapshotIds],
      scoringSnapshotId: proposalFixture.input.recommendationLineageResult.artifact.scoringSnapshotId,
      confidenceSnapshotId: `confidence:${validationFixture.input.decisionIntentBoundaryResult.artifact.intentId}`,
      suppressionSnapshotIds: [operatorFixture.result.snapshot.snapshotId],
      requestedBy: "operator-1",
      createdAt: "2026-05-19T14:00:00.000Z",
    },
    decisionIntentBoundaryResult: validationFixture.input.decisionIntentBoundaryResult,
    recommendationLineageResult: proposalFixture.input.recommendationLineageResult,
    recommendationValidationResult: validationFixture.result,
    operatorAuthorityResult: operatorFixture.result,
    constitutionalReplayResult: validationFixture.input.constitutionalReplayResult,
    humanSupremacyResult: validationFixture.input.humanSupremacyResult,
    constitutionalCertificationResult: validationFixture.input.constitutionalCertificationResult,
    proposalIntegrityResult: proposalFixture.result,
    deterministicSeed: "deterministic-replay-seed-1",
    validatorVersionId: "validator-v1",
    generatedAt: "2026-05-19T14:01:00.000Z",
  } satisfies DeterministicReplayInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as DeterministicReplayInput;

  return Object.freeze({
    input,
    result: buildDeterministicDecisionReplay({
      ...input,
      existingLineage: overrides.existingLineage as DeterministicReplayLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly DeterministicReplayLedgerEntry[] | undefined,
    }),
  });
}
