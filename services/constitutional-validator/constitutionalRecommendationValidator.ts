import type {
  RecommendationAdmissibilityResult,
  RecommendationValidationError,
  RecommendationValidationInput,
  RecommendationValidationLineageEntry,
  RecommendationValidationMetrics,
  RecommendationValidationResult,
} from "./types/recommendationValidationTypes";
import { runRecommendationValidationPipeline } from "./recommendationValidationPipeline";
import { detectValidationDrift } from "./validationDriftDetector";
import { detectValidationGovernanceDrift } from "./governanceDriftDetector";
import { detectValidationReplayDrift } from "./replayDriftDetector";
import { detectApprovalLineageDrift } from "./approvalLineageDriftDetector";
import { detectRecommendationMutation } from "./recommendationMutationDetector";
import { validateRecommendationIsolationBoundary } from "./recommendationIsolationBoundary";
import { validateRecommendationAuthorityFirewall } from "./recommendationAuthorityFirewall";
import { blockRecommendationExecution } from "./recommendationExecutionBlocker";
import { validateRecommendationContainmentBoundary } from "./recommendationContainmentBoundary";
import { decideRecommendationAdmissibility } from "./recommendationAdmissibilityEngine";
import { hashValidationValue } from "./validationHashEngine";
import { hashValidationReplayValue } from "./validationReplayHashEngine";
import { hashValidationAuditValue } from "./validationAuditHashEngine";
import { buildValidationSnapshot } from "./validationSnapshotEngine";
import { appendValidationLedger, appendValidationLineage } from "./immutableValidationLineageLog";
import { generateValidationEvidence } from "./validationEvidenceGenerator";
import { exportRecommendationValidationForensics } from "./recommendationValidationForensics";

function freezeErrors(items: readonly RecommendationValidationError[]): readonly RecommendationValidationError[] {
  return Object.freeze([...items]);
}

function buildMetrics(input: {
  result: RecommendationAdmissibilityResult;
  detections: number;
  errors: readonly RecommendationValidationError[];
}): RecommendationValidationMetrics {
  const metrics = {
    replayDeterminismScore: input.result.replayValidated ? 1 : 0,
    governanceComplianceRate: input.result.governanceValidated ? 1 : 0,
    containmentViolationRate: input.result.containmentValidated ? 0 : 1,
    overridePropagationLatency: input.result.overrideCompatible ? 0 : 1,
    executionSemanticDetectionRate: input.detections > 0 ? 1 : 0,
    escalationTriggerFrequency: input.result.escalationRequired ? 1 : 0,
    admissibilitySuccessRate: input.result.admissibility === "ADMISSIBLE" ? 1 : 0,
    validationDriftFrequency: input.errors.some((error) => error.code.includes("DRIFT")) ? 1 : 0,
    metricsHash: "",
  };
  return Object.freeze({
    ...metrics,
    metricsHash: hashValidationValue("recommendation-validation-metrics", metrics),
  });
}

export function validateConstitutionalRecommendation(
  input: RecommendationValidationInput,
): RecommendationValidationResult {
  const pipeline = runRecommendationValidationPipeline(input);
  const driftErrors = detectValidationDrift(input);
  const governanceDriftErrors = detectValidationGovernanceDrift(input);
  const replayDriftErrors = detectValidationReplayDrift(input);
  const approvalDriftErrors = detectApprovalLineageDrift(input);
  const mutationErrors = detectRecommendationMutation(input);
  const isolationErrors = validateRecommendationIsolationBoundary(input);
  const authorityErrors = validateRecommendationAuthorityFirewall(input);
  const executionErrors = blockRecommendationExecution(input);
  const containmentErrors = validateRecommendationContainmentBoundary(input);
  const errors = freezeErrors([
    ...pipeline.errors,
    ...driftErrors,
    ...governanceDriftErrors,
    ...replayDriftErrors,
    ...approvalDriftErrors,
    ...mutationErrors,
    ...isolationErrors,
    ...authorityErrors,
    ...executionErrors,
    ...containmentErrors,
  ]);

  const executionRiskDetected = pipeline.detections.some((detection) => detection.detected);
  const admissibility = decideRecommendationAdmissibility({
    errors,
    executionRiskDetected,
  });
  const governanceValidated = !errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_GOVERNANCE_INVALID"
    || error.code === "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT");
  const replayValidated = !errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_REPLAY_INVALID"
    || error.code === "RECOMMENDATION_VALIDATION_REPLAY_DRIFT"
    || error.code === "RECOMMENDATION_VALIDATION_SYNTHETIC_ANCESTRY");
  const containmentValidated = !errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID");
  const overrideCompatible = !errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_OVERRIDE_INCOMPATIBLE");
  const escalationRequired = admissibility === "ESCALATED" || admissibility === "DISPUTED";

  const validationHash = hashValidationValue("recommendation-validation-hash", {
    recommendationId: input.recommendationId,
    admissibility,
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    constitutionalViolations: errors.map((error) => error.code),
  });
  const replayHash = hashValidationReplayValue("recommendation-validation-replay", {
    replayId: input.constitutionalReplayResult.record.replayId,
    lineageReplayHash: input.recommendationLineageResult.artifact.replayHash,
    decisionReplayLineage: input.decisionIntentBoundaryResult.artifact.replayLineage,
  });
  const auditHash = hashValidationAuditValue("recommendation-validation-audit", {
    recommendationId: input.recommendationId,
    validationHash,
    replayHash,
    errorCodes: errors.map((error) => error.code),
  });

  const result: RecommendationAdmissibilityResult = Object.freeze({
    recommendationId: input.recommendationId,
    admissibility,
    governanceValidated,
    replayValidated,
    containmentValidated,
    overrideCompatible,
    executionRiskDetected,
    escalationRequired,
    constitutionalViolations: Object.freeze(errors.map((error) => error.code)),
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    validationHash,
    replayHash,
    auditHash,
    deterministicHash: hashValidationValue("recommendation-validation-result", {
      recommendationId: input.recommendationId,
      admissibility,
      validationHash,
      replayHash,
      auditHash,
    }),
    advisoryOnly: true as const,
    executable: false as const,
    executionAuthorized: false as const,
    operatorReviewRequired: true as const,
    validatedAt: input.validatedAt,
  });

  const evidence = generateValidationEvidence({
    validationInput: input,
    reasons: result.constitutionalViolations,
  });
  const snapshot = buildValidationSnapshot(result);
  const lineageEntry: RecommendationValidationLineageEntry = Object.freeze({
    entryId: hashValidationValue("recommendation-validation-lineage-entry-id", {
      recommendationId: input.recommendationId,
      validatedAt: input.validatedAt,
    }),
    recommendationId: input.recommendationId,
    admissibility,
    validatedAt: input.validatedAt,
    deterministicHash: hashValidationValue("recommendation-validation-lineage-entry", {
      recommendationId: input.recommendationId,
      admissibility,
      validationHash,
    }),
  });
  const lineage = appendValidationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditLedger = appendValidationLedger({
    existing: appendValidationLedger({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "recommendation.validation.completed",
        recommendationId: input.recommendationId,
        admissibility,
        validationHash,
        replayHash,
        auditHash,
      }),
      scope: "constitutional-recommendation-validator",
    }),
    payload: Object.freeze({
      event: escalationRequired ? "recommendation.validation.escalated" : "recommendation.validation.finalized",
      recommendationId: input.recommendationId,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
    scope: "constitutional-recommendation-validator-audit",
  });
  const metrics = buildMetrics({
    result,
    detections: pipeline.detections.filter((detection) => detection.detected).length,
    errors,
  });
  const forensics = exportRecommendationValidationForensics({
    recommendationId: input.recommendationId,
    validationHash,
    replayHash,
    auditHash,
    lineageHash: lineage.lineageHash,
  });

  return Object.freeze({
    result,
    stages: pipeline.stages,
    detections: pipeline.detections,
    evidence,
    snapshot,
    lineage,
    auditLedger,
    metrics,
    forensics,
    errors,
    warnings: Object.freeze(escalationRequired
      ? ["Validation escalated operator oversight under uncertainty."]
      : ["Validation remained advisory-only and non-executable."]),
    derivedOnly: true as const,
  });
}

export const buildConstitutionalRecommendationValidator = validateConstitutionalRecommendation;
