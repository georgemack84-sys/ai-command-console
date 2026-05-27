import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import { detectPrioritizationAntiEmergence } from "./prioritizationAntiEmergenceDetector";
import { validatePrioritizationContracts } from "./prioritizationContractValidator";
import { orderPrioritiesDeterministically } from "./deterministicPriorityOrderingEngine";
import { PRIORITIZATION_WEIGHTING_VERSION } from "./governanceSeverityWeightingEngine";
import { buildPrioritizationAuditEvent, appendPrioritizationAuditEntry } from "./immutablePrioritizationAuditLog";
import { buildPrioritizationFreezeRecord } from "./prioritizationFailClosedGuard";
import { detectPrioritizationHiddenExecution } from "./prioritizationHiddenExecutionDetector";
import { recordPrioritizationLineage } from "./prioritizationLineageRecorder";
import { bindPrioritizationReplay } from "./prioritizationReplayBinder";
import { validatePrioritizationReplay } from "./prioritizationReplayValidator";
import { rankRecommendationForVisibility } from "./recommendationRankingEngine";
import { serializePrioritizationInput, serializePriority } from "./prioritizationSerializationEngine";
import type {
  RecommendationPrioritizationEngineResult,
  RecommendationPrioritizationInput,
  RecommendationPriority,
  PrioritizationError,
  PrioritizationStageRecord,
} from "./types/prioritizationTypes";

function mapErrors(errors: readonly { message: string; path: string }[], code: PrioritizationError["code"]): PrioritizationError[] {
  return errors.map((error) => ({ code, message: error.message, path: error.path }));
}

function buildStages(errors: readonly PrioritizationError[]): readonly PrioritizationStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "contract_validation",
    "governance_weighting",
    "replay_binding",
    "replay_validation",
    "anti_emergence",
    "hidden_execution",
    "deterministic_ordering",
    "audit",
    "fail_closed",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashRecommendationValue("recommendation-prioritization-stage", { stage, reasons }),
  })));
}

function validateUpstreamReferences(input: RecommendationPrioritizationInput): PrioritizationError[] {
  const errors: PrioritizationError[] = [];
  const constrainedIds = new Set(input.recommendationConstraintResult.constrainedRecommendations.map((item) => item.constrainedRecommendation.recommendationId));
  const confidenceIds = new Set(input.confidenceScoringResult.confidenceScores.map((score) => score.confidenceId));
  const recommendationIds = new Set(input.recommendationSynthesisResult.recommendations.map((item) => item.recommendation.recommendationId));

  for (const candidate of input.inputs) {
    if (!recommendationIds.has(candidate.recommendationId)) {
      errors.push({
        code: "PRIORITIZATION_RECOMMENDATION_HASH_MISMATCH",
        message: "Recommendation was not found in the immutable synthesis result.",
        path: `inputs.${candidate.recommendationId}.recommendationId`,
      });
    }
    if (!constrainedIds.has(candidate.recommendationId)) {
      errors.push({
        code: "PRIORITIZATION_MISSING_CONSTRAINT_EVALUATION",
        message: "Recommendation was not found in the immutable constraint result.",
        path: `inputs.${candidate.recommendationId}.constraintEvaluationId`,
      });
    }
    if (!confidenceIds.has(candidate.confidenceScoreId)) {
      errors.push({
        code: "PRIORITIZATION_MISSING_CONFIDENCE_SCORE",
        message: "Confidence score reference was not found in immutable confidence results.",
        path: `inputs.${candidate.recommendationId}.confidenceScoreId`,
      });
    }
  }

  return errors;
}

export function prioritizeRecommendations(
  input: RecommendationPrioritizationInput,
): RecommendationPrioritizationEngineResult {
  const errors: PrioritizationError[] = [];

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PRIORITIZATION_FAIL_CLOSED",
      message: "Existing prioritization audit ledger chain is invalid.",
      path: "existingAuditLedger",
    });
  }

  errors.push(
    ...validatePrioritizationContracts(input),
    ...validateUpstreamReferences(input),
  );

  if (input.confidenceScoringResult.freeze.frozen) {
    errors.push({
      code: input.confidenceScoringResult.errors.length > 0
        ? "PRIORITIZATION_UPSTREAM_FAILED_CLOSED"
        : "PRIORITIZATION_CONFIDENCE_FROZEN",
      message: "Confidence scoring is frozen or failed closed, so prioritization cannot relax visibility handling.",
      path: "confidenceScoringResult.freeze",
    });
  }
  if (input.recommendationConstraintResult.freeze.frozen) {
    errors.push({
      code: "PRIORITIZATION_UPSTREAM_FAILED_CLOSED",
      message: "Constraint evaluation is frozen and cannot be bypassed by prioritization.",
      path: "recommendationConstraintResult.freeze",
    });
  }

  const priorities = input.inputs.map((candidate) => rankRecommendationForVisibility(candidate));
  const replayRecords = priorities.map((priority) =>
    bindPrioritizationReplay(
      input.inputs.find((candidate) => candidate.recommendationId === priority.recommendationId)!,
      priority,
      {
        weightingVersion: input.weightingVersion || PRIORITIZATION_WEIGHTING_VERSION,
        orderingVersion: input.orderingVersion,
      },
    ));

  for (const candidate of input.inputs) {
    errors.push(...detectPrioritizationHiddenExecution(candidate));
    errors.push(...detectPrioritizationAntiEmergence(candidate));
    if (candidate.upstreamFrozen) {
      errors.push({
        code: "PRIORITIZATION_CONFIDENCE_FROZEN",
        message: "Upstream prioritization input is explicitly frozen.",
        path: `inputs.${candidate.recommendationId}.upstreamFrozen`,
      });
    }
    if (candidate.upstreamFailedClosed) {
      errors.push({
        code: "PRIORITIZATION_UPSTREAM_FAILED_CLOSED",
        message: "Upstream prioritization input is explicitly failed closed.",
        path: `inputs.${candidate.recommendationId}.upstreamFailedClosed`,
      });
    }
    if (candidate.replayIntegrity === "MISMATCH" || candidate.replayIntegrity === "MISSING") {
      errors.push({
        code: "PRIORITIZATION_REPLAY_MISMATCH",
        message: "Replay integrity mismatch or absence must freeze prioritization.",
        path: `inputs.${candidate.recommendationId}.replayIntegrity`,
      });
    }
    if (candidate.validationStatus === "FAILED" || candidate.validationStatus === "MISSING") {
      errors.push({
        code: "PRIORITIZATION_FAIL_CLOSED",
        message: "Missing or failed validation may not be softened by prioritization.",
        path: `inputs.${candidate.recommendationId}.validationStatus`,
      });
    }
  }

  for (const candidate of input.inputs) {
    if (candidate.governanceSeverity === "CRITICAL" && candidate.validationStatus === "MISSING") {
      errors.push({
        code: "PRIORITIZATION_GOVERNANCE_AMBIGUITY",
        message: "Critical governance severity with missing validation must fail closed.",
        path: `inputs.${candidate.recommendationId}.validationStatus`,
      });
    }
  }

  const orderedPriorities = orderPrioritiesDeterministically(input.inputs, priorities);
  const replayValidationErrors = orderedPriorities.flatMap((priority) => {
    const candidate = input.inputs.find((item) => item.recommendationId === priority.recommendationId)!;
    const replayRecord = replayRecords.find((item) => item.recommendationId === priority.recommendationId)!;
    return validatePrioritizationReplay({
      input: candidate,
      priority: {
        ...priority,
        orderingRank: 0,
        deterministicOrderingKey: "",
      },
      replayRecord,
      versions: {
        weightingVersion: input.weightingVersion || PRIORITIZATION_WEIGHTING_VERSION,
        orderingVersion: input.orderingVersion,
      },
    });
  });
  errors.push(...replayValidationErrors);

  const finalPriorities: RecommendationPriority[] = orderedPriorities.map((priority) => {
    const candidate = input.inputs.find((item) => item.recommendationId === priority.recommendationId)!;
    if (candidate.upstreamFailedClosed) {
      return Object.freeze({ ...priority, status: "FAILED_CLOSED" as const });
    }
    if (candidate.upstreamFrozen || errors.some((error) => error.path.includes(candidate.recommendationId))) {
      return Object.freeze({ ...priority, status: "FROZEN" as const });
    }
    return priority;
  });

  const lineageRecords = finalPriorities.map((priority) =>
    recordPrioritizationLineage({
      priorityInput: input.inputs.find((item) => item.recommendationId === priority.recommendationId)!,
      priority,
      sourceConstraintResultHash: input.recommendationConstraintResult.deterministicHash,
      sourceConfidenceResultHash: input.confidenceScoringResult.deterministicHash,
    }));

  const serializationRecords = finalPriorities.map((priority) => serializePriority(priority));

  const auditEvents = finalPriorities.map((priority) => {
    const eventType = priority.status === "FAILED_CLOSED"
      ? "PRIORITIZATION_FAILED_CLOSED"
      : priority.status === "FROZEN"
        ? "PRIORITIZATION_FROZEN"
        : "PRIORITIZATION_COMPLETED";
    return buildPrioritizationAuditEvent({
      prioritizationId: priority.prioritizationId,
      recommendationId: priority.recommendationId,
      eventType,
      timestamp: input.createdAt,
      inputHash: hashRecommendationValue("recommendation-prioritization-input-hash", serializePrioritizationInput(
        input.inputs.find((item) => item.recommendationId === priority.recommendationId)!,
      )),
      outputHash: priority.prioritizationHash,
    });
  });

  const auditLedger = auditEvents.reduce<readonly import("./types/prioritizationTypes").PrioritizationLedgerEntry[]>(
    (ledger, event) => appendPrioritizationAuditEntry({ existing: ledger, event }),
    input.existingAuditLedger ?? [],
  );

  const freeze = buildPrioritizationFreezeRecord(errors);
  const resultStatus = freeze.failedClosed
    ? "FAILED_CLOSED"
    : freeze.frozen
      ? "FROZEN"
      : "COMPLETED";

  const result = Object.freeze({
    prioritizationRunId: input.prioritizationRunId,
    status: resultStatus,
    priorities: [...finalPriorities],
    frozenRecommendationIds: finalPriorities.filter((item) => item.status === "FROZEN").map((item) => item.recommendationId),
    failedClosedRecommendationIds: finalPriorities.filter((item) => item.status === "FAILED_CLOSED").map((item) => item.recommendationId),
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    resultHash: hashRecommendationValue("recommendation-prioritization-result", {
      priorities: finalPriorities.map((priority) => priority.prioritizationHash),
      statuses: finalPriorities.map((priority) => priority.status),
      freezeHash: freeze.freezeHash,
    }),
    auditHash: hashRecommendationValue("recommendation-prioritization-audit", auditEvents.map((event) => event.entryHash)),
  });

  return Object.freeze({
    result,
    replayRecords: Object.freeze(replayRecords),
    lineageRecords: Object.freeze(lineageRecords),
    serializationRecords: Object.freeze(serializationRecords),
    auditEvents: Object.freeze(auditEvents),
    auditLedger: Object.freeze(auditLedger),
    freeze,
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      freeze.frozen
        ? ["Prioritization froze or failed closed under constitutional uncertainty and remained advisory-only."]
        : ["Prioritization completed deterministically and affected operator visibility only."],
    ),
    deterministicHash: hashRecommendationValue("recommendation-prioritization-engine-result", {
      resultHash: result.resultHash,
      replayHashes: replayRecords.map((record) => record.replayRecordHash),
      lineageHashes: lineageRecords.map((record) => record.lineageHash),
      serializationHashes: serializationRecords.map((record) => record.serializationHash),
      auditHashes: auditEvents.map((event) => event.entryHash),
      freezeHash: freeze.freezeHash,
    }),
    derivedOnly: true as const,
  });
}

export const RecommendationPrioritizationEngine = prioritizeRecommendations;
