import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { classifyConfidence } from "./confidenceClassificationEngine";
import { buildConfidenceFreezeRecord } from "./confidenceFailClosedGuard";
import { appendConfidenceLineage, buildConfidenceLineage } from "./confidenceLineageRecorder";
import { buildConfidenceReplayRecord, bindConfidenceReplayMetadata } from "./confidenceReplayBinder";
import { validateConfidenceReplay } from "./confidenceReplayValidator";
import { buildDeterministicWeights, getFactorWeight } from "./deterministicWeightingEngine";
import { evaluateEvidenceQuality } from "./evidenceQualityEvaluator";
import { buildGovernanceImpact } from "./governanceConfidenceReducer";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import { buildConfidenceAuditRecord, appendConfidenceAuditEntry } from "./immutableConfidenceAuditLog";
import { analyzePolicyStability } from "./policyStabilityAnalyzer";
import { evaluateReplayConsistency } from "./replayConsistencyEvaluator";
import { serializeConfidenceScore } from "./confidenceSerializationEngine";
import { evaluateTelemetryCompleteness } from "./telemetryCompletenessEvaluator";
import { evaluateValidationIntegrity } from "./validationIntegrityEvaluator";
import { correlateRecommendationGovernance } from "@/services/recommendation-synthesis/recommendationGovernanceCorrelator";
import { detectRecommendationHiddenExecution } from "@/services/recommendation-synthesis/recommendationHiddenExecutionDetector";
import { detectRecommendationAntiEmergence } from "@/services/recommendation-synthesis/recommendationAntiEmergenceDetector";
import { validateRecommendationOperatorAuthority } from "@/services/recommendation-synthesis/recommendationOperatorAuthorityValidator";
import type {
  ConfidenceAuditRecord,
  ConfidenceClassificationRecord,
  ConfidenceFactor,
  ConfidenceLineageEntry,
  ConfidenceReplayRecord,
  ConfidenceScore,
  ConfidenceScoringError,
  ConfidenceScoringInput,
  ConfidenceScoringResult,
  ConfidenceScoringStageRecord,
  ConfidenceSerializationRecord,
} from "./types/confidenceScoringTypes";

function freezeErrors(errors: readonly ConfidenceScoringError[]): readonly ConfidenceScoringError[] {
  return Object.freeze([...errors]);
}

function mapErrors(
  errors: readonly { message: string; path: string }[],
  code: ConfidenceScoringError["code"],
): ConfidenceScoringError[] {
  return errors.map((error) => ({
    code,
    message: error.message,
    path: error.path,
  }));
}

function buildStages(errors: readonly ConfidenceScoringError[]): readonly ConfidenceScoringStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "weighting",
    "evidence_quality",
    "replay_consistency",
    "governance_alignment",
    "validation_integrity",
    "policy_stability",
    "telemetry_completeness",
    "classification",
    "serialization",
    "audit",
    "fail_closed",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashRecommendationValue("confidence-scoring-stage", { stage, reasons }),
  })));
}

function applyWeights(factors: readonly ConfidenceFactor[], weightRecord = buildDeterministicWeights()): readonly ConfidenceFactor[] {
  return Object.freeze(factors.map((factor) => Object.freeze({
    ...factor,
    weight: getFactorWeight(weightRecord, factor.factorType),
    deterministicHash: hashRecommendationValue("confidence-scoring-factor", {
      factorId: factor.factorId,
      factorType: factor.factorType,
      score: factor.score,
      weight: getFactorWeight(weightRecord, factor.factorType),
      reason: factor.reason,
    }),
  })));
}

function computeOverallConfidence(factors: readonly ConfidenceFactor[]): number {
  const total = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);
  return Number(total.toFixed(3));
}

export function scoreRecommendationConfidence(
  input: ConfidenceScoringInput,
): ConfidenceScoringResult {
  const errors: ConfidenceScoringError[] = [];

  if (!input.confidenceSessionId) {
    errors.push({
      code: "CONFIDENCE_SCORING_INVALID_INPUT",
      message: "Confidence session ID is required.",
      path: "confidenceSessionId",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "CONFIDENCE_SCORING_IMMUTABLE_AUDIT_FAILURE",
      message: "Existing immutable confidence audit ledger is invalid.",
      path: "existingAuditLedger",
    });
  }
  if (input.evidenceAggregationResult.evidenceReferences.length === 0) {
    errors.push({
      code: "CONFIDENCE_SCORING_MISSING_EVIDENCE",
      message: "Evidence aggregation must provide immutable evidence references.",
      path: "evidenceAggregationResult.evidenceReferences",
    });
  }
  if (input.recommendationConstraintResult.freeze.frozen) {
    errors.push({
      code: "CONFIDENCE_SCORING_VALIDATOR_INCONSISTENCY",
      message: "Recommendation constraint layer is frozen and cannot support confidence visibility.",
      path: "recommendationConstraintResult.freeze.frozen",
    });
  }

  errors.push(
    ...mapErrors(validateConfidenceReplay(input), "CONFIDENCE_SCORING_REPLAY_MISMATCH"),
    ...mapErrors(correlateRecommendationGovernance(input.recommendationSynthesisInput), "CONFIDENCE_SCORING_GOVERNANCE_AMBIGUITY"),
    ...mapErrors(validateRecommendationOperatorAuthority(input.recommendationSynthesisInput), "CONFIDENCE_SCORING_OPERATOR_SUPPRESSED"),
  );

  const confidenceScores: ConfidenceScore[] = [];
  const replayRecords: ConfidenceReplayRecord[] = [];
  const classificationRecords: ConfidenceClassificationRecord[] = [];
  const serializationRecords: ConfidenceSerializationRecord[] = [];
  const auditRecords: ConfidenceAuditRecord[] = [];
  const lineageEntries: ConfidenceLineageEntry[] = [];
  const weightRecord = buildDeterministicWeights();

  for (const constrainedEnvelope of input.recommendationConstraintResult.constrainedRecommendations) {
    const recommendation = constrainedEnvelope.constrainedRecommendation;
    const hiddenExecutionErrors = mapErrors(
      detectRecommendationHiddenExecution({
        synthesisInput: input.recommendationSynthesisInput,
        recommendation,
      }),
      "CONFIDENCE_SCORING_HIDDEN_EXECUTION",
    );
    const antiEmergenceErrors = mapErrors(
      detectRecommendationAntiEmergence({
        synthesisInput: input.recommendationSynthesisInput,
        recommendation,
      }),
      "CONFIDENCE_SCORING_ANTI_EMERGENCE",
    );
    errors.push(...hiddenExecutionErrors, ...antiEmergenceErrors);

    const weightedFactors = applyWeights([
      evaluateEvidenceQuality(input),
      evaluateReplayConsistency(input),
      Object.freeze({
        factorId: `${input.confidenceSessionId}:governance-alignment`,
        factorType: "governance_alignment" as const,
        score: input.recommendationSynthesisInput.recommendationValidationResult.result.governanceValidated ? 1 : 0.2,
        weight: 0,
        reason: input.recommendationSynthesisInput.recommendationValidationResult.result.governanceValidated
          ? "Governance alignment remains stable."
          : "Governance ambiguity reduces confidence and increases caution.",
        deterministicHash: hashRecommendationValue("confidence-scoring-governance-alignment-factor", {
          governanceValidated: input.recommendationSynthesisInput.recommendationValidationResult.result.governanceValidated,
        }),
      }),
      evaluateValidationIntegrity(input),
      analyzePolicyStability(input),
      evaluateTelemetryCompleteness(input),
    ]);

    const overallConfidence = computeOverallConfidence(weightedFactors);
    const classification = classifyConfidence(overallConfidence);
    const governanceImpact = buildGovernanceImpact(
      input,
      weightedFactors.find((factor) => factor.factorType === "governance_alignment")?.score ?? 0,
    );
    const replayMetadata = bindConfidenceReplayMetadata(input);

    const provisionalLineage = Object.freeze({
      lineageId: `${input.confidenceSessionId}:${recommendation.recommendationId}:lineage-placeholder`,
      confidenceId: `${input.confidenceSessionId}:${recommendation.recommendationId}`,
      parentLineageRefs: [] as const,
      evidenceRefs: [] as const,
      lineageHash: "",
    });

    const provisionalScore: ConfidenceScore = Object.freeze({
      confidenceId: `${input.confidenceSessionId}:${recommendation.recommendationId}`,
      recommendationId: recommendation.recommendationId,
      overallConfidence,
      confidenceLevel: classification.confidenceLevel,
      uncertaintyLevel: classification.uncertaintyLevel,
      scoringFactors: [...weightedFactors],
      governanceImpact,
      replayMetadata,
      lineage: provisionalLineage,
      executionAuthorized: false as const,
      operatorDecisionRequired: true as const,
      createdAt: input.createdAt,
    });

    const lineage = buildConfidenceLineage({
      scoringInput: input,
      score: provisionalScore,
    });
    const score: ConfidenceScore = Object.freeze({
      ...provisionalScore,
      lineage,
    });
    const serialization = serializeConfidenceScore(score);
    const replayRecord = buildConfidenceReplayRecord(input);
    const lineageEntry = Object.freeze({
      entryId: `${score.confidenceId}:entry`,
      confidenceId: score.confidenceId,
      recommendationId: score.recommendationId,
      createdAt: input.createdAt,
      deterministicHash: hashRecommendationValue("confidence-scoring-lineage-entry", {
        confidenceId: score.confidenceId,
        recommendationId: score.recommendationId,
        createdAt: input.createdAt,
      }),
    } satisfies ConfidenceLineageEntry);

    if (!replayRecord.replayRestricted) {
      errors.push({
        code: "CONFIDENCE_SCORING_REPLAY_MISMATCH",
        message: "Replay restrictions are not stable for confidence scoring.",
        path: `confidenceScore.${score.confidenceId}.replayMetadata`,
      });
    }
    if (!input.recommendationSynthesisInput.recommendationValidationResult.result.governanceValidated) {
      errors.push({
        code: "CONFIDENCE_SCORING_GOVERNANCE_AMBIGUITY",
        message: "Governance uncertainty must reduce confidence.",
        path: `confidenceScore.${score.confidenceId}.governanceImpact`,
      });
    }
    if (serialization.canonicalForm !== serializeConfidenceScore(score).canonicalForm) {
      errors.push({
        code: "CONFIDENCE_SCORING_SERIALIZATION_INSTABILITY",
        message: "Confidence serialization is unstable.",
        path: `confidenceScore.${score.confidenceId}.serialization`,
      });
    }

    confidenceScores.push(score);
    replayRecords.push(replayRecord);
    classificationRecords.push(classification);
    serializationRecords.push(serialization);
    lineageEntries.push(lineageEntry);
    auditRecords.push(
      buildConfidenceAuditRecord({
        confidenceId: score.confidenceId,
        recommendationId: score.recommendationId,
        event: "confidence.scored",
        governanceSnapshotId: governanceImpact.governanceSnapshotId,
        replaySnapshotId: replayMetadata.replaySnapshotId,
        createdAt: input.createdAt,
      }),
    );
  }

  const lineage = appendConfidenceLineage({
    existing: input.existingLineage,
    entries: lineageEntries,
  });
  const freeze = buildConfidenceFreezeRecord(freezeErrors(errors));

  const auditLedger = auditRecords.reduce<readonly import("./types/confidenceScoringTypes").ConfidenceScoringLedgerEntry[]>(
    (ledger, record) =>
      appendConfidenceAuditEntry({
        existing: ledger,
        payload: Object.freeze(record),
        scope: "confidence-scoring",
      }),
    input.existingAuditLedger ?? [],
  );

  const finalScores = freeze.frozen
    ? Object.freeze(confidenceScores.map((score) =>
        Object.freeze({
          ...score,
          overallConfidence: Number(Math.min(score.overallConfidence, 0.15).toFixed(3)),
          confidenceLevel: "very_low" as const,
          uncertaintyLevel: "critical" as const,
        }),
      ))
    : Object.freeze(confidenceScores);

  return Object.freeze({
    confidenceScores: finalScores,
    replayRecords: Object.freeze(replayRecords),
    weightRecord,
    classificationRecords: Object.freeze(classificationRecords),
    serializationRecords: Object.freeze(serializationRecords),
    lineage,
    auditRecords: Object.freeze(auditRecords),
    auditLedger: Object.freeze(auditLedger),
    freeze,
    stages: buildStages(freezeErrors(errors)),
    errors: freezeErrors(errors),
    warnings: Object.freeze(
      freeze.frozen
        ? ["Confidence scoring froze visibility and amplified caution under constitutional uncertainty."]
        : ["Confidence scoring remained deterministic, non-executing, and operator-subordinate."],
    ),
    deterministicHash: hashRecommendationValue("confidence-scoring-result", {
      confidenceIds: finalScores.map((score) => score.confidenceId),
      confidenceValues: finalScores.map((score) => score.overallConfidence),
      replayRecordHashes: replayRecords.map((record) => record.replayRecordHash),
      lineageHash: lineage.lineageHash,
      auditHashes: auditRecords.map((record) => record.auditHash),
      freezeHash: freeze.freezeHash,
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildConfidenceScoringEngine = scoreRecommendationConfidence;
