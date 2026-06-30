import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionCertificationGate,
  TruthCertificationState,
  TruthDecisionCertificationContract,
  TruthDecisionCertificationDomain,
  TruthDecisionCertificationInput,
  TruthDecisionCertificationLedgerEntry,
  TruthDecisionCertificationObservability,
  TruthDecisionCertificationReasonCode,
  TruthDecisionCertificationReplay,
  TruthDecisionCertificationRequest,
  TruthDecisionCertificationValidation,
  TruthDecisionCertificationVisibility,
  TruthDecisionLayerCompletionGate,
  TruthReplayResult,
} from "./types";

const DEFAULT_SCOPE: readonly TruthDecisionCertificationDomain[] = Object.freeze([
  "6F.1 Decision Contract",
  "6F.2 Decision Recorder",
  "6F.3 Decision Evolution Tracker",
  "6F.4 Decision Replay Binder",
  "Replay Preservation",
  "Authority Integrity",
  "Governance Compliance",
  "Confidence Integrity",
  "Tenant Isolation",
  "Operator Visibility",
]);

function addReason(reasons: TruthDecisionCertificationReasonCode[], reason: TruthDecisionCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthDecisionCertificationRequest): TruthDecisionCertificationRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))]);
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function completionGate(state: TruthCertificationState): TruthDecisionLayerCompletionGate {
  if (state === "PASS") return "DECISION_LAYER_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "DECISION_LAYER_CONDITIONAL";
  return "DECISION_LAYER_FAILED";
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

export function buildTruthDecisionCertificationRequest(
  request: TruthDecisionCertificationRequest,
): TruthDecisionCertificationRequest {
  return requestCore(request);
}

export function sealTruthDecisionCertificationGate(
  input: TruthDecisionCertificationInput,
): SealedTruthDecisionCertificationGate {
  const reasons: TruthDecisionCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  const decision = input.decisionContract.decision;

  const scopeValid = scope.length > 0;
  addReason(reasons, scopeValid ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");
  const authorityValid = input.certificationAuthority.trim().length > 0;
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");

  const evidenceReferences = unique(input.evidenceReferences ?? [
    ...input.decisionContract.decision.supporting_evidence_ids,
    ...input.decisionRecorder.record.evidence_references,
    ...input.decisionEvolution.evolution.evidence_references,
    ...input.decisionReplayBinder.replay.evidence_references,
    ...input.decisionReplayCertification.certification.evidence_references,
  ]);
  const replayReferences = unique(input.replayReferences ?? [
    ...input.decisionContract.decision.replay_reference_ids,
    ...input.decisionRecorder.record.replay_references,
    ...input.decisionEvolution.evolution.replay_references,
    input.decisionReplayBinder.replay.replay_id,
    input.decisionReplayCertification.certification.replay_id,
  ]);
  const evidenceValid = evidenceReferences.length > 0;
  const replayReferencesValid = replayReferences.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  addReason(reasons, replayReferencesValid ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");

  const decisionContractCertified = input.decisionContract.certification === "PASS"
    && input.decisionContract.validation.valid
    && input.decisionContract.validation.identityValid
    && input.decisionContract.validation.typeValid
    && input.decisionContract.validation.categoryValid
    && input.decisionContract.validation.rationaleValid
    && input.decisionContract.validation.evidenceValid
    && input.duplicateDecisionIdentityDetected !== true;
  addReason(reasons, decisionContractCertified ? "DECISION_CONTRACT_CERTIFIED" : "DECISION_CONTRACT_FAILED");

  const decisionRecorderCertified = input.decisionRecorder.certification === "PASS"
    && input.decisionRecorder.validation.valid
    && input.decisionRecorder.validation.lineageValid
    && input.decisionRecorder.validation.transactionProtected
    && input.acceptedRecommendationLostDetected !== true
    && input.rejectedRecommendationLostDetected !== true
    && input.operatorActionLostDetected !== true
    && input.partialCommitDetected !== true;
  addReason(reasons, decisionRecorderCertified ? "DECISION_RECORDER_CERTIFIED" : "DECISION_RECORDER_FAILED");

  const decisionEvolutionCertified = input.decisionEvolution.certification === "PASS"
    && input.decisionEvolution.validation.valid
    && input.decisionEvolution.validation.revisionValid
    && input.decisionEvolution.validation.versionValid
    && input.decisionEvolution.validation.lineageValid
    && input.decisionEvolution.validation.impactValid
    && input.brokenDecisionLineageDetected !== true
    && input.duplicateVersionDetected !== true
    && input.missingSupersessionTargetDetected !== true;
  addReason(reasons, decisionEvolutionCertified ? "DECISION_EVOLUTION_CERTIFIED" : "DECISION_EVOLUTION_FAILED");

  const decisionReplayCertified = input.decisionReplayBinder.certification === "PASS"
    && input.decisionReplayBinder.validation.valid
    && input.decisionReplayCertification.certification.certification_state === "PASS"
    && input.decisionReplayCertification.validation.valid
    && input.decisionReplayCertification.validation.exactReconstructionCertified;
  addReason(reasons, decisionReplayCertified ? "DECISION_REPLAY_CERTIFIED" : "DECISION_REPLAY_FAILED");

  const replayPreservationCertified = input.decisionContract.replay.replayResult === "REPRODUCED"
    && input.decisionRecorder.replay.replayResult === "REPRODUCED"
    && input.decisionEvolution.replay.replayResult === "REPRODUCED"
    && input.decisionReplayBinder.replayResult.replayResult === "REPRODUCED"
    && input.decisionReplayCertification.replay.replayResult === "REPRODUCED"
    && input.replayMismatchDetected !== true;
  addReason(reasons, replayPreservationCertified ? "REPLAY_PRESERVATION_CERTIFIED" : "REPLAY_PRESERVATION_FAILED");

  const authorityIntegrityCertified = input.decisionContract.validation.authorityValid
    && input.decisionRecorder.validation.decisionValid
    && input.decisionEvolution.validation.valid
    && input.decisionReplayBinder.validation.authorityValid
    && input.decisionReplayCertification.validation.authorityCertified
    && input.authorityMismatchDetected !== true
    && input.authorityExpansionDetected !== true
    && input.authorityCorruptionDetected !== true;
  addReason(reasons, authorityIntegrityCertified ? "AUTHORITY_INTEGRITY_CERTIFIED" : "AUTHORITY_INTEGRITY_FAILED");

  const governanceComplianceCertified = input.decisionContract.validation.governanceValid
    && input.decisionRecorder.validation.decisionValid
    && input.decisionReplayBinder.validation.governanceValid
    && input.governanceBypassDetected !== true
    && input.policyViolationDetected !== true;
  addReason(reasons, governanceComplianceCertified ? "GOVERNANCE_COMPLIANCE_CERTIFIED" : "GOVERNANCE_COMPLIANCE_FAILED");

  const confidenceIntegrityCertified = input.decisionContract.validation.confidenceValid
    && input.decisionRecorder.validation.decisionValid
    && input.decisionReplayBinder.validation.confidenceValid
    && input.decisionReplayCertification.validation.confidenceCertified
    && input.confidenceCorruptionDetected !== true
    && input.unsupportedConfidenceStateDetected !== true;
  addReason(reasons, confidenceIntegrityCertified ? "CONFIDENCE_INTEGRITY_CERTIFIED" : "CONFIDENCE_INTEGRITY_FAILED");

  const tenantIsolationCertified = input.crossTenantAccessDetected !== true
    && input.crossTenantReplayAccessDetected !== true
    && input.crossTenantLineageAccessDetected !== true
    && input.crossTenantVisibilityDetected !== true
    && input.decisionContract.visibility.tenantScoped
    && input.decisionRecorder.visibility.tenantScoped
    && input.decisionEvolution.visibility.tenantScoped
    && input.decisionReplayBinder.visibility.tenantScoped
    && input.decisionReplayCertification.visibility.tenantScoped
    && decision.tenant_id === input.request.tenant_id
    && input.decisionRecorder.record.tenant_id === input.request.tenant_id
    && input.decisionEvolution.evolution.tenant_id === input.request.tenant_id
    && input.decisionReplayBinder.replay.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");

  const operatorVisibilityCertified = input.hiddenDecisionDetected !== true
    && input.hiddenAuthorityIssueDetected !== true
    && input.hiddenGovernanceIssueDetected !== true
    && input.hiddenCertificationFailureDetected !== true
    && input.decisionContract.visibility.readOnly
    && input.decisionRecorder.visibility.readOnly
    && input.decisionEvolution.visibility.readOnly
    && input.decisionReplayBinder.visibility.readOnly
    && input.decisionReplayCertification.visibility.readOnly;
  addReason(reasons, operatorVisibilityCertified ? "OPERATOR_VISIBILITY_CERTIFIED" : "OPERATOR_VISIBILITY_FAILED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const reportingLimitationsAbsent = input.reportingLimitationDetected !== true;
  addReason(reasons, reportingLimitationsAbsent ? "REPORTING_LIMITATIONS_ABSENT" : "REPORTING_LIMITATIONS_PRESENT");

  const failClosed = input.decisionContract.validation.failClosed
    && input.decisionRecorder.validation.failClosed
    && input.decisionEvolution.validation.failClosed
    && input.decisionReplayBinder.validation.failClosed
    && input.decisionReplayCertification.validation.failClosedCertified;
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
  addReason(reasons, "DECISION_CERTIFICATION_GATE_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayReferencesValid
      ? "UNREPLAYABLE"
      : !replayPreservationCertified
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

  const allCriticalPass = scopeValid
    && authorityValid
    && evidenceValid
    && replayReferencesValid
    && decisionContractCertified
    && decisionRecorderCertified
    && decisionEvolutionCertified
    && decisionReplayCertified
    && replayPreservationCertified
    && authorityIntegrityCertified
    && governanceComplianceCertified
    && confidenceIntegrityCertified
    && tenantIsolationCertified
    && operatorVisibilityCertified
    && observabilityOperational
    && reportingLimitationsAbsent
    && failClosed
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditionalEligible = !allCriticalPass
    && input.observabilityGapDetected === true
    && input.reportingLimitationDetected === true
    && input.remediationPlanExists === true
    && input.governanceApproved === true
    && scopeValid
    && authorityValid
    && evidenceValid
    && replayReferencesValid
    && decisionContractCertified
    && decisionRecorderCertified
    && decisionEvolutionCertified
    && decisionReplayCertified
    && replayPreservationCertified
    && authorityIntegrityCertified
    && governanceComplianceCertified
    && confidenceIntegrityCertified
    && tenantIsolationCertified
    && operatorVisibilityCertified
    && failClosed
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const certificationStateValue = certificationState(allCriticalPass, conditionalEligible);
  addReason(
    reasons,
    certificationStateValue === "PASS"
      ? "CERTIFICATION_PASS"
      : certificationStateValue === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const failedComponents = [
    !decisionContractCertified && "6F.1 Decision Contract",
    !decisionRecorderCertified && "6F.2 Decision Recorder",
    !decisionEvolutionCertified && "6F.3 Decision Evolution Tracker",
    !decisionReplayCertified && "6F.4 Decision Replay Binder",
    !replayPreservationCertified && "Replay Preservation",
    !authorityIntegrityCertified && "Authority Integrity",
    !governanceComplianceCertified && "Governance Compliance",
    !confidenceIntegrityCertified && "Confidence Integrity",
    !tenantIsolationCertified && "Tenant Isolation",
    !operatorVisibilityCertified && "Operator Visibility",
  ].filter(Boolean) as string[];

  const requiredActions = [
    !evidenceValid && "attach evidence references",
    !replayReferencesValid && "attach replay references",
    !decisionContractCertified && "repair decision contract failures",
    !decisionRecorderCertified && "repair decision recorder failures",
    !decisionEvolutionCertified && "repair decision evolution failures",
    !decisionReplayCertified && "repair decision replay failures",
    !replayPreservationCertified && "restore decision replay preservation",
    !authorityIntegrityCertified && "restore authority integrity",
    !governanceComplianceCertified && "restore governance compliance",
    !confidenceIntegrityCertified && "restore confidence integrity",
    !tenantIsolationCertified && "restore tenant isolation",
    !operatorVisibilityCertified && "restore operator visibility",
  ].filter(Boolean) as string[];

  const decisionLayerVersion = input.decisionLayerVersion ?? "truth-decision-layer/v1";
  const certification: TruthDecisionCertificationContract = Object.freeze({
    certification_id: hashValue("mission-control-decision-certification-id", {
      tenant_id: input.request.tenant_id,
      certification_timestamp: input.request.now,
      authority: input.certificationAuthority,
      decision_id: decision.decision_id,
      decision_layer_version: decisionLayerVersion,
    }),
    certification_timestamp: input.request.now,
    decision_layer_version: decisionLayerVersion,
    certification_scope: scope,
    certification_state: certificationStateValue,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const completionGateValue = completionGate(certificationStateValue);
  const ledgerEntry: TruthDecisionCertificationLedgerEntry = Object.freeze({
    certification_id: certification.certification_id,
    tenant_id: input.request.tenant_id,
    decision_id: decision.decision_id,
    certification_state: certification.certification_state,
    completion_gate: completionGateValue,
    replay_status: replayResult,
    failed_components: Object.freeze([...failedComponents]),
    required_actions: Object.freeze([...requiredActions]),
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthDecisionCertificationVisibility = Object.freeze({
    certification_state: certification.certification_state,
    decision_layer_version: certification.decision_layer_version,
    certified_components: Object.freeze(scope.filter((domain) => !failedComponents.includes(domain))),
    failed_components: Object.freeze([...failedComponents]),
    authority_status: authorityIntegrityCertified ? "PASS" : "FAIL",
    confidence_status: confidenceIntegrityCertified ? "PASS" : "FAIL",
    governance_status: governanceComplianceCertified ? "PASS" : "FAIL",
    tenant_status: tenantIsolationCertified ? "PASS" : "FAIL",
    replay_status: replayResult,
    visibility_status: operatorVisibilityCertified ? "PASS" : "FAIL",
    required_actions: Object.freeze([...requiredActions]),
    certification_timestamp: certification.certification_timestamp,
    certification_authority: certification.certification_authority,
    readOnly: true,
    tenantScoped: tenantIsolationCertified,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationCertified ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthDecisionCertificationObservability = Object.freeze({
    decision_certifications_total: 1,
    decision_pass_total: certificationStateValue === "PASS" ? 1 : 0,
    decision_conditional_total: certificationStateValue === "CONDITIONAL_PASS" ? 1 : 0,
    decision_fail_total: certificationStateValue === "FAIL" ? 1 : 0,
    contract_failures: decisionContractCertified ? 0 : 1,
    recorder_failures: decisionRecorderCertified ? 0 : 1,
    evolution_failures: decisionEvolutionCertified ? 0 : 1,
    replay_failures: decisionReplayCertified ? 0 : 1,
    authority_failures: authorityIntegrityCertified ? 0 : 1,
    confidence_failures: confidenceIntegrityCertified ? 0 : 1,
    governance_failures: governanceComplianceCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    visibility_failures: operatorVisibilityCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthDecisionCertificationValidation = Object.freeze({
    valid: certificationStateValue !== "FAIL",
    validationState: certificationStateValue === "FAIL" ? "INVALID" : "VALID",
    reasonCodes: Object.freeze([...reasons]),
    scopeValid,
    authorityValid,
    evidenceValid,
    replayReferencesValid,
    decisionContractCertified,
    decisionRecorderCertified,
    decisionEvolutionCertified,
    decisionReplayCertified,
    replayPreservationCertified,
    authorityIntegrityCertified,
    governanceComplianceCertified,
    confidenceIntegrityCertified,
    tenantIsolationCertified,
    operatorVisibilityCertified,
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

  const replay: TruthDecisionCertificationReplay = Object.freeze({
    replayResult,
    executedTests: scope,
    decisionState: certificationStateValue,
  });

  return Object.freeze({
    request: requestCore(input.request),
    certification,
    validation,
    replay,
    visibility,
    observability,
    ledgerEntry,
    completionGate: completionGateValue,
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
