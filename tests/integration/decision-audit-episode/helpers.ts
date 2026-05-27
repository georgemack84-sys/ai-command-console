import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";
import { buildHiddenExecutionFixture } from "@/tests/integration/hidden-execution-detection/helpers";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";
import { buildDecisionAuditEpisode } from "@/services/decision-audit-episode/decisionAuditEpisodeEngine";
import type {
  DecisionAuditEpisodeInput,
  DecisionAuditEpisodeLedgerEntry,
  DecisionAuditEpisodeLineageLedger,
} from "@/services/decision-audit-episode/types/decisionAuditEpisodeTypes";

export function buildDecisionAuditEpisodeFixture(
  overrides: Partial<DecisionAuditEpisodeInput> = {},
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
  const replayFixture = buildDeterministicReplayFixture({
    decisionIntentBoundaryResult: validationFixture.input.decisionIntentBoundaryResult,
    recommendationLineageResult: proposalFixture.input.recommendationLineageResult,
    recommendationValidationResult: validationFixture.result,
    operatorAuthorityResult: operatorFixture.result,
    constitutionalReplayResult: validationFixture.input.constitutionalReplayResult,
    humanSupremacyResult: validationFixture.input.humanSupremacyResult,
    constitutionalCertificationResult: validationFixture.input.constitutionalCertificationResult,
    proposalIntegrityResult: proposalFixture.result,
  });
  const hiddenExecutionFixture = buildHiddenExecutionFixture({
    artifactId: validationFixture.result.result.recommendationId,
    artifactType: "recommendation",
    artifact: validationFixture.result.result,
    governanceSnapshotId: validationFixture.result.result.governanceSnapshotId,
    replaySnapshotId: validationFixture.result.result.replaySnapshotId,
    validatorVersion: "validator-v1",
    recommendationLineageHash: proposalFixture.input.recommendationLineageResult.lineage.lineageHash,
    replayHash: replayFixture.result.result.replayHash,
  });

  const baseInput = {
    episodeId: "decision-audit-episode-1",
    createdAt: "2026-05-19T16:00:00.000Z",
    constitutionalVersion: "5.0H",
    validatorVersionId: "validator-v1",
    decisionIntentBoundaryResult: validationFixture.input.decisionIntentBoundaryResult,
    recommendationLineageResult: proposalFixture.input.recommendationLineageResult,
    recommendationValidationResult: validationFixture.result,
    proposalIntegrityResult: proposalFixture.result,
    deterministicReplayResult: replayFixture.result,
    hiddenExecutionDetectionResult: hiddenExecutionFixture.result,
    operatorAuthorityResult: operatorFixture.result,
  } satisfies DecisionAuditEpisodeInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as DecisionAuditEpisodeInput;

  return Object.freeze({
    input,
    result: buildDecisionAuditEpisode({
      ...input,
      existingLineage: overrides.existingLineage as DecisionAuditEpisodeLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly DecisionAuditEpisodeLedgerEntry[] | undefined,
    }),
  });
}
