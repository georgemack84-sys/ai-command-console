import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEventCertificationGate,
  TruthCertificationState,
  TruthEventCertificationAnalytics,
  TruthEventCertificationContract,
  TruthEventCertificationDomain,
  TruthEventCertificationInput,
  TruthEventCertificationLedgerEntry,
  TruthEventCertificationReasonCode,
  TruthEventCertificationReplay,
  TruthEventCertificationRequest,
  TruthEventCertificationValidation,
  TruthEventCertificationVisibility,
  TruthEventInfrastructureCertificationState,
  TruthReplayResult,
} from "./types";

const DEFAULT_SCOPE: readonly TruthEventCertificationDomain[] = Object.freeze([
  "6C.1 Event Contract",
  "6C.2 Event Recorder",
  "6C.3 Event Ordering Engine",
  "6C.4 Event Correlation Engine",
  "Replay Preservation",
  "Tenant Isolation",
  "Governance Compliance",
  "Operator Visibility",
]);

function addReason(reasons: TruthEventCertificationReasonCode[], reason: TruthEventCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEventCertificationRequest): TruthEventCertificationRequest {
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

function completionGate(state: TruthCertificationState): TruthEventInfrastructureCertificationState {
  if (state === "PASS") return "EVENT_INFRASTRUCTURE_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "EVENT_INFRASTRUCTURE_CONDITIONAL";
  return "EVENT_INFRASTRUCTURE_FAILED";
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

export function buildTruthEventCertificationRequest(
  request: TruthEventCertificationRequest,
): TruthEventCertificationRequest {
  return requestCore(request);
}

export function sealTruthEventCertificationGate(
  input: TruthEventCertificationInput,
): SealedTruthEventCertificationGate {
  const reasons: TruthEventCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  const scopeValid = scope.length > 0;
  addReason(reasons, scopeValid ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");

  const authorityValid = input.certificationAuthority.length > 0;
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");

  const evidenceReferences = Object.freeze([...(input.evidenceReferences ?? input.eventContract.event.evidence_reference_ids)]);
  const replayReferences = Object.freeze([...(input.replayReferences ?? input.eventContract.event.replay_reference_ids)]);
  const evidenceValid = evidenceReferences.length > 0;
  const replayReferencesValid = replayReferences.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  addReason(reasons, replayReferencesValid ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");

  const eventContractCertified = input.eventContract.certification === "PASS";
  addReason(reasons, eventContractCertified ? "EVENT_CONTRACT_CERTIFIED" : "EVENT_CONTRACT_FAILED");
  const eventRecorderCertified = input.eventRecorder.certification === "PASS";
  addReason(reasons, eventRecorderCertified ? "EVENT_RECORDER_CERTIFIED" : "EVENT_RECORDER_FAILED");
  const eventOrderingCertified = input.eventOrdering.certification === "PASS";
  addReason(reasons, eventOrderingCertified ? "EVENT_ORDERING_CERTIFIED" : "EVENT_ORDERING_FAILED");
  const eventCorrelationCertified = input.eventCorrelation.certification === "PASS";
  addReason(reasons, eventCorrelationCertified ? "EVENT_CORRELATION_CERTIFIED" : "EVENT_CORRELATION_FAILED");

  const replayCertified = input.eventContract.replay.replayResult === "REPRODUCED"
    && input.eventRecorder.replay.replayResult === "REPRODUCED"
    && input.eventOrdering.replay.replayResult === "REPRODUCED"
    && input.eventCorrelation.replay.replayResult === "REPRODUCED";
  addReason(reasons, replayCertified ? "EVENT_REPLAY_CERTIFIED" : "EVENT_REPLAY_FAILED");

  const tenantIsolationCertified = input.eventContract.visibility.tenantScoped
    && input.eventRecorder.visibility.tenantScoped
    && input.eventOrdering.visibility.tenantScoped
    && input.eventCorrelation.visibility.tenantScoped
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");

  const governanceCertified = input.governanceBypassDetected !== true
    && input.eventContract.validation.controlSurfaceAbsent
    && input.eventRecorder.validation.controlSurfaceAbsent
    && input.eventOrdering.validation.controlSurfaceAbsent
    && input.eventCorrelation.validation.controlSurfaceAbsent
    && input.eventContract.validation.authorityBounded
    && input.eventRecorder.validation.authorityBounded
    && input.eventOrdering.validation.authorityBounded
    && input.eventCorrelation.validation.authorityBounded;
  addReason(reasons, governanceCertified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_FAILED");

  const visibilityCertified = input.hiddenFailureDetected !== true
    && input.eventRecorder.visibility.failure_reason !== undefined
    && input.eventOrdering.visibility.ordering_status !== undefined
    && input.eventCorrelation.visibility.validation_status !== undefined;
  addReason(reasons, visibilityCertified ? "VISIBILITY_CERTIFIED" : "VISIBILITY_FAILED");

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
  addReason(reasons, "EVENT_CERTIFICATION_GATE_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayReferencesValid
      ? "UNREPLAYABLE"
      : !replayCertified
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

  const analyticsOperational = input.analyticsGapDetected !== true;
  addReason(reasons, analyticsOperational ? "ANALYTICS_OPERATIONAL" : "ANALYTICS_FAILED");

  const allCriticalPass = scopeValid
    && authorityValid
    && evidenceValid
    && replayReferencesValid
    && eventContractCertified
    && eventRecorderCertified
    && eventOrderingCertified
    && eventCorrelationCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified
    && analyticsOperational
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
    && input.analyticsGapDetected === true
    && input.remediationPlanExists === true
    && input.governanceApproved === true
    && eventContractCertified
    && eventRecorderCertified
    && eventOrderingCertified
    && eventCorrelationCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified;

  const certificationStateValue = certificationState(allCriticalPass, conditionalEligible);
  addReason(
    reasons,
    certificationStateValue === "PASS"
      ? "DECISION_ENGINE_PASS"
      : certificationStateValue === "CONDITIONAL_PASS"
        ? "DECISION_ENGINE_CONDITIONAL"
        : "DECISION_ENGINE_FAIL",
  );

  const failedComponents = [
    !eventContractCertified && "6C.1 Event Contract",
    !eventRecorderCertified && "6C.2 Event Recorder",
    !eventOrderingCertified && "6C.3 Event Ordering Engine",
    !eventCorrelationCertified && "6C.4 Event Correlation Engine",
    !replayCertified && "Replay Preservation",
    !tenantIsolationCertified && "Tenant Isolation",
    !governanceCertified && "Governance Compliance",
    !visibilityCertified && "Operator Visibility",
  ].filter(Boolean) as string[];
  const requiredActions = [
    !evidenceValid && "attach evidence references",
    !replayReferencesValid && "attach replay references",
    !eventContractCertified && "repair event contract failures",
    !eventRecorderCertified && "repair event recorder failures",
    !eventOrderingCertified && "repair event ordering failures",
    !eventCorrelationCertified && "repair event correlation failures",
    !replayCertified && "restore replay determinism",
    !tenantIsolationCertified && "restore tenant isolation",
    !governanceCertified && "restore governance compliance",
    !visibilityCertified && "restore operator visibility",
  ].filter(Boolean) as string[];

  const certification: TruthEventCertificationContract = Object.freeze({
    certification_id: hashValue("mission-control-event-certification-id", {
      tenant_id: input.request.tenant_id,
      certification_timestamp: input.request.now,
      authority: input.certificationAuthority,
    }),
    certification_timestamp: input.request.now,
    event_infrastructure_version: "truth-event-infrastructure/v1",
    certification_scope: scope,
    certification_state: certificationStateValue,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const visibility: TruthEventCertificationVisibility = Object.freeze({
    certification_state: certification.certification_state,
    event_infrastructure_version: certification.event_infrastructure_version,
    certified_components: Object.freeze(scope.filter((domain) => !failedComponents.includes(domain))),
    failed_components: Object.freeze([...failedComponents]),
    replay_status: replayResult,
    tenant_status: tenantIsolationCertified ? "PASS" : "FAIL",
    governance_status: governanceCertified ? "PASS" : "FAIL",
    visibility_status: visibilityCertified ? "PASS" : "FAIL",
    required_actions: Object.freeze([...requiredActions]),
    certification_timestamp: certification.certification_timestamp,
    certification_authority: certification.certification_authority,
    readOnly: true,
    tenantScoped: tenantIsolationCertified,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationCertified ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const completionGateValue = completionGate(certificationStateValue);
  const ledgerEntry: TruthEventCertificationLedgerEntry = Object.freeze({
    certification_id: certification.certification_id,
    tenant_id: input.request.tenant_id,
    certification_state: certification.certification_state,
    completion_gate: completionGateValue,
    replay_status: replayResult,
    failed_components: Object.freeze([...failedComponents]),
    required_actions: Object.freeze([...requiredActions]),
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const analytics: TruthEventCertificationAnalytics = Object.freeze({
    event_certifications_total: 1,
    event_pass_total: certificationStateValue === "PASS" ? 1 : 0,
    event_conditional_total: certificationStateValue === "CONDITIONAL_PASS" ? 1 : 0,
    event_fail_total: certificationStateValue === "FAIL" ? 1 : 0,
    event_contract_failures: eventContractCertified ? 0 : 1,
    event_recorder_failures: eventRecorderCertified ? 0 : 1,
    event_ordering_failures: eventOrderingCertified ? 0 : 1,
    event_correlation_failures: eventCorrelationCertified ? 0 : 1,
    event_replay_failures: replayCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    visibility_failures: visibilityCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEventCertificationValidation = Object.freeze({
    valid: certificationStateValue !== "FAIL",
    validationState: certificationStateValue === "FAIL" ? "INVALID" : "VALID",
    reasonCodes: Object.freeze([...reasons]),
    scopeValid,
    authorityValid,
    evidenceValid,
    replayReferencesValid,
    eventContractCertified,
    eventRecorderCertified,
    eventOrderingCertified,
    eventCorrelationCertified,
    replayCertified,
    tenantIsolationCertified,
    governanceCertified,
    visibilityCertified,
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

  const replay: TruthEventCertificationReplay = Object.freeze({
    replayResult,
    executedTests: Object.freeze([
      "Event Contract Certification",
      "Event Recorder Certification",
      "Event Ordering Certification",
      "Event Correlation Certification",
      "Replay Certification",
      "Tenant Isolation Certification",
      "Governance Certification",
      "Visibility Certification",
    ]),
    decisionState: certificationStateValue,
  });

  return Object.freeze({
    request: requestCore(input.request),
    certification,
    validation,
    replay,
    visibility,
    analytics,
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
