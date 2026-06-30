import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRecommendationContract,
  TruthCertificationState,
  TruthRecommendationCategory,
  TruthRecommendationConfidenceState,
  TruthRecommendationContract,
  TruthRecommendationContractInput,
  TruthRecommendationContractObservability,
  TruthRecommendationContractReasonCode,
  TruthRecommendationContractReplay,
  TruthRecommendationContractRequest,
  TruthRecommendationContractValidation,
  TruthRecommendationContractVisibility,
  TruthRecommendationLedgerEntry,
  TruthRecommendationPayload,
  TruthRecommendationState,
  TruthRecommendationType,
  TruthReplayResult,
} from "./types";

const RECOMMENDATION_TYPES = new Set<TruthRecommendationType>([
  "OPERATIONAL",
  "GOVERNANCE",
  "RISK",
  "CONFIDENCE",
  "ESCALATION",
  "MITIGATION",
  "CERTIFICATION",
  "RECOVERY",
  "OPTIMIZATION",
  "INVESTIGATION",
]);

const CATEGORY_BY_TYPE: Readonly<Record<TruthRecommendationType, TruthRecommendationCategory>> = Object.freeze({
  OPERATIONAL: "OPERATIONS",
  GOVERNANCE: "GOVERNANCE",
  RISK: "SECURITY",
  CONFIDENCE: "TRUTH",
  ESCALATION: "ESCALATION",
  MITIGATION: "SECURITY",
  CERTIFICATION: "CERTIFICATION",
  RECOVERY: "RUNTIME",
  OPTIMIZATION: "OPERATIONS",
  INVESTIGATION: "AUDIT",
});

const RECOMMENDATION_STATES = new Set<TruthRecommendationState>([
  "CREATED",
  "VALIDATED",
  "ACTIVE",
  "SUPERSEDED",
  "RESTRICTED",
  "ARCHIVED",
]);

const CONFIDENCE_STATES = new Set<TruthRecommendationConfidenceState>([
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
]);

function addReason(reasons: TruthRecommendationContractReasonCode[], reason: TruthRecommendationContractReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRecommendationContractRequest): TruthRecommendationContractRequest {
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

function isValidStateTransition(priorState: TruthRecommendationState | null | undefined, nextState: TruthRecommendationState): boolean {
  if (!priorState) return nextState === "CREATED" || nextState === "VALIDATED";
  const transitions: Readonly<Record<TruthRecommendationState, readonly TruthRecommendationState[]>> = Object.freeze({
    CREATED: ["VALIDATED", "RESTRICTED", "ARCHIVED"],
    VALIDATED: ["ACTIVE", "SUPERSEDED", "RESTRICTED", "ARCHIVED"],
    ACTIVE: ["SUPERSEDED", "RESTRICTED", "ARCHIVED"],
    SUPERSEDED: ["ARCHIVED"],
    RESTRICTED: ["ARCHIVED"],
    ARCHIVED: [],
  });
  return transitions[priorState].includes(nextState);
}

export function buildTruthRecommendationContractRequest(
  request: TruthRecommendationContractRequest,
): TruthRecommendationContractRequest {
  return requestCore(request);
}

export function sealTruthRecommendationContract(
  input: TruthRecommendationContractInput,
): SealedTruthRecommendationContract {
  const reasons: TruthRecommendationContractReasonCode[] = [];
  const recommendationTimestamp = input.recommendationTimestamp ?? input.request.now;
  const recommendationVersion = input.recommendationVersion ?? "recommendation/v1";
  const recommendationState = input.recommendationState ?? "CREATED";
  const recommendationPayload: TruthRecommendationPayload = Object.freeze({
    recommendation_rationale: input.recommendationPayload.recommendation_rationale,
    recommendation_summary: input.recommendationPayload.recommendation_summary,
    recommendation_reasoning: Object.freeze([...input.recommendationPayload.recommendation_reasoning]),
    recommendation_assumptions: Object.freeze([...(input.recommendationPayload.recommendation_assumptions ?? [])]),
    recommendation_constraints: Object.freeze([...(input.recommendationPayload.recommendation_constraints ?? [])]),
  });

  const replayHash = hashValue("mission-control-recommendation-replay-hash", {
    replay_reference_ids: input.replayReferenceIds,
    replay_bundle_id: input.replayBundleId ?? null,
  });
  const recommendationHash = hashValue("mission-control-recommendation-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    recommendation_type: input.recommendationType,
    recommendation_category: input.recommendationCategory,
    recommendation_timestamp: recommendationTimestamp,
    recommendation_version: recommendationVersion,
    recommendation_state: recommendationState,
    recommendation_payload: recommendationPayload,
    supporting_evidence_ids: input.supportingEvidenceIds,
    supporting_truth_record_ids: input.supportingTruthRecordIds ?? [],
    supporting_event_ids: input.supportingEventIds ?? [],
    supporting_graph_references: input.supportingGraphReferences ?? [],
    governance_binding: input.governanceBinding,
    confidence_binding: input.confidenceBinding,
    replay_reference_ids: input.replayReferenceIds,
  });
  const recommendationId = input.recommendationId ?? hashValue("mission-control-recommendation-id", {
    mission_id: input.missionId,
    recommendation_hash: recommendationHash,
  });

  const recommendation: TruthRecommendationContract = Object.freeze({
    recommendation_id: recommendationId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    recommendation_type: input.recommendationType,
    recommendation_category: input.recommendationCategory,
    recommendation_timestamp: recommendationTimestamp,
    recommendation_version: recommendationVersion,
    recommendation_state: recommendationState,
    recommendation_payload: recommendationPayload,
    recommendation_hash: recommendationHash,
    created_timestamp: input.request.now,
    supporting_evidence_ids: Object.freeze([...input.supportingEvidenceIds]),
    supporting_truth_record_ids: Object.freeze([...(input.supportingTruthRecordIds ?? [])]),
    supporting_event_ids: Object.freeze([...(input.supportingEventIds ?? [])]),
    supporting_graph_references: Object.freeze([...(input.supportingGraphReferences ?? [])]),
    governance_binding: Object.freeze({
      governance_policy_ids: Object.freeze([...input.governanceBinding.governance_policy_ids]),
      governance_constraints: Object.freeze([...input.governanceBinding.governance_constraints]),
      authority_scope: input.governanceBinding.authority_scope,
      approval_requirements: Object.freeze([...input.governanceBinding.approval_requirements]),
      governance_references: Object.freeze([...input.governanceBinding.governance_references]),
    }),
    confidence_binding: Object.freeze({
      confidence_score: input.confidenceBinding.confidence_score,
      confidence_state: input.confidenceBinding.confidence_state,
      confidence_rationale: input.confidenceBinding.confidence_rationale,
      confidence_evidence: Object.freeze([...input.confidenceBinding.confidence_evidence]),
    }),
    replay_reference_ids: Object.freeze([...input.replayReferenceIds]),
    replay_bundle_id: input.replayBundleId,
    replay_hash: replayHash,
  });

  const recommendationIdPresent = recommendation.recommendation_id.length > 0;
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  const recommendationIdUnique = !(input.priorRecommendationIds ?? []).includes(recommendation.recommendation_id);
  addReason(reasons, recommendationIdUnique ? "RECOMMENDATION_ID_UNIQUE" : "RECOMMENDATION_ID_DUPLICATE");
  const identityImmutable = input.identityMutated !== true;
  addReason(reasons, identityImmutable ? "RECOMMENDATION_ID_IMMUTABLE" : "RECOMMENDATION_ID_MUTATED");
  const recommendationHashValid = input.hashMismatchDetected !== true;
  addReason(reasons, recommendationHashValid ? "RECOMMENDATION_HASH_VALID" : "RECOMMENDATION_HASH_MISMATCH");

  const tenantIdPresent = recommendation.tenant_id.length > 0;
  addReason(reasons, tenantIdPresent ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  const missionIdPresent = recommendation.mission_id.length > 0;
  addReason(reasons, missionIdPresent ? "MISSION_ID_PRESENT" : "MISSION_ID_MISSING");

  const typePresent = recommendation.recommendation_type.length > 0;
  addReason(reasons, typePresent ? "RECOMMENDATION_TYPE_PRESENT" : "RECOMMENDATION_TYPE_MISSING");
  const typeValid = RECOMMENDATION_TYPES.has(recommendation.recommendation_type);
  addReason(reasons, typeValid ? "RECOMMENDATION_TYPE_VALID" : "RECOMMENDATION_TYPE_INVALID");
  const typeNotDeprecated = input.deprecatedRecommendationTypeDetected !== true;
  addReason(reasons, typeNotDeprecated ? "RECOMMENDATION_TYPE_NOT_DEPRECATED" : "RECOMMENDATION_TYPE_DEPRECATED");

  const categorySingle = input.multipleCategoriesDetected !== true;
  addReason(reasons, categorySingle ? "RECOMMENDATION_CATEGORY_SINGLE" : "RECOMMENDATION_CATEGORY_MULTIPLE");
  const categoryValid = categorySingle
    && input.typeCategoryMatches !== false
    && CATEGORY_BY_TYPE[recommendation.recommendation_type] === recommendation.recommendation_category;
  addReason(reasons, categoryValid ? "RECOMMENDATION_CATEGORY_VALID" : "RECOMMENDATION_CATEGORY_MISMATCH");

  const timestampValid = !Number.isNaN(Date.parse(recommendation.recommendation_timestamp));
  addReason(reasons, timestampValid ? "RECOMMENDATION_TIMESTAMP_VALID" : "RECOMMENDATION_TIMESTAMP_INVALID");
  const versionPresent = recommendation.recommendation_version.length > 0;
  addReason(reasons, versionPresent ? "RECOMMENDATION_VERSION_PRESENT" : "RECOMMENDATION_VERSION_MISSING");

  const rationalePresent = recommendation.recommendation_payload.recommendation_rationale.trim().length > 0
    && recommendation.recommendation_payload.recommendation_summary.trim().length > 0
    && input.missingRationaleDetected !== true;
  addReason(reasons, rationalePresent ? "RATIONALE_PRESENT" : "RATIONALE_MISSING");
  const reasoningPresent = recommendation.recommendation_payload.recommendation_reasoning.length > 0
    && recommendation.recommendation_payload.recommendation_reasoning.every((item) => item.trim().length > 0)
    && input.emptyReasoningDetected !== true;
  addReason(reasons, reasoningPresent ? "REASONING_PRESENT" : "REASONING_MISSING");

  const supportingEvidencePresent = recommendation.supporting_evidence_ids.length > 0
    && input.missingSupportingEvidenceDetected !== true;
  addReason(reasons, supportingEvidencePresent ? "SUPPORTING_EVIDENCE_PRESENT" : "SUPPORTING_EVIDENCE_MISSING");
  const evidenceResolvable = supportingEvidencePresent
    && input.unresolvableEvidenceDetected !== true
    && recommendation.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceResolvable ? "SUPPORTING_EVIDENCE_RESOLVABLE" : "SUPPORTING_EVIDENCE_UNRESOLVABLE");

  const governanceBindingPresent = recommendation.governance_binding.governance_policy_ids.length > 0
    && recommendation.governance_binding.governance_constraints.length > 0
    && recommendation.governance_binding.authority_scope.trim().length > 0
    && recommendation.governance_binding.governance_references.length > 0
    && input.missingGovernanceBindingDetected !== true;
  addReason(reasons, governanceBindingPresent ? "GOVERNANCE_BINDING_PRESENT" : "GOVERNANCE_BINDING_MISSING");
  const authorityScopeValid = input.authorityScopeViolationDetected !== true
    && recommendation.governance_binding.authority_scope.toUpperCase().includes("ADVISORY");
  addReason(reasons, authorityScopeValid ? "AUTHORITY_SCOPE_VALID" : "AUTHORITY_SCOPE_VIOLATION");

  const confidenceScorePresent = Number.isFinite(recommendation.confidence_binding.confidence_score)
    && input.missingConfidenceScoreDetected !== true;
  addReason(reasons, confidenceScorePresent ? "CONFIDENCE_SCORE_PRESENT" : "CONFIDENCE_SCORE_MISSING");
  const confidenceStateValid = CONFIDENCE_STATES.has(recommendation.confidence_binding.confidence_state)
    && input.unsupportedConfidenceStateDetected !== true;
  addReason(reasons, confidenceStateValid ? "CONFIDENCE_STATE_VALID" : "CONFIDENCE_STATE_INVALID");
  const confidenceRationalePresent = recommendation.confidence_binding.confidence_rationale.trim().length > 0
    && recommendation.confidence_binding.confidence_evidence.length > 0
    && input.confidenceCorruptionDetected !== true;
  addReason(reasons, confidenceRationalePresent ? "CONFIDENCE_RATIONALE_PRESENT" : "CONFIDENCE_RATIONALE_MISSING");

  const stateKnown = RECOMMENDATION_STATES.has(recommendation.recommendation_state) && input.unknownStateDetected !== true;
  addReason(reasons, stateKnown ? "STATE_VALID" : "STATE_INVALID");
  const stateTransitionValid = stateKnown
    && input.invalidStateTransitionDetected !== true
    && isValidStateTransition(input.priorState, recommendation.recommendation_state);
  addReason(reasons, stateTransitionValid ? "STATE_TRANSITION_VALID" : "STATE_TRANSITION_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false && recommendation.replay_reference_ids.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");
  const replayHashValid = input.replayHashMismatchDetected !== true;
  addReason(reasons, replayHashValid ? "REPLAY_HASH_VALID" : "REPLAY_HASH_MISMATCH");

  const tenantScoped = (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id)
    && recommendation.tenant_id === input.request.tenant_id;
  addReason(reasons, tenantScoped ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const advisoryOnly = input.executionAuthorityDetected !== true
    && !recommendation.governance_binding.authority_scope.toUpperCase().includes("EXECUTE")
    && !recommendation.governance_binding.authority_scope.toUpperCase().includes("APPROVE")
    && !recommendation.governance_binding.authority_scope.toUpperCase().includes("AUTHORIZE")
    && !recommendation.governance_binding.authority_scope.toUpperCase().includes("ENFORCE");
  addReason(reasons, advisoryOnly ? "ADVISORY_ONLY_ENFORCED" : "EXECUTION_AUTHORITY_DETECTED");

  const replayResult: TruthReplayResult = !supportingEvidencePresent
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : !recommendationHashValid || !replayHashValid || input.replayMismatchDetected === true || input.confidenceCorruptionDetected === true
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
  addReason(reasons, "RECOMMENDATION_CONTRACT_IS_NOT_CONTROL");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");
  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const pass = recommendationIdPresent
    && recommendationIdUnique
    && identityImmutable
    && recommendationHashValid
    && tenantIdPresent
    && missionIdPresent
    && typePresent
    && typeValid
    && typeNotDeprecated
    && categoryValid
    && timestampValid
    && versionPresent
    && rationalePresent
    && reasoningPresent
    && supportingEvidencePresent
    && evidenceResolvable
    && governanceBindingPresent
    && authorityScopeValid
    && confidenceScorePresent
    && confidenceStateValid
    && confidenceRationalePresent
    && stateKnown
    && stateTransitionValid
    && replayBindingValid
    && replayHashValid
    && tenantScoped
    && advisoryOnly
    && replayResult === "REPRODUCED"
    && failClosed
    && observabilityOperational
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditional = !pass
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && recommendationIdUnique
    && identityImmutable
    && recommendationHashValid
    && typeValid
    && typeNotDeprecated
    && categoryValid
    && rationalePresent
    && reasoningPresent
    && supportingEvidencePresent
    && evidenceResolvable
    && governanceBindingPresent
    && authorityScopeValid
    && confidenceScorePresent
    && confidenceStateValid
    && confidenceRationalePresent
    && stateKnown
    && stateTransitionValid
    && replayBindingValid
    && replayHashValid
    && tenantScoped
    && advisoryOnly
    && replayResult === "REPRODUCED";

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const failureReason = pass
    ? null
    : [
      !recommendationIdUnique && "duplicate identity",
      !identityImmutable && "identity mutation detected",
      !typeValid && "unknown recommendation type",
      !typeNotDeprecated && "deprecated recommendation type",
      !categoryValid && "category mismatch",
      !rationalePresent && "missing rationale",
      !supportingEvidencePresent && "missing supporting evidence",
      !evidenceResolvable && "unresolvable evidence",
      !governanceBindingPresent && "missing governance binding",
      !authorityScopeValid && "authority scope violation",
      !confidenceScorePresent && "missing confidence score",
      !confidenceStateValid && "unsupported confidence state",
      !stateTransitionValid && "invalid state transition",
      replayResult === "MISMATCH" && "recommendation replay mismatch",
      !advisoryOnly && "execution authority detected",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthRecommendationLedgerEntry = Object.freeze({
    recommendation_id: recommendation.recommendation_id,
    tenant_id: recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    recommendation_state: recommendation.recommendation_state,
    recommendation_type: recommendation.recommendation_type,
    recommendation_category: recommendation.recommendation_category,
    confidence_state: recommendation.confidence_binding.confidence_state,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });

  const visibility: TruthRecommendationContractVisibility = Object.freeze({
    recommendation_id: recommendation.recommendation_id,
    recommendation_type: recommendation.recommendation_type,
    recommendation_category: recommendation.recommendation_category,
    recommendation_state: recommendation.recommendation_state,
    confidence_state: recommendation.confidence_binding.confidence_state,
    confidence_score: recommendation.confidence_binding.confidence_score,
    governance_scope: recommendation.governance_binding.authority_scope,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: recommendation.recommendation_timestamp,
    readOnly: true,
    tenantScoped,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScoped ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthRecommendationContractObservability = Object.freeze({
    recommendations_created_total: 1,
    recommendations_validated_total: recommendation.recommendation_state === "VALIDATED" ? 1 : 0,
    recommendations_active_total: recommendation.recommendation_state === "ACTIVE" ? 1 : 0,
    recommendations_superseded_total: recommendation.recommendation_state === "SUPERSEDED" ? 1 : 0,
    recommendation_validation_failures: pass || conditional ? 0 : 1,
    governance_binding_failures: governanceBindingPresent && authorityScopeValid ? 0 : 1,
    confidence_binding_failures: confidenceScorePresent && confidenceStateValid && confidenceRationalePresent ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    state_transition_failures: stateTransitionValid ? 0 : 1,
  });

  const validation: TruthRecommendationContractValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    identityValid: recommendationIdUnique && identityImmutable && recommendationHashValid,
    typeValid: typeValid && typeNotDeprecated,
    categoryValid,
    rationaleValid: rationalePresent && reasoningPresent,
    evidenceValid: supportingEvidencePresent && evidenceResolvable,
    governanceValid: governanceBindingPresent && authorityScopeValid,
    confidenceValid: confidenceScorePresent && confidenceStateValid && confidenceRationalePresent,
    stateValid: stateKnown && stateTransitionValid,
    replayValid: replayBindingValid && replayHashValid && replayResult === "REPRODUCED",
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

  const replay: TruthRecommendationContractReplay = Object.freeze({
    replayResult,
    reconstructedRecommendation: recommendation,
  });

  return Object.freeze({
    request: requestCore(input.request),
    recommendation,
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
