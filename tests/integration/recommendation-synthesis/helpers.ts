import { certifyDecisionReadiness } from "@/services/decision-readiness-certification/decisionReadinessCertificationEngine";
import { synthesizeRecommendations } from "@/services/recommendation-synthesis/recommendationSynthesisEngine";
import type {
  RecommendationAuditLedgerEntry,
  RecommendationSynthesisInput,
  RecommendationSynthesisLineageLedger,
} from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

export function buildRecommendationSynthesisFixture(
  overrides: Partial<RecommendationSynthesisInput> = {},
) {
  const readinessFixture = buildDecisionReadinessCertificationFixture();
  const readinessResult = certifyDecisionReadiness(readinessFixture.input);
  const synthesisValidationResult = Object.freeze({
    ...readinessFixture.input.recommendationValidationResult,
    result: Object.freeze({
      ...readinessFixture.input.recommendationValidationResult.result,
      admissibility: "ADMISSIBLE" as const,
      containmentValidated: true,
      governanceValidated: true,
      replayValidated: true,
      executionRiskDetected: false,
    }),
  });
  const baseInput = {
    synthesisId: "recommendation-synthesis-1",
    recommendationSystemId: readinessFixture.input.recommendationSystemId,
    createdAt: "2026-05-20T18:00:00.000Z",
    constitutionalVersion: "5.1A",
    validatorVersionId: "recommendation-synthesis-validator-v1",
    deterministicSeed: "recommendation-synthesis-seed-1",
    telemetry: Object.freeze([
      {
        telemetryId: "telemetry-1",
        signalType: "stability" as const,
        signalName: "replay_certification_state",
        signalValue: "stable",
        source: "deterministic-replay",
      },
      {
        telemetryId: "telemetry-2",
        signalType: "governance" as const,
        signalName: "governance_lineage_state",
        signalValue: "verified",
        source: "decision-readiness-certification",
      },
    ]),
    evidenceBundleRefs: Object.freeze([
      readinessResult.evidence.evidenceId,
      readinessFixture.input.deterministicReplayResult.evidenceBundle.bundleId,
      readinessFixture.input.proposalIntegrityResult.evidence.evidenceId,
    ]),
    policySnapshotIds: Object.freeze([
      readinessFixture.input.constitutionalTransitionResult.transition.policySnapshotId,
      readinessFixture.input.proposalIntegrityResult.governanceBinding.policyHash,
    ]),
    integrityStateId: readinessFixture.input.proposalIntegrityResult.deterministicHash,
    decisionReadinessCertificationResult: readinessResult,
    deterministicReplayResult: readinessFixture.input.deterministicReplayResult,
    decisionAuditEpisodeResult: readinessFixture.input.decisionAuditEpisodeResult,
    hiddenExecutionDetectionResult: readinessFixture.input.hiddenExecutionDetectionResult,
    operatorAuthorityResult: readinessFixture.input.operatorAuthorityResult,
    constitutionalTransitionResult: readinessFixture.input.constitutionalTransitionResult,
    recommendationValidationResult: synthesisValidationResult,
    proposalIntegrityResult: readinessFixture.input.proposalIntegrityResult,
  } satisfies RecommendationSynthesisInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationSynthesisInput;

  return Object.freeze({
    input,
    result: synthesizeRecommendations({
      ...input,
      existingLineage: overrides.existingLineage as RecommendationSynthesisLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly RecommendationAuditLedgerEntry[] | undefined,
    }),
  });
}
