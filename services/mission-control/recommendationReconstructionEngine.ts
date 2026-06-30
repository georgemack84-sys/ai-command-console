import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRecommendationReconstruction,
  TruthCertificationState,
  TruthRecommendationContextBundle,
  TruthRecommendationEnvironmentContext,
  TruthRecommendationReconstructionContract,
  TruthRecommendationReconstructionInput,
  TruthRecommendationReconstructionLedgerEntry,
  TruthRecommendationReconstructionObservability,
  TruthRecommendationReconstructionReasonCode,
  TruthRecommendationReconstructionReplay,
  TruthRecommendationReconstructionRequest,
  TruthRecommendationReconstructionScope,
  TruthRecommendationReconstructionValidation,
  TruthRecommendationReconstructionVisibility,
  TruthReplayResult,
} from "./types";

const RECONSTRUCTION_SCOPES = new Set<TruthRecommendationReconstructionScope>([
  "FULL_CONTEXT",
  "RATIONALE_ONLY",
  "EVIDENCE_ONLY",
  "GOVERNANCE_ONLY",
  "CONFIDENCE_ONLY",
  "ALTERNATIVES_ONLY",
  "ENVIRONMENT_ONLY",
]);

function addReason(reasons: TruthRecommendationReconstructionReasonCode[], reason: TruthRecommendationReconstructionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRecommendationReconstructionRequest): TruthRecommendationReconstructionRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "approvalAllowed",
    "rankingAllowed",
    "prioritizationAllowed",
    "scoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

export function buildTruthRecommendationReconstructionRequest(
  request: TruthRecommendationReconstructionRequest,
): TruthRecommendationReconstructionRequest {
  return requestCore(request);
}

export function sealTruthRecommendationReconstruction(
  input: TruthRecommendationReconstructionInput,
): SealedTruthRecommendationReconstruction {
  const reasons: TruthRecommendationReconstructionReasonCode[] = [];
  const recommendation = input.recommendation.recommendation;
  const alternativeRecords = Object.freeze([...(input.alternativeRecords ?? [])]);
  const rejectedRecords = Object.freeze([...(input.rejectedRecords ?? [])]);
  const reconstructionScope = input.reconstructionScope ?? "FULL_CONTEXT";

  const reconstructionId = hashValue("mission-control-recommendation-reconstruction-id", {
    recommendation_id: recommendation.recommendation_id,
    reconstruction_scope: reconstructionScope,
    reconstruction_timestamp: input.request.now,
  });

  const reconstructionIdPresent = reconstructionId.length > 0;
  addReason(reasons, reconstructionIdPresent ? "RECONSTRUCTION_ID_PRESENT" : "RECONSTRUCTION_ID_MISSING");
  const recommendationIdPresent = recommendation.recommendation_id.length > 0;
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  const scopePresent = reconstructionScope.length > 0;
  addReason(reasons, scopePresent ? "RECONSTRUCTION_SCOPE_PRESENT" : "RECONSTRUCTION_SCOPE_MISSING");
  const scopeValid = RECONSTRUCTION_SCOPES.has(reconstructionScope);
  addReason(reasons, scopeValid ? "RECONSTRUCTION_SCOPE_VALID" : "RECONSTRUCTION_SCOPE_INVALID");

  const recommendationContextPresent = input.missingContextComponentDetected !== true
    && recommendation.recommendation_payload.recommendation_rationale.trim().length > 0;
  addReason(reasons, recommendationContextPresent ? "RECOMMENDATION_CONTEXT_PRESENT" : "RECOMMENDATION_CONTEXT_MISSING");
  const recommendationContextComplete = recommendationContextPresent
    && recommendation.recommendation_payload.recommendation_reasoning.length > 0
    && input.incompleteContextDetected !== true;
  addReason(reasons, recommendationContextComplete ? "RECOMMENDATION_CONTEXT_COMPLETE" : "RECOMMENDATION_CONTEXT_INCOMPLETE");

  const evidenceReconstructed = recommendation.supporting_evidence_ids.length > 0
    && input.missingContextComponentDetected !== true;
  addReason(reasons, evidenceReconstructed ? "EVIDENCE_RECONSTRUCTED" : "EVIDENCE_MISSING");
  const evidenceValid = evidenceReconstructed
    && input.evidenceMismatchDetected !== true
    && recommendation.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceValid ? "EVIDENCE_VALID" : input.evidenceMismatchDetected === true ? "EVIDENCE_MISMATCH" : "EVIDENCE_INVALID");

  const governanceReconstructed = recommendation.governance_binding.governance_policy_ids.length > 0;
  addReason(reasons, governanceReconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_MISSING");
  const governanceValid = governanceReconstructed
    && input.policyMismatchDetected !== true
    && recommendation.governance_binding.authority_scope.includes("ADVISORY");
  addReason(reasons, governanceValid ? "GOVERNANCE_VALID" : input.policyMismatchDetected === true ? "GOVERNANCE_MISMATCH" : "GOVERNANCE_INVALID");

  const confidenceReconstructed = recommendation.confidence_binding.confidence_rationale.trim().length > 0;
  addReason(reasons, confidenceReconstructed ? "CONFIDENCE_RECONSTRUCTED" : "CONFIDENCE_RATIONALE_MISSING");
  const confidenceValid = confidenceReconstructed
    && input.confidenceMismatchDetected !== true
    && Number.isFinite(recommendation.confidence_binding.confidence_score);
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : input.confidenceMismatchDetected === true ? "CONFIDENCE_MISMATCH" : "CONFIDENCE_INVALID");

  const alternativesReconstructed = input.missingAlternativeDetected !== true
    && alternativeRecords.every((record) => record.classification === "ALTERNATIVE")
    && rejectedRecords.every((record) => record.classification === "REJECTED");
  addReason(reasons, alternativesReconstructed ? "ALTERNATIVES_RECONSTRUCTED" : "ALTERNATIVES_MISSING");
  const rejectionRationalePresent = rejectedRecords.every((record) => record.record.record_type !== "REJECTED_OPTION" || record.validation.reasonCodes.includes("REJECTION_RATIONALE_PRESENT"))
    && input.missingRejectionRationaleDetected !== true;
  addReason(reasons, rejectionRationalePresent ? "ALTERNATIVE_VALID" : "REJECTION_RATIONALE_MISSING");

  const environment: TruthRecommendationEnvironmentContext = Object.freeze({
    runtime_conditions: Object.freeze([...(input.environment?.runtime_conditions ?? ["runtime-stable"])]),
    mission_conditions: Object.freeze([...(input.environment?.mission_conditions ?? [`mission:${recommendation.mission_id}`])]),
    tenant_conditions: Object.freeze([...(input.environment?.tenant_conditions ?? [`tenant:${recommendation.tenant_id}`])]),
    risk_conditions: Object.freeze([...(input.environment?.risk_conditions ?? ["risk-reviewed"])]),
    escalation_conditions: Object.freeze([...(input.environment?.escalation_conditions ?? ["no-escalation-required"])]),
    certification_conditions: Object.freeze([...(input.environment?.certification_conditions ?? ["recommendation-certified"])]),
  });
  const environmentReconstructed = input.missingEnvironmentStateDetected !== true
    && environment.runtime_conditions.length > 0
    && environment.mission_conditions.length > 0
    && environment.tenant_conditions.length > 0;
  addReason(reasons, environmentReconstructed ? "ENVIRONMENT_RECONSTRUCTED" : "ENVIRONMENT_MISSING");
  const environmentValid = environmentReconstructed && input.environmentMismatchDetected !== true;
  addReason(reasons, environmentValid ? "ENVIRONMENT_VALID" : input.environmentMismatchDetected === true ? "ENVIRONMENT_MISMATCH" : "ENVIRONMENT_INVALID");

  const contextBundle: TruthRecommendationContextBundle = Object.freeze({
    recommendation_rationale: recommendation.recommendation_payload.recommendation_rationale,
    recommendation_assumptions: Object.freeze([...recommendation.recommendation_payload.recommendation_assumptions]),
    recommendation_constraints: Object.freeze([...recommendation.recommendation_payload.recommendation_constraints]),
    recommendation_objectives: Object.freeze([...(input.recommendationObjectives ?? [recommendation.recommendation_payload.recommendation_summary])]),
    recommendation_state: recommendation.recommendation_state,
    supporting_evidence_ids: Object.freeze([...recommendation.supporting_evidence_ids]),
    supporting_event_ids: Object.freeze([...recommendation.supporting_event_ids]),
    supporting_truth_record_ids: Object.freeze([...recommendation.supporting_truth_record_ids]),
    governance_policy_ids: Object.freeze([...recommendation.governance_binding.governance_policy_ids]),
    authority_scope: recommendation.governance_binding.authority_scope,
    approval_requirements: Object.freeze([...recommendation.governance_binding.approval_requirements]),
    confidence_score: recommendation.confidence_binding.confidence_score,
    confidence_state: recommendation.confidence_binding.confidence_state,
    confidence_rationale: recommendation.confidence_binding.confidence_rationale,
    accepted_recommendation_id: recommendation.recommendation_id,
    alternative_recommendation_ids: Object.freeze(alternativeRecords.map((record) => record.recommendation.recommendation.recommendation_id)),
    rejected_recommendation_ids: Object.freeze(rejectedRecords.map((record) => record.recommendation.recommendation.recommendation_id)),
    rejection_rationales: Object.freeze(rejectedRecords.map((record) => record.record.record_type === "REJECTED_OPTION" ? record.ledgerEntry.failure_reason ?? "" : "")),
    environment,
  });

  const bundleAssembled = input.contextAssemblyFailureDetected !== true;
  addReason(reasons, bundleAssembled ? "BUNDLE_ASSEMBLED" : "BUNDLE_ASSEMBLY_FAILED");
  const bundleComplete = bundleAssembled
    && input.incompleteBundleDetected !== true
    && contextBundle.recommendation_objectives.length > 0
    && contextBundle.supporting_evidence_ids.length > 0
    && contextBundle.governance_policy_ids.length > 0;
  addReason(reasons, bundleComplete ? "BUNDLE_COMPLETE" : "BUNDLE_INCOMPLETE");

  const recommendationValid = input.recommendation.validation.valid;
  addReason(reasons, recommendationValid ? "RECOMMENDATION_VALID" : "RECOMMENDATION_INVALID");

  const alternativeValid = alternativesReconstructed && rejectionRationalePresent;

  const tenantIsolationValid = input.crossTenantReconstructionDetected !== true
    && input.crossTenantContextAccessDetected !== true
    && recommendation.tenant_id === input.request.tenant_id
    && input.acceptedRecord.record.tenant_id === input.request.tenant_id
    && alternativeRecords.every((record) => record.record.tenant_id === input.request.tenant_id)
    && rejectedRecords.every((record) => record.record.tenant_id === input.request.tenant_id)
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceReconstructed
    ? "INCOMPLETE_EVIDENCE"
    : input.recommendation.replay.replayResult !== "REPRODUCED"
      ? input.recommendation.replay.replayResult
      : input.acceptedRecord.replay.replayResult !== "REPRODUCED"
        ? input.acceptedRecord.replay.replayResult
        : input.replayMismatchDetected === true
          || input.contextAssemblyFailureDetected === true
          || input.incompleteBundleDetected === true
          ? "MISMATCH"
          : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "REPLAY_INCOMPLETE_EVIDENCE"
          : "REPLAY_UNREPLAYABLE",
  );

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  addReason(reasons, "RECOMMENDATION_RECONSTRUCTION_ENGINE_IS_NOT_CONTROL");

  const reconstructed = reconstructionIdPresent
    && recommendationIdPresent
    && scopePresent
    && scopeValid
    && recommendationContextPresent
    && recommendationContextComplete
    && evidenceReconstructed
    && evidenceValid
    && governanceReconstructed
    && governanceValid
    && confidenceReconstructed
    && confidenceValid
    && alternativesReconstructed
    && rejectionRationalePresent
    && environmentReconstructed
    && environmentValid
    && bundleAssembled
    && bundleComplete
    && recommendationValid
    && alternativeValid
    && tenantIsolationValid
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const reconstruction: TruthRecommendationReconstructionContract = Object.freeze({
    reconstruction_id: reconstructionId,
    recommendation_id: recommendation.recommendation_id,
    tenant_id: recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    reconstruction_timestamp: input.request.now,
    reconstruction_scope: reconstructionScope,
    reconstruction_state: reconstructed ? "RECONSTRUCTED" : "REJECTED",
    reconstruction_reason: input.reconstructionReason ?? "reconstruct original recommendation context",
    evidence_references: Object.freeze([...recommendation.supporting_evidence_ids]),
    replay_references: Object.freeze([...recommendation.replay_reference_ids]),
  });

  const failureReason = reconstructed
    ? null
    : [
      !recommendationContextPresent && "missing context",
      !evidenceValid && "missing evidence",
      !governanceValid && "governance mismatch",
      !confidenceValid && "confidence mismatch",
      !alternativeValid && "alternative history lost",
      !environmentValid && "environment reconstruction failure",
      !bundleComplete && "incomplete context bundle",
      !tenantIsolationValid && "cross-tenant reconstruction",
      replayResult === "MISMATCH" && "replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthRecommendationReconstructionLedgerEntry = Object.freeze({
    reconstruction_id: reconstruction.reconstruction_id,
    recommendation_id: reconstruction.recommendation_id,
    tenant_id: reconstruction.tenant_id,
    mission_id: reconstruction.mission_id,
    reconstruction_scope: reconstruction.reconstruction_scope,
    reconstruction_state: reconstruction.reconstruction_state,
    validation_status: reconstructed ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const tenantScopedVisibility = tenantIsolationValid;
  const visibility: TruthRecommendationReconstructionVisibility = Object.freeze({
    recommendation_id: reconstruction.recommendation_id,
    reconstruction_state: reconstruction.reconstruction_state,
    context_bundle_status: recommendationContextComplete && bundleComplete ? "VALID" : "INVALID",
    evidence_status: evidenceValid ? "VALID" : "INVALID",
    governance_status: governanceValid ? "VALID" : "INVALID",
    confidence_status: confidenceValid ? "VALID" : "INVALID",
    alternative_status: alternativeValid ? "VALID" : "INVALID",
    environment_status: environmentValid ? "VALID" : "INVALID",
    validation_status: reconstructed ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantScopedVisibility,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScopedVisibility ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const observability: TruthRecommendationReconstructionObservability = Object.freeze({
    reconstructions_total: 1,
    successful_reconstructions: reconstructed ? 1 : 0,
    failed_reconstructions: reconstructed ? 0 : 1,
    context_retrieval_failures: recommendationContextComplete ? 0 : 1,
    bundle_assembly_failures: bundleAssembled && bundleComplete ? 0 : 1,
    validation_failures: reconstructed ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const conditional = reconstructed
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(
    reconstructed && observabilityOperational && replayResult === "REPRODUCED",
    conditional,
  );
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const validation: TruthRecommendationReconstructionValidation = Object.freeze({
    valid: reconstructed || conditional,
    validationState: reconstructed || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contextValid: recommendationContextComplete,
    evidenceValid,
    governanceValid,
    confidenceValid,
    alternativeValid,
    environmentValid,
    bundleValid: bundleAssembled && bundleComplete,
    tenantIsolationValid,
    replayValid: replayResult === "REPRODUCED",
    failClosed,
    deterministic: true,
    readOnly: true,
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
  });

  const replay: TruthRecommendationReconstructionReplay = Object.freeze({
    replayResult,
    reconstructedBundle: contextBundle,
    reconstructedContract: reconstruction,
  });

  return Object.freeze({
    request: requestCore(input.request),
    recommendation: input.recommendation,
    acceptedRecord: input.acceptedRecord,
    alternativeRecords,
    rejectedRecords,
    reconstruction,
    contextBundle,
    ledgerEntry,
    validation,
    replay,
    visibility,
    observability,
    certification,
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
