import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { certifyDecisionReadiness } from "@/services/decision-readiness-certification/decisionReadinessCertificationEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessCertificationLedgerEntry,
  DecisionReadinessCertificationLineageLedger,
} from "@/services/decision-readiness-certification/types/decisionReadinessCertificationTypes";

export function buildDecisionReadinessCertificationFixture(
  overrides: Partial<DecisionReadinessCertificationInput> = {},
) {
  const transitionFixture = buildConstitutionalTransitionFixture();
  const episodeInput = transitionFixture.input;
  const proposalIntegrityResult = episodeInput.proposalIntegrityResult!;
  const readinessValidationResult = Object.freeze({
    ...episodeInput.recommendationValidationResult,
    result: Object.freeze({
      ...episodeInput.recommendationValidationResult.result,
      containmentValidated: true,
      executionRiskDetected: false,
    }),
  });
  const baseInput = {
    certificationId: "decision-readiness-certification-1",
    recommendationSystemId: episodeInput.recommendationValidationResult.result.recommendationId,
    certifiedAt: "2026-05-20T16:30:00.000Z",
    constitutionalVersion: "5.0J",
    validatorVersionId: "validator-v1",
    deterministicReplayResult: episodeInput.deterministicReplayResult,
    decisionAuditEpisodeResult: episodeInput.decisionAuditEpisodeResult,
    hiddenExecutionDetectionResult: episodeInput.hiddenExecutionDetectionResult,
    operatorAuthorityResult: episodeInput.operatorAuthorityResult,
    constitutionalTransitionResult: transitionFixture.result,
    recommendationValidationResult: readinessValidationResult,
    proposalIntegrityResult,
  } satisfies DecisionReadinessCertificationInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
    deterministicReplayResult: overrides.deterministicReplayResult ?? baseInput.deterministicReplayResult,
    decisionAuditEpisodeResult: overrides.decisionAuditEpisodeResult ?? baseInput.decisionAuditEpisodeResult,
    hiddenExecutionDetectionResult: overrides.hiddenExecutionDetectionResult ?? baseInput.hiddenExecutionDetectionResult,
    operatorAuthorityResult: overrides.operatorAuthorityResult ?? baseInput.operatorAuthorityResult,
    constitutionalTransitionResult: overrides.constitutionalTransitionResult ?? baseInput.constitutionalTransitionResult,
    recommendationValidationResult: overrides.recommendationValidationResult ?? baseInput.recommendationValidationResult,
    proposalIntegrityResult: overrides.proposalIntegrityResult ?? proposalIntegrityResult,
  }) as DecisionReadinessCertificationInput;

  return Object.freeze({
    input,
    result: certifyDecisionReadiness({
      ...input,
      existingLineage: overrides.existingLineage as DecisionReadinessCertificationLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly DecisionReadinessCertificationLedgerEntry[] | undefined,
    }),
  });
}
