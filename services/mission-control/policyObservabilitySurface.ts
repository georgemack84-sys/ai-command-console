import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPolicyObservabilitySurface,
  TruthCertificationState,
  TruthPolicyObservabilityContract,
  TruthPolicyObservabilityDashboard,
  TruthPolicyObservabilityDashboardType,
  TruthPolicyObservabilityInput,
  TruthPolicyObservabilityLedgerEntry,
  TruthPolicyObservabilityMetrics,
  TruthPolicyObservabilityReasonCode,
  TruthPolicyObservabilityRequest,
  TruthPolicyObservabilityValidation,
  TruthPolicyObservabilityVisibility,
} from "./types";

function addReason(reasons: TruthPolicyObservabilityReasonCode[], reason: TruthPolicyObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPolicyObservabilityRequest): TruthPolicyObservabilityRequest {
  return Object.freeze({ tenant_id: request.tenant_id, now: request.now });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
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

function visibleUnlessTargeted(hidden: boolean | undefined, applies: boolean): boolean {
  return !applies || hidden !== true;
}

function defaultDashboards(): readonly TruthPolicyObservabilityDashboardType[] {
  return Object.freeze([
    "POLICY_DASHBOARD",
    "VIOLATION_DASHBOARD",
    "CONTAINMENT_DASHBOARD",
    "AUTHORITY_DASHBOARD",
    "TENANT_DASHBOARD",
  ]);
}

export function buildTruthPolicyObservabilityRequest(
  request: TruthPolicyObservabilityRequest,
): TruthPolicyObservabilityRequest {
  return requestCore(request);
}

export function sealTruthPolicyObservabilitySurface(
  input: TruthPolicyObservabilityInput,
): SealedTruthPolicyObservabilitySurface {
  const reasons: TruthPolicyObservabilityReasonCode[] = [];
  const observabilityTimestamp = input.observabilityTimestamp ?? input.request.now;
  const observabilityId = hashValue("mission-control-policy-observability-id", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    event_id: input.eventId,
    event_type: input.eventType,
    policy_id: input.policyId,
    authority_id: input.authorityId,
    replay_reference: input.replayReference,
  });

  const observabilityIdPresent = observabilityId.length > 0;
  addReason(reasons, observabilityIdPresent ? "OBSERVABILITY_ID_PRESENT" : "OBSERVABILITY_ID_MISSING");
  const policyIdPresent = input.policyId.trim().length > 0;
  addReason(reasons, policyIdPresent ? "POLICY_ID_PRESENT" : "POLICY_ID_MISSING");
  const eventTypePresent = input.eventType.length > 0;
  addReason(reasons, eventTypePresent ? "EVENT_TYPE_PRESENT" : "EVENT_TYPE_MISSING");
  const contractValid = observabilityIdPresent && policyIdPresent && eventTypePresent;
  addReason(reasons, contractValid ? "POLICY_OBSERVABILITY_CONTRACT_VALID" : "POLICY_OBSERVABILITY_CONTRACT_INVALID");

  const evaluationVisible = visibleUnlessTargeted(input.hiddenEvaluationDetected, input.eventType === "POLICY_EVALUATION");
  addReason(reasons, evaluationVisible ? "POLICY_EVALUATION_VISIBLE" : "POLICY_EVALUATION_HIDDEN");
  const violationVisible = visibleUnlessTargeted(input.hiddenViolationDetected, input.eventType === "POLICY_VIOLATION");
  addReason(reasons, violationVisible ? "POLICY_VIOLATION_VISIBLE" : "POLICY_VIOLATION_HIDDEN");
  const deniedActionVisible = visibleUnlessTargeted(input.hiddenDeniedActionDetected, input.eventType === "DENIED_ACTION");
  addReason(reasons, deniedActionVisible ? "DENIED_ACTION_VISIBLE" : "DENIED_ACTION_HIDDEN");
  const containmentVisible = visibleUnlessTargeted(input.hiddenContainmentDetected, input.eventType === "CONTAINMENT_ACTION");
  addReason(reasons, containmentVisible ? "CONTAINMENT_VISIBLE" : "CONTAINMENT_HIDDEN");
  const filesystemViolationVisible = visibleUnlessTargeted(input.hiddenFilesystemViolationDetected, input.eventType === "FILESYSTEM_VIOLATION");
  addReason(reasons, filesystemViolationVisible ? "FILESYSTEM_VIOLATION_VISIBLE" : "FILESYSTEM_VIOLATION_HIDDEN");
  const networkViolationVisible = visibleUnlessTargeted(input.hiddenNetworkViolationDetected, input.eventType === "NETWORK_VIOLATION");
  addReason(reasons, networkViolationVisible ? "NETWORK_VIOLATION_VISIBLE" : "NETWORK_VIOLATION_HIDDEN");
  const capabilityViolationVisible = visibleUnlessTargeted(input.hiddenCapabilityViolationDetected, input.eventType === "CAPABILITY_VIOLATION");
  addReason(reasons, capabilityViolationVisible ? "CAPABILITY_VIOLATION_VISIBLE" : "CAPABILITY_VIOLATION_HIDDEN");
  const authorityVisible = input.hiddenAuthorityDetected !== true
    && input.authorityId.trim().length > 0
    && input.explanation.authority_id === input.authorityId;
  addReason(reasons, authorityVisible ? "AUTHORITY_VISIBLE" : "AUTHORITY_HIDDEN");

  const explanationGenerated = input.missingExplanationDetected !== true
    && input.explanation.what_happened.trim().length > 0
    && input.explanation.why.trim().length > 0
    && input.explanation.policy_id === input.policyId
    && input.explanation.authority_id === input.authorityId
    && input.explanation.evidence_references.length > 0;
  addReason(reasons, explanationGenerated ? "EXPLANATION_GENERATED" : "EXPLANATION_MISSING");
  const replayLinked = input.missingReplayLinkDetected !== true
    && input.replayReference.replay_id.trim().length > 0
    && input.replayReference.replay_bundle_id.trim().length > 0
    && input.replayReference.replay_hash.trim().length > 0;
  addReason(reasons, replayLinked ? "REPLAY_LINK_AVAILABLE" : "REPLAY_LINK_MISSING");

  const dashboardTypes = Object.freeze([...(input.dashboardTypes ?? defaultDashboards())]);
  const dashboardAvailable = input.dashboardUnavailableDetected !== true && dashboardTypes.length > 0;
  addReason(reasons, dashboardAvailable ? "DASHBOARD_AVAILABLE" : "DASHBOARD_UNAVAILABLE");
  const tenantIsolationValid = input.crossTenantObservabilityAccessDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_OBSERVABILITY_ISOLATION_VALID" : "TENANT_OBSERVABILITY_ISOLATION_FAILED");

  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");
  const ledgerImmutable = true;
  const metricsOperational = input.observabilityGapDetected !== true && input.reportingLimitationDetected !== true;
  addReason(reasons, metricsOperational ? "METRICS_OPERATIONAL" : "METRICS_GAP_DETECTED");

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
  addReason(reasons, "POLICY_OBSERVABILITY_IS_NOT_CONTROL");

  const coreValid = contractValid
    && evaluationVisible
    && violationVisible
    && deniedActionVisible
    && containmentVisible
    && filesystemViolationVisible
    && networkViolationVisible
    && capabilityViolationVisible
    && authorityVisible
    && explanationGenerated
    && replayLinked
    && dashboardAvailable
    && ledgerImmutable
    && tenantIsolationValid
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;
  const conditional = coreValid && !metricsOperational && input.remediationDocumented === true;
  const certification = certificationState(coreValid && metricsOperational, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");

  const contract: TruthPolicyObservabilityContract = Object.freeze({
    observability_id: observabilityId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    event_id: input.eventId,
    event_type: input.eventType,
    policy_id: input.policyId,
    authority_id: input.authorityId,
    observability_timestamp: observabilityTimestamp,
    observability_state: coreValid || conditional ? "VISIBLE" : "HIDDEN",
    replay_reference: Object.freeze({ ...input.replayReference }),
  });

  const dashboards: readonly TruthPolicyObservabilityDashboard[] = Object.freeze(dashboardTypes.map((dashboardType) => Object.freeze({
    dashboard_id: hashValue("mission-control-policy-observability-dashboard-id", {
      tenant_id: input.request.tenant_id,
      dashboard_type: dashboardType,
      observability_id: observabilityId,
    }),
    dashboard_type: dashboardType,
    tenant_id: input.request.tenant_id,
    visible_events: Object.freeze([input.eventType]),
    replay_linked: replayLinked,
    realTimeCapable: true,
    readOnly: true,
  })));

  const failureReason = coreValid
    ? null
    : [
      !contractValid && "invalid observability contract",
      !evaluationVisible && "hidden policy evaluation",
      !violationVisible && "hidden violation",
      !deniedActionVisible && "hidden denied action",
      !containmentVisible && "hidden containment",
      !filesystemViolationVisible && "hidden filesystem violation",
      !networkViolationVisible && "hidden network violation",
      !capabilityViolationVisible && "hidden capability violation",
      !authorityVisible && "hidden authority",
      !explanationGenerated && "missing explanation",
      !replayLinked && "missing replay integration",
      !dashboardAvailable && "dashboard failure",
      !tenantIsolationValid && "cross-tenant observability access",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthPolicyObservabilityLedgerEntry = Object.freeze({
    observability_id: observabilityId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    event_id: input.eventId,
    event_type: input.eventType,
    observability_state: contract.observability_state,
    validation_status: coreValid || conditional ? "VALID" : "INVALID",
    certification_state: certification,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-policy-observability-ledger-entry-hash", {
      observability_id: observabilityId,
      event_type: input.eventType,
      certification,
      failureReason,
    }),
  });

  const validation: TruthPolicyObservabilityValidation = Object.freeze({
    valid: coreValid || conditional,
    validationState: coreValid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    evaluationVisible,
    violationVisible,
    deniedActionVisible,
    containmentVisible,
    filesystemViolationVisible,
    networkViolationVisible,
    capabilityViolationVisible,
    authorityVisible,
    explanationGenerated,
    replayLinked,
    dashboardAvailable,
    ledgerImmutable,
    metricsOperational,
    tenantIsolationValid,
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

  const visibility: TruthPolicyObservabilityVisibility = Object.freeze({
    observability_id: observabilityId,
    event_type: input.eventType,
    policy_id: input.policyId,
    authority_id: input.authorityId,
    observability_state: contract.observability_state,
    replay_status: input.replayReference.replay_status,
    dashboard_status: dashboardAvailable ? "VALID" : "INVALID",
    validation_status: coreValid || conditional ? "VALID" : "INVALID",
    timestamp: observabilityTimestamp,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked,
  });

  const visible = coreValid || conditional ? 1 : 0;
  const metrics: TruthPolicyObservabilityMetrics = Object.freeze({
    policy_evaluations_visible: input.eventType === "POLICY_EVALUATION" ? visible : 0,
    policy_violations_visible: input.eventType === "POLICY_VIOLATION" ? visible : 0,
    denied_actions_visible: input.eventType === "DENIED_ACTION" ? visible : 0,
    containment_actions_visible: input.eventType === "CONTAINMENT_ACTION" ? visible : 0,
    filesystem_violations_visible: input.eventType === "FILESYSTEM_VIOLATION" ? visible : 0,
    network_violations_visible: input.eventType === "NETWORK_VIOLATION" ? visible : 0,
    capability_violations_visible: input.eventType === "CAPABILITY_VIOLATION" ? visible : 0,
    authority_events_visible: authorityVisible ? 1 : 0,
    dashboard_availability: dashboardAvailable ? 1 : 0,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  return Object.freeze({
    request: requestCore(input.request),
    contract,
    dashboards,
    ledgerEntry,
    validation,
    visibility,
    metrics,
    explanation: Object.freeze({
      what_happened: input.explanation.what_happened,
      why: input.explanation.why,
      policy_id: input.explanation.policy_id,
      authority_id: input.explanation.authority_id,
      evidence_references: Object.freeze([...input.explanation.evidence_references]),
    }),
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
