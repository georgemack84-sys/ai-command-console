import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { detectRecommendationAntiEmergence } from "./recommendationAntiEmergenceDetector";
import { appendRecommendationAuditEntry, appendRecommendationLineage } from "./recommendationAppendOnlyLedger";
import { correlateRecommendationCertification } from "./recommendationCertificationCorrelator";
import { validateRecommendationApprovalDependencies } from "./recommendationApprovalDependencyValidator";
import { buildRecommendationConstraintBoundary } from "./recommendationConstraintBoundaryEngine";
import { validateRecommendationConstraints } from "./recommendationConstraintValidator";
import { validateRecommendationConstitutionalBoundaries } from "./recommendationConstitutionalValidator";
import { deriveRecommendationConfidence } from "./recommendationConfidenceEngine";
import { validateRecommendationConfidenceDeterminism } from "./recommendationConfidenceDeterminismValidator";
import { validateRecommendationContainment } from "./recommendationContainmentValidator";
import { validateRecommendationDeterminism } from "./recommendationDeterminismValidator";
import { orderRecommendationsDeterministically } from "./recommendationDeterministicOrderingEngine";
import { detectRecommendationDrift } from "./recommendationDriftDetector";
import { correlateRecommendationEvidence } from "./recommendationEvidenceCorrelator";
import { shouldRecommendationFailClosed } from "./recommendationFailClosedController";
import { buildRecommendationFreeze } from "./recommendationFreezeEngine";
import { bindRecommendationGovernance } from "./recommendationGovernanceBinder";
import { correlateRecommendationGovernance } from "./recommendationGovernanceCorrelator";
import { hashRecommendationValue } from "./recommendationHashEngine";
import { detectRecommendationHiddenExecution } from "./recommendationHiddenExecutionDetector";
import { bindRecommendationImmutableAudit } from "./recommendationImmutableAuditBinder";
import { validateRecommendationIntegrity } from "./recommendationIntegrityValidator";
import { buildRecommendationLineageEntry } from "./recommendationLineageEngine";
import { validateRecommendationLifecycle } from "./recommendationLifecycleEngine";
import { validateRecommendationOperatorAuthority } from "./recommendationOperatorAuthorityValidator";
import { validateRecommendationOutput } from "./recommendationOutputValidator";
import { bindRecommendationPolicy } from "./recommendationPolicyBinder";
import { generateRecommendationRationale } from "./recommendationRationaleGenerator";
import { validateRecommendationRationaleDeterminism } from "./recommendationRationaleDeterminismValidator";
import { auditRecommendationReplay } from "./recommendationReplayAuditor";
import { bindRecommendationReplay } from "./recommendationReplayBinder";
import { reconstructRecommendationReplay } from "./recommendationReplayReconstructor";
import { serializeRecommendationEnvelope } from "./recommendationSerializationEngine";
import { validateRecommendationSerialization } from "./recommendationSerializationValidator";
import { emitRecommendationTelemetry } from "./recommendationTelemetryEmitter";
import { validateRecommendationTransition } from "./recommendationTransitionValidator";
import { correlateRecommendationValidation } from "./recommendationValidationCorrelator";
import { bindRecommendationVersion } from "./recommendationVersionBinder";
import type {
  Recommendation,
  RecommendationAuditRecord,
  RecommendationEnvelope,
  RecommendationIntegrityRecord,
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
  RecommendationSynthesisResult,
  RecommendationSynthesisStageRecord,
} from "./types/recommendationSynthesisTypes";

function createRecommendation(input: {
  synthesisInput: RecommendationSynthesisInput;
  evidenceReferences: readonly string[];
  governanceBindingIds: readonly string[];
  confidenceScore: number;
  escalationAllowed: boolean;
  approvalRequired: boolean;
  constraintProfileId: string;
}): Recommendation {
  const proposal = input.synthesisInput.proposalIntegrityResult.proposal;
  const category: Recommendation["category"] =
    proposal.riskClassification.toLowerCase().includes("high")
      ? "risk"
      : input.approvalRequired
        ? "approval"
        : "stability";
  const recommendationType =
    category === "risk"
      ? "bounded_risk_review"
      : category === "approval"
        ? "bounded_approval_review"
        : "bounded_stability_review";
  const summary =
    category === "risk"
      ? `Review risk-bound proposal ${proposal.proposalId} under certified governance before any operator decision.`
      : category === "approval"
        ? `Review approval-bound proposal ${proposal.proposalId} using replay-certified evidence and operator oversight.`
        : `Maintain certified stability posture for proposal ${proposal.proposalId} under governance-bound review.`;
  const rationale = [
    `Replay snapshot ${input.synthesisInput.deterministicReplayResult.snapshot.snapshotId} remains certified and deterministic.`,
    `Governance snapshot ${input.synthesisInput.recommendationValidationResult.result.governanceSnapshotId} remains authoritative.`,
    `Proposal lineage ${input.synthesisInput.proposalIntegrityResult.lineage.lineageHash} remains immutable.`,
    `Operator authority stays supreme and this recommendation remains advisory-only.`,
  ].join(" ");

  return Object.freeze({
    recommendationId: `${input.synthesisInput.synthesisId}:recommendation`,
    category,
    recommendationType,
    summary,
    rationale,
    confidenceScore: input.confidenceScore,
    evidenceReferences: [...input.evidenceReferences],
    governanceBindings: [...input.governanceBindingIds],
    replaySnapshotId: input.synthesisInput.deterministicReplayResult.snapshot.snapshotId,
    constraintProfileId: input.constraintProfileId,
    escalationAllowed: input.escalationAllowed,
    approvalRequired: input.approvalRequired,
    createdAt: input.synthesisInput.createdAt,
    executionAuthorized: false as const,
  });
}

function buildIntegrityRecord(input: {
  synthesisInput: RecommendationSynthesisInput;
  recommendationId: string;
}): RecommendationIntegrityRecord {
  return Object.freeze({
    integrityId: `${input.recommendationId}:integrity`,
    certificationHash: input.synthesisInput.decisionReadinessCertificationResult.certification.certificationHash,
    replayHash: input.synthesisInput.deterministicReplayResult.result.replayHash,
    proposalHash: input.synthesisInput.proposalIntegrityResult.proposal.proposalHash,
    hiddenExecutionBlocked: input.synthesisInput.hiddenExecutionDetectionResult.report.blocked,
    integrityHash: hashRecommendationValue("recommendation-synthesis-integrity-record", {
      certificationHash: input.synthesisInput.decisionReadinessCertificationResult.certification.certificationHash,
      replayHash: input.synthesisInput.deterministicReplayResult.result.replayHash,
      proposalHash: input.synthesisInput.proposalIntegrityResult.proposal.proposalHash,
      hiddenExecutionBlocked: input.synthesisInput.hiddenExecutionDetectionResult.report.blocked,
    }),
  });
}

function buildStages(input: {
  errors: readonly RecommendationSynthesisError[];
}): readonly RecommendationSynthesisStageRecord[] {
  const errorCodes = new Set(input.errors.map((error) => error.code));
  const stages = [
    "certified_evidence_intake",
    "input_validation",
    "governance_correlation",
    "evidence_correlation",
    "constraint_validation",
    "recommendation_synthesis",
    "confidence_derivation",
    "rationale_binding",
    "replay_binding",
    "deterministic_serialization",
    "immutable_audit_binding",
    "append_only_recording",
    "certified_recommendation_output",
  ];
  return Object.freeze(stages.map((stage) => Object.freeze({
    stage,
    passed: errorCodes.size === 0,
    reasons: Object.freeze(errorCodes.size === 0 ? [] : [...errorCodes]),
    deterministicHash: hashRecommendationValue("recommendation-synthesis-stage", {
      stage,
      reasons: [...errorCodes],
    }),
  })));
}

function freezeErrors(errors: readonly RecommendationSynthesisError[]): readonly RecommendationSynthesisError[] {
  return Object.freeze([...errors]);
}

export function synthesizeRecommendations(
  input: RecommendationSynthesisInput,
): RecommendationSynthesisResult {
  const boundaryErrors = validateRecommendationConstitutionalBoundaries(input);
  const lifecycleErrors = validateRecommendationLifecycle()
    ? []
    : [{
        code: "RECOMMENDATION_SYNTHESIS_UNKNOWN_STATE" as const,
        message: "Lifecycle declaration is invalid.",
        path: "recommendationLifecycleStateMachine",
      }];
  const governanceErrors = correlateRecommendationGovernance(input);
  const certificationErrors = correlateRecommendationCertification(input);
  const validationErrors = correlateRecommendationValidation(input);
  const replayErrors = auditRecommendationReplay(input);
  const constraintErrors = validateRecommendationConstraints(input);
  const approvalErrors = validateRecommendationApprovalDependencies(input);
  const containmentErrors = validateRecommendationContainment(input);
  const integrityErrors = validateRecommendationIntegrity(input);
  const authorityErrors = validateRecommendationOperatorAuthority(input);
  const transitionErrors = validateRecommendationTransition(input);
  const driftErrors = detectRecommendationDrift(input);
  const policyBinding = bindRecommendationPolicy(input);
  const policyErrors = policyBinding.policySnapshotIds.length === 0
    ? [{
        code: "RECOMMENDATION_SYNTHESIS_POLICY_BINDING_INVALID" as const,
        message: "Policy snapshot bindings are required.",
        path: "policySnapshotIds",
      }]
    : [];
  const telemetry = emitRecommendationTelemetry(input);
  const evidenceReferences = correlateRecommendationEvidence(input);
  const governanceBindings = bindRecommendationGovernance(input);
  const replayMetadata = reconstructRecommendationReplay(input);
  const constraintBoundary = buildRecommendationConstraintBoundary(input);
  const confidenceRecord = deriveRecommendationConfidence(input);
  const versionBinding = bindRecommendationVersion(input);

  const baseRecommendation = createRecommendation({
    synthesisInput: input,
    evidenceReferences: evidenceReferences.map((reference) => reference.referenceId),
    governanceBindingIds: governanceBindings.map((binding) => binding.bindingId),
    confidenceScore: confidenceRecord.confidenceScore,
    escalationAllowed: constraintBoundary.escalationAllowed,
    approvalRequired: constraintBoundary.approvalRequired,
    constraintProfileId: constraintBoundary.constraintProfileId,
  });
  const rationaleRecord = generateRecommendationRationale({
    synthesisInput: input,
    recommendation: baseRecommendation,
  });
  const integrityRecord = buildIntegrityRecord({
    synthesisInput: input,
    recommendationId: baseRecommendation.recommendationId,
  });
  const envelopeBase = Object.freeze({
    recommendation: baseRecommendation,
    replayMetadata,
    evidenceReferences,
    governanceBindings,
    rationaleRecord,
    confidenceRecord,
    lineageRecord: Object.freeze({
      entryId: `${input.synthesisId}:${baseRecommendation.recommendationId}:lineage-placeholder`,
      recommendationId: baseRecommendation.recommendationId,
      recommendationHash: "",
      lineageHash: "",
    }),
    determinismRecord: Object.freeze({
      deterministic: true,
      stableOrdering: true,
      stableRationale: true,
      stableConfidence: true,
      stableSerialization: true,
      determinismHash: hashRecommendationValue("recommendation-synthesis-determinism-record-placeholder", input.synthesisId),
    }),
    integrityRecord,
    envelopeHash: "",
    executionAuthorized: false as const,
  });
  const provisionalSerializationRecord = serializeRecommendationEnvelope(envelopeBase);
  const envelopeHash = hashRecommendationValue("recommendation-synthesis-envelope", {
    recommendation: baseRecommendation,
    replayMetadata,
    evidenceReferences,
    governanceBindings,
    rationaleHash: rationaleRecord.rationaleHash,
    confidenceHash: confidenceRecord.confidenceHash,
    serializationHash: provisionalSerializationRecord.serializationHash,
    integrityHash: integrityRecord.integrityHash,
    versionHash: versionBinding.versionHash,
    policyHash: policyBinding.policyHash,
  });
  const determinismRecord = Object.freeze({
    deterministic: true,
    stableOrdering: true,
    stableRationale: true,
    stableConfidence: true,
    stableSerialization: true,
    determinismHash: hashRecommendationValue("recommendation-synthesis-determinism-record", {
      envelopeHash,
      serializationHash: provisionalSerializationRecord.serializationHash,
      confidenceHash: confidenceRecord.confidenceHash,
      rationaleHash: rationaleRecord.rationaleHash,
    }),
  });
  const provisionalEnvelope: RecommendationEnvelope = Object.freeze({
    ...envelopeBase,
    serializationRecord: provisionalSerializationRecord,
    determinismRecord,
    envelopeHash,
  });
  const lineageEntry = buildRecommendationLineageEntry({
    synthesisInput: input,
    envelope: provisionalEnvelope,
  });
  const lineage = appendRecommendationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const envelopeWithLineage = Object.freeze({
    ...provisionalEnvelope,
    lineageRecord: Object.freeze({
      entryId: lineageEntry.entryId,
      recommendationId: lineageEntry.recommendationId,
      recommendationHash: lineageEntry.recommendationHash,
      lineageHash: lineage.lineageHash,
    }),
  });
  const { serializationRecord: _unusedSerializationRecord, ...serializableEnvelope } = envelopeWithLineage;
  const finalSerializationRecord = serializeRecommendationEnvelope(serializableEnvelope);
  const finalEnvelope: RecommendationEnvelope = Object.freeze({
    ...envelopeWithLineage,
    serializationRecord: finalSerializationRecord,
  });
  const auditRecord: RecommendationAuditRecord = bindRecommendationImmutableAudit({
    recommendationId: finalEnvelope.recommendation.recommendationId,
    envelope: finalEnvelope,
    lineage,
  });

  const synthesizedErrors = freezeErrors([
    ...boundaryErrors,
    ...lifecycleErrors,
    ...governanceErrors,
    ...certificationErrors,
    ...validationErrors,
    ...replayErrors,
    ...constraintErrors,
    ...approvalErrors,
    ...containmentErrors,
    ...integrityErrors,
    ...authorityErrors,
    ...transitionErrors,
    ...driftErrors,
    ...policyErrors,
    ...validateRecommendationConfidenceDeterminism(input, confidenceRecord),
    ...validateRecommendationRationaleDeterminism({
      synthesisInput: input,
      recommendation: baseRecommendation,
      rationaleRecord,
    }),
    ...detectRecommendationHiddenExecution({
      synthesisInput: input,
      recommendation: baseRecommendation,
    }),
    ...detectRecommendationAntiEmergence({
      synthesisInput: input,
      recommendation: baseRecommendation,
    }),
    ...validateRecommendationSerialization(finalEnvelope),
    ...validateRecommendationDeterminism([finalEnvelope]),
    ...validateRecommendationOutput([finalEnvelope]),
    ...(!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])]) ? [{
      code: "RECOMMENDATION_SYNTHESIS_LINEAGE_INSTABILITY" as const,
      message: "Existing audit ledger chain is invalid.",
      path: "existingAuditLedger",
    }] : []),
  ]);

  const freeze = buildRecommendationFreeze(synthesizedErrors);
  const failClosed = shouldRecommendationFailClosed(synthesizedErrors);
  const recommendations = failClosed
    ? Object.freeze([] as RecommendationEnvelope[])
    : orderRecommendationsDeterministically([finalEnvelope]);

  const auditLedger = appendRecommendationAuditEntry({
    existing: appendRecommendationAuditEntry({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "recommendation.synthesis.requested",
        synthesisId: input.synthesisId,
        recommendationSystemId: input.recommendationSystemId,
        replayHash: input.deterministicReplayResult.result.replayHash,
      }),
      scope: "recommendation-synthesis",
    }),
    payload: Object.freeze({
      event: failClosed ? "recommendation.synthesis.frozen" : "recommendation.synthesis.completed",
      synthesisId: input.synthesisId,
      recommendationIds: recommendations.map((item) => item.recommendation.recommendationId),
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
    }),
    scope: "recommendation-synthesis-audit",
  });

  return Object.freeze({
    recommendations,
    telemetry,
    freeze,
    auditRecord,
    lineage,
    auditLedger,
    stages: buildStages({ errors: synthesizedErrors }),
    errors: synthesizedErrors,
    warnings: Object.freeze(
      failClosed
        ? ["Recommendation synthesis froze under constitutional uncertainty."]
        : ["Recommendation synthesis remained bounded, replay-safe, and non-executing."],
    ),
    deterministicHash: hashRecommendationValue("recommendation-synthesis-result", {
      recommendationHashes: recommendations.map((item) => item.envelopeHash),
      telemetryHash: telemetry.telemetryHash,
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
      freezeHash: freeze.freezeHash,
      errorCodes: synthesizedErrors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildRecommendationSynthesisEngine = synthesizeRecommendations;
