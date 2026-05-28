import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { buildRecommendationFreeze } from "@/services/recommendation-synthesis/recommendationFreezeEngine";
import { detectRecommendationAntiEmergence } from "@/services/recommendation-synthesis/recommendationAntiEmergenceDetector";
import { detectRecommendationHiddenExecution } from "@/services/recommendation-synthesis/recommendationHiddenExecutionDetector";
import { correlateRecommendationGovernance } from "@/services/recommendation-synthesis/recommendationGovernanceCorrelator";
import { validateRecommendationOperatorAuthority } from "@/services/recommendation-synthesis/recommendationOperatorAuthorityValidator";
import { auditRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayAuditor";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import { buildDeterministicConstraintPipeline } from "./deterministicConstraintPipeline";
import { appendConstraintAuditLedgerEntry, buildConstraintAuditId } from "./immutableConstraintAuditLog";
import { sanitizeRecommendation } from "./recommendationSanitizationEngine";
import type {
  ConstrainedRecommendationEnvelope,
  ConstraintAuditRecord,
  RecommendationAuthorityConstraintRecord,
  RecommendationConstraintError,
  RecommendationConstraintInput,
  RecommendationConstraintLedgerEntry,
  RecommendationConstraintResult,
  RecommendationConstraintStageRecord,
  RecommendationContainmentRecord,
  RecommendationGovernanceConstraintRecord,
  RecommendationReplayConstraintRecord,
  RecommendationScopeConstraintRecord,
} from "./types/recommendationConstraintTypes";

function mapErrors(errors: readonly { message: string; path: string }[], code: RecommendationConstraintError["code"]): RecommendationConstraintError[] {
  return errors.map((error) => ({
    code,
    message: error.message,
    path: error.path,
  }));
}

function buildAuditRecord(input: {
  recommendationId: string;
  phase: string;
  type: ConstraintAuditRecord["constraintType"];
  result: ConstraintAuditRecord["evaluationResult"];
  constraintInput: RecommendationConstraintInput;
  evidenceReferences: readonly string[];
}): ConstraintAuditRecord {
  return Object.freeze({
    auditId: `${input.recommendationId}:${input.phase}:${input.type}`,
    recommendationId: input.recommendationId,
    constraintPhase: input.phase,
    constraintType: input.type,
    evaluationResult: input.result,
    governanceSnapshotId: input.constraintInput.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    policySnapshotId: input.constraintInput.recommendationSynthesisInput.policySnapshotIds[0] ?? "",
    replaySnapshotId: input.constraintInput.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
    evidenceReferences: [...input.evidenceReferences],
    createdAt: input.constraintInput.constrainedAt,
  });
}

function buildStages(errors: readonly RecommendationConstraintError[]): readonly RecommendationConstraintStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze(buildDeterministicConstraintPipeline().map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashRecommendationValue("recommendation-constraint-stage", { stage, reasons }),
  })));
}

export function constrainRecommendations(
  input: RecommendationConstraintInput,
): RecommendationConstraintResult {
  const inputErrors: RecommendationConstraintError[] = [];
  if (!input.constraintSessionId) {
    inputErrors.push({
      code: "RECOMMENDATION_CONSTRAINT_INVALID_INPUT",
      message: "Constraint session ID is required.",
      path: "constraintSessionId",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    inputErrors.push({
      code: "RECOMMENDATION_CONSTRAINT_MISSING_LINEAGE",
      message: "Existing constraint audit ledger chain is invalid.",
      path: "existingAuditLedger",
    });
  }

  const scopeRecords: RecommendationScopeConstraintRecord[] = [];
  const governanceRecords: RecommendationGovernanceConstraintRecord[] = [];
  const authorityRecords: RecommendationAuthorityConstraintRecord[] = [];
  const replayRecords: RecommendationReplayConstraintRecord[] = [];
  const containmentRecords: RecommendationContainmentRecord[] = [];
  const auditRecords: ConstraintAuditRecord[] = [];
  const constrainedRecommendations: ConstrainedRecommendationEnvelope[] = [];
  const errors: RecommendationConstraintError[] = [...inputErrors];

  for (const envelope of input.recommendationSynthesisResult.recommendations) {
    const recommendation = envelope.recommendation;
    const recommendationErrors: RecommendationConstraintError[] = [];

    const scopeRecord = Object.freeze({
      recommendationId: recommendation.recommendationId,
      scopeCeilingRespected: recommendation.evidenceReferences.length <= input.evidenceAggregationResult.evidenceReferences.length,
      approvalCeilingRespected: recommendation.approvalRequired === (input.recommendationSynthesisInput.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0),
      escalationCeilingRespected: recommendation.escalationAllowed === (input.recommendationSynthesisInput.operatorAuthorityResult.action.actionType === "OVERRIDE"),
      constraintHash: hashRecommendationValue("recommendation-constraint-scope", {
        recommendationId: recommendation.recommendationId,
        evidenceReferenceCount: recommendation.evidenceReferences.length,
        approvalRequired: recommendation.approvalRequired,
        escalationAllowed: recommendation.escalationAllowed,
      }),
    } satisfies RecommendationScopeConstraintRecord);
    if (!scopeRecord.scopeCeilingRespected || !scopeRecord.approvalCeilingRespected) {
      recommendationErrors.push({
        code: "RECOMMENDATION_CONSTRAINT_SCOPE_CEILING_EXCEEDED",
        message: "Recommendation exceeded declared scope or approval ceiling.",
        path: `recommendation.${recommendation.recommendationId}`,
      });
    }
    if (!scopeRecord.escalationCeilingRespected) {
      recommendationErrors.push({
        code: "RECOMMENDATION_CONSTRAINT_ESCALATION_OVERFLOW",
        message: "Recommendation exceeded the escalation ceiling.",
        path: `recommendation.${recommendation.recommendationId}.escalationAllowed`,
      });
    }
    scopeRecords.push(scopeRecord);

    const governanceErrors = mapErrors(
      correlateRecommendationGovernance(input.recommendationSynthesisInput),
      "RECOMMENDATION_CONSTRAINT_GOVERNANCE_AMBIGUITY",
    );
    recommendationErrors.push(...governanceErrors);
    governanceRecords.push(Object.freeze({
      recommendationId: recommendation.recommendationId,
      governanceSnapshotId: input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
      policySnapshotId: input.recommendationSynthesisInput.policySnapshotIds[0] ?? "",
      governanceBound: governanceErrors.length === 0,
      constraintHash: hashRecommendationValue("recommendation-constraint-governance", {
        recommendationId: recommendation.recommendationId,
        governanceSnapshotId: input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
        policySnapshotId: input.recommendationSynthesisInput.policySnapshotIds[0] ?? "",
      }),
    }));

    const authorityErrors = mapErrors(
      validateRecommendationOperatorAuthority(input.recommendationSynthesisInput),
      "RECOMMENDATION_CONSTRAINT_AUTHORITY_AMBIGUITY",
    );
    recommendationErrors.push(...authorityErrors);
    authorityRecords.push(Object.freeze({
      recommendationId: recommendation.recommendationId,
      operatorSupremacyPreserved: authorityErrors.length === 0,
      authorityExpansionDetected: recommendation.escalationAllowed && input.recommendationSynthesisInput.operatorAuthorityResult.action.actionType !== "OVERRIDE",
      constraintHash: hashRecommendationValue("recommendation-constraint-authority", {
        recommendationId: recommendation.recommendationId,
        actionType: input.recommendationSynthesisInput.operatorAuthorityResult.action.actionType,
        escalationAllowed: recommendation.escalationAllowed,
      }),
    }));
    if (authorityRecords.at(-1)?.authorityExpansionDetected) {
      recommendationErrors.push({
        code: "RECOMMENDATION_CONSTRAINT_AUTHORITY_AMBIGUITY",
        message: "Recommendation implies unauthorized escalation authority.",
        path: `recommendation.${recommendation.recommendationId}.escalationAllowed`,
      });
    }

    const replayErrors = mapErrors(
      auditRecommendationReplay(input.recommendationSynthesisInput),
      "RECOMMENDATION_CONSTRAINT_REPLAY_MISMATCH",
    );
    recommendationErrors.push(...replayErrors);
    replayRecords.push(Object.freeze({
      recommendationId: recommendation.recommendationId,
      replaySnapshotId: input.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
      replayHash: input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
      replayRestricted: replayErrors.length === 0,
      constraintHash: hashRecommendationValue("recommendation-constraint-replay", {
        recommendationId: recommendation.recommendationId,
        replaySnapshotId: input.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
        replayHash: input.recommendationSynthesisInput.deterministicReplayResult.result.replayHash,
      }),
    }));

    const hiddenExecutionErrors = mapErrors(
      detectRecommendationHiddenExecution({
        synthesisInput: input.recommendationSynthesisInput,
        recommendation,
      }),
      "RECOMMENDATION_CONSTRAINT_EXECUTION_SEMANTIC",
    );
    const antiEmergenceErrors = mapErrors(
      detectRecommendationAntiEmergence({
        synthesisInput: input.recommendationSynthesisInput,
        recommendation,
      }),
      "RECOMMENDATION_CONSTRAINT_HIDDEN_ORCHESTRATION",
    );
    recommendationErrors.push(...hiddenExecutionErrors, ...antiEmergenceErrors);
    const haystack = `${recommendation.summary} ${recommendation.rationale}`.toLowerCase();
    if (haystack.includes("schedule")) {
      recommendationErrors.push({
        code: "RECOMMENDATION_CONSTRAINT_SCHEDULING_SEMANTIC",
        message: "Scheduling semantics are forbidden in constrained recommendations.",
        path: `recommendation.${recommendation.recommendationId}`,
      });
    }
    containmentRecords.push(Object.freeze({
      recommendationId: recommendation.recommendationId,
      hiddenExecutionBlocked: hiddenExecutionErrors.length === 0,
      orchestrationBlocked: antiEmergenceErrors.length === 0,
      schedulingBlocked: !haystack.includes("schedule"),
      containmentHash: hashRecommendationValue("recommendation-constraint-containment", {
        recommendationId: recommendation.recommendationId,
        hiddenExecutionBlocked: hiddenExecutionErrors.length === 0,
        orchestrationBlocked: antiEmergenceErrors.length === 0,
        schedulingBlocked: !haystack.includes("schedule"),
      }),
    }));

    const { recommendation: sanitizedRecommendation, record: sanitizationRecord } = sanitizeRecommendation({
      recommendation,
    });

    const localAuditRecords = [
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "scope_ceiling_enforcement",
        type: "scope",
        result: recommendationErrors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_SCOPE_CEILING_EXCEEDED") ? "blocked" : "allowed",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "governance_boundary_enforcement",
        type: "governance",
        result: governanceErrors.length === 0 ? "allowed" : "frozen",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "authority_restriction_enforcement",
        type: "authority",
        result: authorityErrors.length === 0 ? "allowed" : "blocked",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "escalation_ceiling_enforcement",
        type: "escalation",
        result: recommendationErrors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_ESCALATION_OVERFLOW") ? "restricted" : "allowed",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "replay_restriction_enforcement",
        type: "replay",
        result: replayErrors.length === 0 ? "allowed" : "frozen",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "operational_containment_enforcement",
        type: "containment",
        result: hiddenExecutionErrors.length === 0 && antiEmergenceErrors.length === 0 ? "allowed" : "blocked",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
      buildAuditRecord({
        recommendationId: recommendation.recommendationId,
        phase: "recommendation_sanitization",
        type: "sanitization",
        result: sanitizationRecord.sanitized ? "sanitized" : "allowed",
        constraintInput: input,
        evidenceReferences: recommendation.evidenceReferences,
      }),
    ];
    auditRecords.push(...localAuditRecords);

    if (recommendationErrors.length === 0) {
      constrainedRecommendations.push(Object.freeze({
        originalEnvelopeHash: envelope.envelopeHash,
        constrainedRecommendation: sanitizedRecommendation,
        sanitizationRecord,
        constraintAuditIds: Object.freeze(localAuditRecords.map((record) => buildConstraintAuditId(record))),
        constraintHash: hashRecommendationValue("recommendation-constraint-envelope", {
          originalEnvelopeHash: envelope.envelopeHash,
          sanitizationHash: sanitizationRecord.sanitizationHash,
          auditIds: localAuditRecords.map((record) => buildConstraintAuditId(record)),
        }),
        executionAuthorized: false as const,
      }));
    }

    errors.push(...recommendationErrors);
  }

  if (input.evidenceAggregationResult.freeze.frozen) {
    errors.push({
      code: "RECOMMENDATION_CONSTRAINT_CONSTRAINT_CORRUPTION",
      message: "Evidence aggregation is frozen and cannot support recommendation constraint evaluation.",
      path: "evidenceAggregationResult.freeze.frozen",
    });
  }

  const freezeFromConstraintErrors = buildRecommendationFreeze(
    errors.map((error) => ({
      code: "RECOMMENDATION_SYNTHESIS_FAIL_CLOSED" as const,
      message: error.message,
      path: error.path,
    })),
  );

  const auditLedger = auditRecords.reduce<readonly RecommendationConstraintLedgerEntry[]>(
    (ledger, record) =>
      appendConstraintAuditLedgerEntry({
        existing: ledger,
        payload: Object.freeze(record),
        scope: "recommendation-constraint",
      }),
    input.existingAuditLedger ?? [],
  );

  return Object.freeze({
    constrainedRecommendations:
      freezeFromConstraintErrors.frozen ? Object.freeze([]) : Object.freeze(constrainedRecommendations),
    scopeRecords: Object.freeze(scopeRecords),
    governanceRecords: Object.freeze(governanceRecords),
    authorityRecords: Object.freeze(authorityRecords),
    replayRecords: Object.freeze(replayRecords),
    containmentRecords: Object.freeze(containmentRecords),
    auditRecords: Object.freeze(auditRecords),
    freeze: Object.freeze({
      frozen: freezeFromConstraintErrors.frozen,
      blocked: errors.some((error) =>
        error.code === "RECOMMENDATION_CONSTRAINT_EXECUTION_SEMANTIC"
        || error.code === "RECOMMENDATION_CONSTRAINT_HIDDEN_ORCHESTRATION"
        || error.code === "RECOMMENDATION_CONSTRAINT_AUTHORITY_AMBIGUITY"
        || error.code === "RECOMMENDATION_CONSTRAINT_SCHEDULING_SEMANTIC",
      ),
      restricted: errors.some((error) => error.code === "RECOMMENDATION_CONSTRAINT_ESCALATION_OVERFLOW"),
      reasons: Object.freeze(errors.map((error) => error.code)),
      freezeHash: hashRecommendationValue("recommendation-constraint-freeze", {
        reasons: errors.map((error) => error.code),
        frozen: freezeFromConstraintErrors.frozen,
      }),
    }),
    auditLedger: Object.freeze(auditLedger),
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      errors.length > 0
        ? ["Recommendation constraint evaluation froze or blocked unsafe outputs."]
        : ["Recommendation constraint evaluation remained deterministic and non-executing."],
    ),
    deterministicHash: hashRecommendationValue("recommendation-constraint-result", {
      constrainedRecommendationHashes: constrainedRecommendations.map((item) => item.constraintHash),
      auditHashes: auditRecords.map((record) => record.auditId),
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildRecommendationConstraintEngine = constrainRecommendations;
