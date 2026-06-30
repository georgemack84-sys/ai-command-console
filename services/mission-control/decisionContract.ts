import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionContract,
  TruthCertificationState,
  TruthDecisionCategory,
  TruthDecisionConfidenceState,
  TruthDecisionContract,
  TruthDecisionContractInput,
  TruthDecisionContractObservability,
  TruthDecisionContractReasonCode,
  TruthDecisionContractReplay,
  TruthDecisionContractRequest,
  TruthDecisionContractValidation,
  TruthDecisionContractVisibility,
  TruthDecisionLedgerEntry,
  TruthDecisionPayload,
  TruthDecisionState,
  TruthDecisionType,
  TruthReplayResult,
} from "./types";

const DECISION_TYPES = new Set<TruthDecisionType>([
  "APPROVAL",
  "REJECTION",
  "RESTRICTION",
  "ESCALATION",
  "CERTIFICATION",
  "RISK",
  "GOVERNANCE",
  "OPERATIONAL",
  "RECOVERY",
  "INVESTIGATION",
]);

const CATEGORY_BY_TYPE: Readonly<Record<TruthDecisionType, TruthDecisionCategory>> = Object.freeze({
  APPROVAL: "GOVERNANCE",
  REJECTION: "AUDIT",
  RESTRICTION: "RUNTIME",
  ESCALATION: "GOVERNANCE",
  CERTIFICATION: "CERTIFICATION",
  RISK: "SECURITY",
  GOVERNANCE: "GOVERNANCE",
  OPERATIONAL: "OPERATIONS",
  RECOVERY: "RUNTIME",
  INVESTIGATION: "AUDIT",
});

const DECISION_STATES = new Set<TruthDecisionState>([
  "CREATED",
  "VALIDATED",
  "ACTIVE",
  "SUPERSEDED",
  "RESTRICTED",
  "ARCHIVED",
]);

const CONFIDENCE_STATES = new Set<TruthDecisionConfidenceState>([
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
]);

const AUTHORITY_TYPES = new Set([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "SUPERVISION_ENGINE",
]);

function addReason(reasons: TruthDecisionContractReasonCode[], reason: TruthDecisionContractReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthDecisionContractRequest): TruthDecisionContractRequest {
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

function isValidStateTransition(priorState: TruthDecisionState | null | undefined, nextState: TruthDecisionState): boolean {
  if (!priorState) return nextState === "CREATED" || nextState === "VALIDATED";
  const transitions: Readonly<Record<TruthDecisionState, readonly TruthDecisionState[]>> = Object.freeze({
    CREATED: ["VALIDATED", "RESTRICTED", "ARCHIVED"],
    VALIDATED: ["ACTIVE", "SUPERSEDED", "RESTRICTED", "ARCHIVED"],
    ACTIVE: ["SUPERSEDED", "RESTRICTED", "ARCHIVED"],
    SUPERSEDED: ["ARCHIVED"],
    RESTRICTED: ["ARCHIVED"],
    ARCHIVED: [],
  });
  return transitions[priorState].includes(nextState);
}

export function buildTruthDecisionContractRequest(
  request: TruthDecisionContractRequest,
): TruthDecisionContractRequest {
  return requestCore(request);
}

export function sealTruthDecisionContract(
  input: TruthDecisionContractInput,
): SealedTruthDecisionContract {
  const reasons: TruthDecisionContractReasonCode[] = [];
  const decisionTimestamp = input.decisionTimestamp ?? input.request.now;
  const decisionVersion = input.decisionVersion ?? "decision/v1";
  const decisionState = input.decisionState ?? "CREATED";
  const decisionPayload: TruthDecisionPayload = Object.freeze({
    decision_rationale: input.decisionPayload.decision_rationale,
    decision_summary: input.decisionPayload.decision_summary,
    decision_reasoning: Object.freeze([...input.decisionPayload.decision_reasoning]),
    decision_assumptions: Object.freeze([...(input.decisionPayload.decision_assumptions ?? [])]),
    decision_constraints: Object.freeze([...(input.decisionPayload.decision_constraints ?? [])]),
  });

  const replayHash = hashValue("mission-control-decision-replay-hash", {
    replay_reference_ids: input.replayReferenceIds,
    replay_bundle_id: input.replayBundleId ?? null,
  });
  const decisionHash = hashValue("mission-control-decision-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    decision_type: input.decisionType,
    decision_category: input.decisionCategory,
    decision_timestamp: decisionTimestamp,
    decision_version: decisionVersion,
    decision_state: decisionState,
    decision_payload: decisionPayload,
    supporting_evidence_ids: input.supportingEvidenceIds,
    supporting_truth_record_ids: input.supportingTruthRecordIds ?? [],
    supporting_event_ids: input.supportingEventIds ?? [],
    supporting_recommendation_ids: input.supportingRecommendationIds ?? [],
    supporting_graph_references: input.supportingGraphReferences ?? [],
    governance_binding: input.governanceBinding,
    authority_binding: input.authorityBinding,
    confidence_binding: input.confidenceBinding,
    replay_reference_ids: input.replayReferenceIds,
  });
  const decisionId = input.decisionId ?? hashValue("mission-control-decision-id", {
    mission_id: input.missionId,
    decision_hash: decisionHash,
  });

  const decision: TruthDecisionContract = Object.freeze({
    decision_id: decisionId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    decision_type: input.decisionType,
    decision_category: input.decisionCategory,
    decision_timestamp: decisionTimestamp,
    decision_version: decisionVersion,
    decision_state: decisionState,
    decision_payload: decisionPayload,
    decision_hash: decisionHash,
    created_timestamp: input.request.now,
    supporting_evidence_ids: Object.freeze([...input.supportingEvidenceIds]),
    supporting_truth_record_ids: Object.freeze([...(input.supportingTruthRecordIds ?? [])]),
    supporting_event_ids: Object.freeze([...(input.supportingEventIds ?? [])]),
    supporting_recommendation_ids: Object.freeze([...(input.supportingRecommendationIds ?? [])]),
    supporting_graph_references: Object.freeze([...(input.supportingGraphReferences ?? [])]),
    governance_binding: Object.freeze({
      governance_policy_ids: Object.freeze([...input.governanceBinding.governance_policy_ids]),
      governance_constraints: Object.freeze([...input.governanceBinding.governance_constraints]),
      authority_scope: input.governanceBinding.authority_scope,
      approval_requirements: Object.freeze([...input.governanceBinding.approval_requirements]),
      governance_references: Object.freeze([...input.governanceBinding.governance_references]),
    }),
    authority_binding: Object.freeze({
      decision_authority: input.authorityBinding.decision_authority,
      authority_type: input.authorityBinding.authority_type,
      authority_scope: input.authorityBinding.authority_scope,
      authority_timestamp: input.authorityBinding.authority_timestamp,
      authority_evidence: Object.freeze([...input.authorityBinding.authority_evidence]),
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

  const decisionIdPresent = decision.decision_id.length > 0;
  addReason(reasons, decisionIdPresent ? "DECISION_ID_PRESENT" : "DECISION_ID_MISSING");
  const decisionIdUnique = !(input.priorDecisionIds ?? []).includes(decision.decision_id);
  addReason(reasons, decisionIdUnique ? "DECISION_ID_UNIQUE" : "DECISION_ID_DUPLICATE");
  const identityImmutable = input.identityMutated !== true;
  addReason(reasons, identityImmutable ? "DECISION_ID_IMMUTABLE" : "DECISION_ID_MUTATED");
  const decisionHashValid = input.hashMismatchDetected !== true;
  addReason(reasons, decisionHashValid ? "DECISION_HASH_VALID" : "DECISION_HASH_MISMATCH");

  const tenantIdPresent = decision.tenant_id.length > 0;
  addReason(reasons, tenantIdPresent ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  const missionIdPresent = decision.mission_id.length > 0;
  addReason(reasons, missionIdPresent ? "MISSION_ID_PRESENT" : "MISSION_ID_MISSING");

  const typePresent = decision.decision_type.length > 0;
  addReason(reasons, typePresent ? "DECISION_TYPE_PRESENT" : "DECISION_TYPE_MISSING");
  const typeValid = DECISION_TYPES.has(decision.decision_type);
  addReason(reasons, typeValid ? "DECISION_TYPE_VALID" : "DECISION_TYPE_INVALID");
  const typeNotDeprecated = input.deprecatedDecisionTypeDetected !== true;
  addReason(reasons, typeNotDeprecated ? "DECISION_TYPE_NOT_DEPRECATED" : "DECISION_TYPE_DEPRECATED");

  const categorySingle = input.multipleCategoriesDetected !== true;
  addReason(reasons, categorySingle ? "DECISION_CATEGORY_SINGLE" : "DECISION_CATEGORY_MULTIPLE");
  const categoryValid = categorySingle
    && input.typeCategoryMatches !== false
    && CATEGORY_BY_TYPE[decision.decision_type] === decision.decision_category;
  addReason(reasons, categoryValid ? "DECISION_CATEGORY_VALID" : "DECISION_CATEGORY_MISMATCH");

  const timestampValid = !Number.isNaN(Date.parse(decision.decision_timestamp));
  addReason(reasons, timestampValid ? "DECISION_TIMESTAMP_VALID" : "DECISION_TIMESTAMP_INVALID");
  const versionPresent = decision.decision_version.length > 0;
  addReason(reasons, versionPresent ? "DECISION_VERSION_PRESENT" : "DECISION_VERSION_MISSING");

  const rationalePresent = decision.decision_payload.decision_rationale.trim().length > 0
    && decision.decision_payload.decision_summary.trim().length > 0
    && input.missingRationaleDetected !== true;
  addReason(reasons, rationalePresent ? "RATIONALE_PRESENT" : "RATIONALE_MISSING");
  const reasoningPresent = decision.decision_payload.decision_reasoning.length > 0
    && decision.decision_payload.decision_reasoning.every((item) => item.trim().length > 0)
    && input.emptyReasoningDetected !== true;
  addReason(reasons, reasoningPresent ? "REASONING_PRESENT" : "REASONING_MISSING");

  const supportingEvidencePresent = decision.supporting_evidence_ids.length > 0
    && input.missingSupportingEvidenceDetected !== true;
  addReason(reasons, supportingEvidencePresent ? "SUPPORTING_EVIDENCE_PRESENT" : "SUPPORTING_EVIDENCE_MISSING");
  const evidenceResolvable = supportingEvidencePresent
    && input.unresolvableEvidenceDetected !== true
    && decision.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceResolvable ? "SUPPORTING_EVIDENCE_RESOLVABLE" : "SUPPORTING_EVIDENCE_UNRESOLVABLE");

  const governanceBindingPresent = decision.governance_binding.governance_policy_ids.length > 0
    && decision.governance_binding.governance_constraints.length > 0
    && decision.governance_binding.authority_scope.trim().length > 0
    && decision.governance_binding.governance_references.length > 0
    && input.missingGovernanceBindingDetected !== true;
  addReason(reasons, governanceBindingPresent ? "GOVERNANCE_BINDING_PRESENT" : "GOVERNANCE_BINDING_MISSING");
  const authorityScopeValid = input.authorityScopeViolationDetected !== true
    && decision.governance_binding.authority_scope.trim().length > 0
    && decision.authority_binding.authority_scope.trim().length > 0
    && decision.authority_binding.authority_scope === decision.governance_binding.authority_scope;
  addReason(reasons, authorityScopeValid ? "AUTHORITY_SCOPE_VALID" : "AUTHORITY_SCOPE_VIOLATION");

  const authorityBindingPresent = decision.authority_binding.decision_authority.trim().length > 0
    && decision.authority_binding.authority_scope.trim().length > 0
    && !Number.isNaN(Date.parse(decision.authority_binding.authority_timestamp))
    && input.missingAuthorityBindingDetected !== true;
  addReason(reasons, authorityBindingPresent ? "AUTHORITY_BINDING_PRESENT" : "AUTHORITY_BINDING_MISSING");
  const authorityTypeValid = AUTHORITY_TYPES.has(decision.authority_binding.authority_type)
    && input.unknownAuthorityDetected !== true;
  addReason(reasons, authorityTypeValid ? "AUTHORITY_TYPE_VALID" : "AUTHORITY_TYPE_INVALID");
  const authorityEvidencePresent = decision.authority_binding.authority_evidence.length > 0
    && input.missingAuthorityEvidenceDetected !== true;
  addReason(reasons, authorityEvidencePresent ? "AUTHORITY_EVIDENCE_PRESENT" : "AUTHORITY_EVIDENCE_MISSING");

  const confidenceScorePresent = Number.isFinite(decision.confidence_binding.confidence_score)
    && input.missingConfidenceScoreDetected !== true;
  addReason(reasons, confidenceScorePresent ? "CONFIDENCE_SCORE_PRESENT" : "CONFIDENCE_SCORE_MISSING");
  const confidenceStateValid = CONFIDENCE_STATES.has(decision.confidence_binding.confidence_state)
    && input.unsupportedConfidenceStateDetected !== true;
  addReason(reasons, confidenceStateValid ? "CONFIDENCE_STATE_VALID" : "CONFIDENCE_STATE_INVALID");
  const confidenceRationalePresent = decision.confidence_binding.confidence_rationale.trim().length > 0
    && decision.confidence_binding.confidence_evidence.length > 0
    && input.confidenceCorruptionDetected !== true;
  addReason(reasons, confidenceRationalePresent ? "CONFIDENCE_RATIONALE_PRESENT" : "CONFIDENCE_RATIONALE_MISSING");

  const stateKnown = DECISION_STATES.has(decision.decision_state) && input.unknownStateDetected !== true;
  addReason(reasons, stateKnown ? "STATE_VALID" : "STATE_INVALID");
  const stateTransitionValid = stateKnown
    && input.invalidStateTransitionDetected !== true
    && isValidStateTransition(input.priorState, decision.decision_state);
  addReason(reasons, stateTransitionValid ? "STATE_TRANSITION_VALID" : "STATE_TRANSITION_INVALID");

  const replayBindingValid = input.replayReferencesResolvable !== false && decision.replay_reference_ids.length > 0;
  addReason(reasons, replayBindingValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");
  const replayHashValid = input.replayHashMismatchDetected !== true;
  addReason(reasons, replayHashValid ? "REPLAY_HASH_VALID" : "REPLAY_HASH_MISMATCH");

  const tenantScoped = (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id)
    && decision.tenant_id === input.request.tenant_id;
  addReason(reasons, tenantScoped ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !supportingEvidencePresent
    ? "INCOMPLETE_EVIDENCE"
    : !replayBindingValid
      ? "UNREPLAYABLE"
      : !decisionHashValid || !replayHashValid || input.replayMismatchDetected === true || input.confidenceCorruptionDetected === true
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
  addReason(reasons, "DECISION_CONTRACT_IS_NOT_CONTROL");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");
  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const pass = decisionIdPresent
    && decisionIdUnique
    && identityImmutable
    && decisionHashValid
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
    && authorityBindingPresent
    && authorityTypeValid
    && authorityEvidencePresent
    && confidenceScorePresent
    && confidenceStateValid
    && confidenceRationalePresent
    && stateKnown
    && stateTransitionValid
    && replayBindingValid
    && replayHashValid
    && tenantScoped
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
    && decisionIdUnique
    && identityImmutable
    && decisionHashValid
    && typeValid
    && typeNotDeprecated
    && categoryValid
    && rationalePresent
    && reasoningPresent
    && supportingEvidencePresent
    && evidenceResolvable
    && governanceBindingPresent
    && authorityScopeValid
    && authorityBindingPresent
    && authorityTypeValid
    && authorityEvidencePresent
    && confidenceScorePresent
    && confidenceStateValid
    && confidenceRationalePresent
    && stateKnown
    && stateTransitionValid
    && replayBindingValid
    && replayHashValid
    && tenantScoped
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
      !decisionIdUnique && "duplicate identity",
      !identityImmutable && "identity mutation detected",
      !typeValid && "unknown decision type",
      !typeNotDeprecated && "deprecated decision type",
      !categoryValid && "category mismatch",
      !rationalePresent && "missing rationale",
      !supportingEvidencePresent && "missing supporting evidence",
      !evidenceResolvable && "unresolvable evidence",
      !governanceBindingPresent && "missing governance binding",
      !authorityScopeValid && "authority scope violation",
      !authorityBindingPresent && "missing authority binding",
      !authorityTypeValid && "unknown authority",
      !confidenceScorePresent && "missing confidence score",
      !confidenceStateValid && "unsupported confidence state",
      !stateTransitionValid && "invalid state transition",
      replayResult === "MISMATCH" && "decision replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthDecisionLedgerEntry = Object.freeze({
    decision_id: decision.decision_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    decision_state: decision.decision_state,
    decision_type: decision.decision_type,
    decision_category: decision.decision_category,
    authority_type: decision.authority_binding.authority_type,
    confidence_state: decision.confidence_binding.confidence_state,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });

  const visibility: TruthDecisionContractVisibility = Object.freeze({
    decision_id: decision.decision_id,
    decision_type: decision.decision_type,
    decision_category: decision.decision_category,
    decision_state: decision.decision_state,
    decision_authority: decision.authority_binding.decision_authority,
    authority_type: decision.authority_binding.authority_type,
    confidence_state: decision.confidence_binding.confidence_state,
    confidence_score: decision.confidence_binding.confidence_score,
    governance_scope: decision.governance_binding.authority_scope,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    timestamp: decision.decision_timestamp,
    readOnly: true,
    tenantScoped,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScoped ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthDecisionContractObservability = Object.freeze({
    decisions_created_total: 1,
    decisions_validated_total: decision.decision_state === "VALIDATED" ? 1 : 0,
    decisions_active_total: decision.decision_state === "ACTIVE" ? 1 : 0,
    decisions_superseded_total: decision.decision_state === "SUPERSEDED" ? 1 : 0,
    decision_validation_failures: pass || conditional ? 0 : 1,
    authority_binding_failures: authorityBindingPresent && authorityTypeValid && authorityEvidencePresent ? 0 : 1,
    governance_binding_failures: governanceBindingPresent && authorityScopeValid ? 0 : 1,
    confidence_binding_failures: confidenceScorePresent && confidenceStateValid && confidenceRationalePresent ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    state_transition_failures: stateTransitionValid ? 0 : 1,
  });

  const validation: TruthDecisionContractValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    identityValid: decisionIdUnique && identityImmutable && decisionHashValid,
    typeValid: typeValid && typeNotDeprecated,
    categoryValid,
    rationaleValid: rationalePresent && reasoningPresent,
    evidenceValid: supportingEvidencePresent && evidenceResolvable,
    governanceValid: governanceBindingPresent && authorityScopeValid,
    authorityValid: authorityBindingPresent && authorityTypeValid && authorityEvidencePresent,
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

  const replay: TruthDecisionContractReplay = Object.freeze({
    replayResult,
    reconstructedDecision: decision,
  });

  return Object.freeze({
    request: requestCore(input.request),
    decision,
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
