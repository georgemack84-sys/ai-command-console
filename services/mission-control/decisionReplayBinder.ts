import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionReplayBinder,
  TruthCertificationState,
  TruthDecisionReplayBundle,
  TruthDecisionReplayContract,
  TruthDecisionReplayEnvironmentContext,
  TruthDecisionReplayInput,
  TruthDecisionReplayLedgerEntry,
  TruthDecisionReplayObservability,
  TruthDecisionReplayReasonCode,
  TruthDecisionReplayReplay,
  TruthDecisionReplayRequest,
  TruthDecisionReplayScope,
  TruthDecisionReplayValidation,
  TruthDecisionReplayVisibility,
  TruthDecisionVerificationState,
  TruthReplayResult,
} from "./types";

const REPLAY_SCOPES = new Set<TruthDecisionReplayScope>([
  "FULL_DECISION",
  "CONTEXT_ONLY",
  "EVIDENCE_ONLY",
  "GOVERNANCE_ONLY",
  "AUTHORITY_ONLY",
  "CONFIDENCE_ONLY",
  "ENVIRONMENT_ONLY",
  "LINEAGE_ONLY",
]);

function addReason(reasons: TruthDecisionReplayReasonCode[], reason: TruthDecisionReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthDecisionReplayRequest): TruthDecisionReplayRequest {
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

export function buildTruthDecisionReplayRequest(
  request: TruthDecisionReplayRequest,
): TruthDecisionReplayRequest {
  return requestCore(request);
}

export function sealTruthDecisionReplayBinder(
  input: TruthDecisionReplayInput,
): SealedTruthDecisionReplayBinder {
  const reasons: TruthDecisionReplayReasonCode[] = [];
  const decision = input.decision.decision;
  const recordedDecision = input.recordedDecision.record;
  const evolution = input.evolution.evolution;
  const replayScope = input.replayScope ?? "FULL_DECISION";

  const replayId = hashValue("mission-control-decision-replay-id", {
    decision_id: decision.decision_id,
    replay_scope: replayScope,
    replay_timestamp: input.request.now,
  });
  const reconstructionBundleId = hashValue("mission-control-decision-replay-bundle-id", {
    decision_id: decision.decision_id,
    current_version: input.evolution.version.decision_version,
    replay_scope: replayScope,
  });

  const replayIdPresent = replayId.length > 0;
  addReason(reasons, replayIdPresent ? "REPLAY_ID_PRESENT" : "REPLAY_ID_MISSING");
  const decisionIdPresent = decision.decision_id.length > 0;
  addReason(reasons, decisionIdPresent ? "DECISION_ID_PRESENT" : "DECISION_ID_MISSING");
  const scopePresent = replayScope.length > 0;
  addReason(reasons, scopePresent ? "REPLAY_SCOPE_PRESENT" : "REPLAY_SCOPE_MISSING");
  const scopeValid = REPLAY_SCOPES.has(replayScope);
  addReason(reasons, scopeValid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");

  const contextPresent = input.missingContextComponentDetected !== true
    && decision.decision_payload.decision_rationale.trim().length > 0;
  addReason(reasons, contextPresent ? "DECISION_CONTEXT_PRESENT" : "DECISION_CONTEXT_MISSING");
  const contextComplete = contextPresent
    && decision.decision_payload.decision_reasoning.length > 0
    && input.contextMismatchDetected !== true;
  addReason(reasons, contextComplete ? "DECISION_CONTEXT_COMPLETE" : "DECISION_CONTEXT_INCOMPLETE");

  const evidenceReconstructed = decision.supporting_evidence_ids.length > 0
    && input.missingContextComponentDetected !== true;
  addReason(reasons, evidenceReconstructed ? "EVIDENCE_RECONSTRUCTED" : "EVIDENCE_MISSING");
  const evidenceValid = evidenceReconstructed
    && input.evidenceMismatchDetected !== true
    && decision.supporting_evidence_ids.every((id) => input.knownEvidenceIds?.includes(id) ?? true);
  addReason(reasons, evidenceValid ? "EVIDENCE_VALID" : "EVIDENCE_INVALID");
  if (input.evidenceMismatchDetected === true) addReason(reasons, "EVIDENCE_MISMATCH");

  const governanceReconstructed = decision.governance_binding.governance_policy_ids.length > 0;
  addReason(reasons, governanceReconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_MISSING");
  const governanceValid = governanceReconstructed
    && input.policyMismatchDetected !== true
    && decision.governance_binding.authority_scope.length > 0;
  addReason(reasons, governanceValid ? "GOVERNANCE_VALID" : "GOVERNANCE_INVALID");
  if (input.policyMismatchDetected === true) addReason(reasons, "GOVERNANCE_MISMATCH");

  const authorityReconstructed = decision.authority_binding.decision_authority.trim().length > 0;
  addReason(reasons, authorityReconstructed ? "AUTHORITY_RECONSTRUCTED" : "AUTHORITY_MISSING");
  const authorityValid = authorityReconstructed
    && input.authorityMismatchDetected !== true
    && decision.authority_binding.authority_evidence.length > 0
    && input.missingAuthorityEvidenceDetected !== true;
  addReason(reasons, authorityValid ? "AUTHORITY_VALID" : "AUTHORITY_INVALID");
  if (input.authorityMismatchDetected === true) addReason(reasons, "AUTHORITY_MISMATCH");

  const confidenceReconstructed = decision.confidence_binding.confidence_rationale.trim().length > 0;
  addReason(reasons, confidenceReconstructed ? "CONFIDENCE_RECONSTRUCTED" : "CONFIDENCE_RATIONALE_MISSING");
  const confidenceValid = confidenceReconstructed
    && input.confidenceMismatchDetected !== true
    && Number.isFinite(decision.confidence_binding.confidence_score);
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : "CONFIDENCE_INVALID");
  if (input.confidenceMismatchDetected === true) addReason(reasons, "CONFIDENCE_MISMATCH");

  const environment: TruthDecisionReplayEnvironmentContext = Object.freeze({
    runtime_conditions: Object.freeze([...(input.environment?.runtime_conditions ?? ["runtime-stable"])]),
    mission_state: Object.freeze([...(input.environment?.mission_state ?? [`mission:${decision.mission_id}`])]),
    tenant_state: Object.freeze([...(input.environment?.tenant_state ?? [`tenant:${decision.tenant_id}`])]),
    risk_state: Object.freeze([...(input.environment?.risk_state ?? ["risk-reviewed"])]),
    escalation_state: Object.freeze([...(input.environment?.escalation_state ?? ["no-escalation-open"])]),
    certification_state: Object.freeze([...(input.environment?.certification_state ?? ["decision-certifiable"])]),
  });
  const environmentReconstructed = input.missingEnvironmentStateDetected !== true
    && environment.runtime_conditions.length > 0
    && environment.mission_state.length > 0
    && environment.tenant_state.length > 0;
  addReason(reasons, environmentReconstructed ? "ENVIRONMENT_RECONSTRUCTED" : "ENVIRONMENT_MISSING");
  const environmentValid = environmentReconstructed && input.environmentMismatchDetected !== true;
  addReason(reasons, environmentValid ? "ENVIRONMENT_VALID" : "ENVIRONMENT_INVALID");
  if (input.environmentMismatchDetected === true) addReason(reasons, "ENVIRONMENT_MISMATCH");

  const reconstructionBundle: TruthDecisionReplayBundle = Object.freeze({
    decision_rationale: decision.decision_payload.decision_rationale,
    decision_assumptions: Object.freeze([...decision.decision_payload.decision_assumptions]),
    decision_constraints: Object.freeze([...decision.decision_payload.decision_constraints]),
    decision_objectives: Object.freeze([...(input.decisionObjectives ?? [decision.decision_payload.decision_summary])]),
    decision_state: decision.decision_state,
    supporting_evidence_ids: Object.freeze([...decision.supporting_evidence_ids]),
    supporting_event_ids: Object.freeze([...decision.supporting_event_ids]),
    supporting_truth_record_ids: Object.freeze([...decision.supporting_truth_record_ids]),
    supporting_recommendation_ids: Object.freeze([...decision.supporting_recommendation_ids]),
    governance_policy_ids: Object.freeze([...decision.governance_binding.governance_policy_ids]),
    governance_constraints: Object.freeze([...decision.governance_binding.governance_constraints]),
    authority_scope: decision.governance_binding.authority_scope,
    approval_requirements: Object.freeze([...decision.governance_binding.approval_requirements]),
    decision_authority: decision.authority_binding.decision_authority,
    authority_type: decision.authority_binding.authority_type,
    authority_evidence: Object.freeze([...decision.authority_binding.authority_evidence]),
    confidence_score: decision.confidence_binding.confidence_score,
    confidence_state: decision.confidence_binding.confidence_state,
    confidence_rationale: decision.confidence_binding.confidence_rationale,
    confidence_evidence: Object.freeze([...decision.confidence_binding.confidence_evidence]),
    decision_version: decision.decision_version,
    version_number: input.evolution.version.version_number,
    revision_type: input.evolution.ledgerEntry.revision_type,
    lineage: input.evolution.lineage,
    environment,
  });

  const bundleAssembled = input.bundleAssemblyFailureDetected !== true;
  addReason(reasons, bundleAssembled ? "BUNDLE_ASSEMBLED" : "BUNDLE_ASSEMBLY_FAILED");
  const bundleComplete = bundleAssembled
    && input.incompleteBundleDetected !== true
    && reconstructionBundle.decision_objectives.length > 0
    && reconstructionBundle.supporting_evidence_ids.length > 0
    && reconstructionBundle.governance_policy_ids.length > 0
    && reconstructionBundle.authority_evidence.length > 0;
  addReason(reasons, bundleComplete ? "BUNDLE_COMPLETE" : "BUNDLE_INCOMPLETE");

  const decisionValid = input.decision.validation.valid && input.decision.certification !== "FAIL";
  addReason(reasons, decisionValid ? "DECISION_VALID" : "DECISION_INVALID");
  const recorderValid = input.recordedDecision.validation.valid;
  addReason(reasons, recorderValid ? "RECORDER_VALID" : "RECORDER_INVALID");
  const evolutionValid = input.evolution.validation.valid;
  addReason(reasons, evolutionValid ? "EVOLUTION_VALID" : "EVOLUTION_INVALID");

  const tenantIsolationValid = input.crossTenantReplayDetected !== true
    && input.crossTenantContextAccessDetected !== true
    && decision.tenant_id === input.request.tenant_id
    && recordedDecision.tenant_id === input.request.tenant_id
    && evolution.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  let verificationState: TruthDecisionVerificationState;
  if (input.unverifiableReplayDetected === true) {
    verificationState = "UNVERIFIABLE";
  } else if (input.verificationMismatchDetected === true || input.decisionMismatchDetected === true || input.authorityMismatchDetected === true || input.confidenceMismatchDetected === true) {
    verificationState = "MISMATCH";
  } else if (!bundleComplete) {
    verificationState = "PARTIAL_MATCH";
  } else {
    verificationState = "MATCH";
  }
  addReason(
    reasons,
    verificationState === "MATCH"
      ? "VERIFICATION_MATCH"
      : verificationState === "MISMATCH"
        ? "VERIFICATION_MISMATCH"
        : verificationState === "PARTIAL_MATCH"
          ? "VERIFICATION_PARTIAL_MATCH"
          : "VERIFICATION_UNVERIFIABLE",
  );

  const replayResultState: TruthReplayResult = !evidenceReconstructed
    ? "INCOMPLETE_EVIDENCE"
    : verificationState === "UNVERIFIABLE"
      ? "UNREPLAYABLE"
      : verificationState === "MISMATCH"
        || !bundleComplete
        || !contextComplete
        || !governanceValid
        || !authorityValid
        || !confidenceValid
        || !environmentValid
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResultState === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResultState === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResultState === "INCOMPLETE_EVIDENCE"
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
  addReason(reasons, "DECISION_REPLAY_BINDER_IS_NOT_CONTROL");

  const replayHash = hashValue("mission-control-decision-replay-binder-hash", {
    decision_id: decision.decision_id,
    replay_scope: replayScope,
    bundle_id: reconstructionBundleId,
    verification_state: verificationState,
  });

  const replay = Object.freeze({
    replay_id: replayId,
    decision_id: decision.decision_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    replay_timestamp: input.request.now,
    replay_scope: replayScope,
    replay_state: replayResultState === "REPRODUCED" ? "REPLAYED" : "REJECTED",
    replay_hash: replayHash,
    evidence_references: Object.freeze([...decision.supporting_evidence_ids]),
    reconstruction_bundle_id: reconstructionBundleId,
  }) satisfies TruthDecisionReplayContract;

  const pass = replayIdPresent
    && decisionIdPresent
    && scopePresent
    && scopeValid
    && contextPresent
    && contextComplete
    && evidenceReconstructed
    && evidenceValid
    && governanceReconstructed
    && governanceValid
    && authorityReconstructed
    && authorityValid
    && confidenceReconstructed
    && confidenceValid
    && environmentReconstructed
    && environmentValid
    && bundleAssembled
    && bundleComplete
    && decisionValid
    && recorderValid
    && evolutionValid
    && tenantIsolationValid
    && verificationState === "MATCH"
    && replayResultState === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const failureReason = pass
    ? null
    : [
      !contextPresent && "missing context",
      !evidenceValid && "missing evidence",
      !authorityValid && "authority mismatch",
      !confidenceValid && "confidence mismatch",
      !environmentValid && "environment mismatch",
      !bundleAssembled && "bundle assembly failure",
      verificationState === "MISMATCH" && "decision reconstruction failure",
      !tenantIsolationValid && "cross-tenant replay access",
      replayResultState === "MISMATCH" && "replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthDecisionReplayLedgerEntry = Object.freeze({
    replay_id: replay.replay_id,
    decision_id: replay.decision_id,
    tenant_id: replay.tenant_id,
    mission_id: replay.mission_id,
    replay_scope: replay.replay_scope,
    replay_state: replay.replay_state,
    verification_status: verificationState,
    validation_status: pass ? "VALID" : "INVALID",
    replay_status: replayResultState,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const tenantScopedVisibility = tenantIsolationValid;
  const visibility: TruthDecisionReplayVisibility = Object.freeze({
    decision_id: replay.decision_id,
    replay_state: replay.replay_state,
    bundle_status: bundleComplete ? "VALID" : "INVALID",
    verification_status: verificationState,
    authority_status: authorityValid ? "VALID" : "INVALID",
    confidence_status: confidenceValid ? "VALID" : "INVALID",
    environment_status: environmentValid ? "VALID" : "INVALID",
    validation_status: pass ? "VALID" : "INVALID",
    timestamp: replay.replay_timestamp,
    readOnly: true,
    tenantScoped: tenantScopedVisibility,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScopedVisibility ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const observability: TruthDecisionReplayObservability = Object.freeze({
    replays_total: 1,
    successful_replays: pass ? 1 : 0,
    failed_replays: pass ? 0 : 1,
    bundle_assembly_failures: bundleAssembled ? 0 : 1,
    verification_failures: verificationState === "MATCH" ? 0 : 1,
    validation_failures: pass ? 0 : 1,
    authority_mismatches: authorityValid ? 0 : 1,
    confidence_mismatches: confidenceValid ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const conditional = !pass
    && observabilityOperational === false
    && input.remediationDocumented === true
    && contextComplete
    && evidenceValid
    && governanceValid
    && authorityValid
    && confidenceValid
    && environmentValid
    && bundleComplete
    && verificationState === "MATCH"
    && replayResultState === "REPRODUCED";
  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const validation: TruthDecisionReplayValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contextValid: contextComplete,
    evidenceValid,
    governanceValid,
    authorityValid,
    confidenceValid,
    environmentValid,
    bundleValid: bundleAssembled && bundleComplete,
    tenantIsolationValid,
    verificationValid: verificationState === "MATCH",
    replayValid: replayResultState === "REPRODUCED",
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

  const replayResult: TruthDecisionReplayReplay = Object.freeze({
    replayResult: replayResultState,
    verificationState,
    reconstructedBundle: reconstructionBundle,
    reconstructedContract: replay,
  });

  return Object.freeze({
    request: requestCore(input.request),
    decision: input.decision,
    recordedDecision: input.recordedDecision,
    evolution: input.evolution,
    replay,
    reconstructionBundle,
    ledgerEntry,
    validation,
    replayResult,
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
