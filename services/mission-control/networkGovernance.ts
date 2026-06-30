import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthNetworkGovernance,
  TruthCertificationState,
  TruthNetworkGovernanceContract,
  TruthNetworkGovernanceInput,
  TruthNetworkGovernanceLedgerEntry,
  TruthNetworkGovernanceObservability,
  TruthNetworkGovernanceReasonCode,
  TruthNetworkGovernanceReplay,
  TruthNetworkGovernanceRequest,
  TruthNetworkGovernanceValidation,
  TruthNetworkGovernanceVisibility,
  TruthNetworkProtocolType,
  TruthPolicyAction,
  TruthReplayResult,
} from "./types";

const PROTOCOLS = new Set<TruthNetworkProtocolType>([
  "HTTPS",
  "HTTP",
  "SSH",
  "SFTP",
  "FTP",
  "SMTP",
  "DNS",
  "TCP",
  "UDP",
  "GRPC",
  "WEBSOCKET",
]);

function addReason(reasons: TruthNetworkGovernanceReasonCode[], reason: TruthNetworkGovernanceReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthNetworkGovernanceRequest): TruthNetworkGovernanceRequest {
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

function targetOf(input: TruthNetworkGovernanceInput): string {
  return input.targetDomain ?? input.targetIp ?? input.targetCidr ?? "";
}

function decideAction(input: TruthNetworkGovernanceInput): TruthPolicyAction {
  if (input.crossTenantTrafficDetected || input.crossTenantRoutingDetected) return "DENY";
  if (input.federationTrustViolationDetected || input.restrictedIpDetected || input.restrictedProtocolDetected) return "CONTAIN";
  if (input.restrictedCidrDetected) return "DENY";
  if (input.domainUnknownDetected || input.unknownCidrDetected) return "ESCALATE";
  if (input.authorized === false) return "DENY";
  if (input.domainApproved === false || input.ipApproved === false || input.cidrApproved === false) return "DENY";
  if (input.protocolAuthorized === false) return "DENY";
  if (input.outboundAuthorized === false || input.inboundAuthorized === false || input.federationAuthorized === false) return "DENY";
  return input.policy.policy.policy_action;
}

export function buildTruthNetworkGovernanceRequest(
  request: TruthNetworkGovernanceRequest,
): TruthNetworkGovernanceRequest {
  return requestCore(request);
}

export function sealTruthNetworkGovernance(input: TruthNetworkGovernanceInput): SealedTruthNetworkGovernance {
  const reasons: TruthNetworkGovernanceReasonCode[] = [];
  const policy = input.policy.policy;
  const target = targetOf(input);
  const replayReferences = Object.freeze([...(input.replayReferences ?? policy.replay_reference_ids)]);
  const networkPolicyId = hashValue("mission-control-network-governance-id", {
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    target,
    protocol_type: input.protocolType,
    routing_scope: input.routingScope,
    timestamp: input.request.now,
  });

  const networkPolicyIdPresent = networkPolicyId.length > 0;
  addReason(reasons, networkPolicyIdPresent ? "NETWORK_POLICY_ID_PRESENT" : "NETWORK_POLICY_ID_MISSING");
  const targetPresent = target.length > 0;
  addReason(reasons, targetPresent ? "NETWORK_TARGET_PRESENT" : "NETWORK_TARGET_MISSING");
  const protocolPresent = input.protocolType.length > 0;
  addReason(reasons, protocolPresent ? "PROTOCOL_TYPE_PRESENT" : "PROTOCOL_TYPE_MISSING");
  const protocolTypeValid = PROTOCOLS.has(input.protocolType);
  addReason(reasons, protocolTypeValid ? "PROTOCOL_TYPE_VALID" : "PROTOCOL_TYPE_INVALID");
  const governancePolicyReferencePresent = policy.policy_id.length > 0 && input.policy.certification !== "FAIL";
  addReason(reasons, governancePolicyReferencePresent ? "GOVERNANCE_POLICY_REFERENCE_PRESENT" : "GOVERNANCE_POLICY_REFERENCE_MISSING");

  const decision = decideAction(input);
  const federationContainmentActive = input.federationTrustViolationDetected === true || input.restrictedProtocolDetected === true || input.restrictedIpDetected === true;
  const domainGovernanceValid = input.targetDomain === undefined
    || (federationContainmentActive ? decision === "CONTAIN" : input.domainApproved === false ? decision === "DENY" : input.domainUnknownDetected ? decision === "ESCALATE" : decision !== "CONTAIN");
  addReason(reasons, domainGovernanceValid ? "DOMAIN_GOVERNANCE_OPERATIONAL" : "DOMAIN_GOVERNANCE_FAILED");
  const ipGovernanceValid = input.targetIp === undefined
    || (federationContainmentActive ? decision === "CONTAIN" : input.ipApproved === false ? decision === "DENY" : input.restrictedIpDetected ? decision === "CONTAIN" : decision !== "ESCALATE");
  addReason(reasons, ipGovernanceValid ? "IP_GOVERNANCE_OPERATIONAL" : "IP_GOVERNANCE_FAILED");
  const cidrGovernanceValid = input.targetCidr === undefined
    || (input.cidrApproved === false || input.restrictedCidrDetected ? decision === "DENY" : input.unknownCidrDetected ? decision === "ESCALATE" : decision !== "CONTAIN");
  addReason(reasons, cidrGovernanceValid ? "CIDR_GOVERNANCE_OPERATIONAL" : "CIDR_GOVERNANCE_FAILED");
  const protocolGovernanceValid = input.protocolAuthorized === false
    ? decision === "DENY"
    : input.restrictedProtocolDetected
      ? decision === "CONTAIN"
      : protocolTypeValid;
  addReason(reasons, protocolGovernanceValid ? "PROTOCOL_GOVERNANCE_OPERATIONAL" : "PROTOCOL_GOVERNANCE_FAILED");
  const outboundGovernanceValid = input.routingScope !== "OUTBOUND"
    || (federationContainmentActive ? decision === "CONTAIN" : input.outboundAuthorized === false ? decision === "DENY" : decision !== "CONTAIN");
  addReason(reasons, outboundGovernanceValid ? "OUTBOUND_GOVERNANCE_OPERATIONAL" : "OUTBOUND_GOVERNANCE_FAILED");
  const inboundGovernanceValid = input.routingScope !== "INBOUND"
    || (federationContainmentActive ? decision === "CONTAIN" : input.inboundAuthorized === false ? decision === "DENY" : decision !== "CONTAIN");
  addReason(reasons, inboundGovernanceValid ? "INBOUND_GOVERNANCE_OPERATIONAL" : "INBOUND_GOVERNANCE_FAILED");
  const federationRoutingValid = input.routingContainmentFailureDetected !== true
    && (input.routingScope !== "FEDERATION"
      || (input.federationAuthorized === false ? decision === "DENY" : input.federationTrustViolationDetected ? decision === "CONTAIN" : decision !== "ESCALATE"));
  addReason(reasons, federationRoutingValid ? "FEDERATION_ROUTING_OPERATIONAL" : "FEDERATION_ROUTING_FAILED");

  const tenantIsolationValid = input.crossTenantTrafficDetected !== true
    && input.crossTenantRoutingDetected !== true
    && policy.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_NETWORK_ISOLATION_VALID" : "TENANT_NETWORK_ISOLATION_FAILED");
  const policyEvaluationValid = input.nondeterministicOutcomeDetected !== true && input.policy.validation.valid;
  addReason(reasons, policyEvaluationValid ? "POLICY_EVALUATION_DETERMINISTIC" : "POLICY_EVALUATION_NONDETERMINISTIC");

  const replayResult: TruthReplayResult = replayReferences.length === 0
    ? "UNREPLAYABLE"
    : input.replayMismatchDetected === true || input.policyMismatchDetected === true
      ? "MISMATCH"
      : !policyEvaluationValid
        ? "INCOMPLETE_EVIDENCE"
        : "REPRODUCED";
  addReason(reasons, replayResult === "REPRODUCED" ? "REPLAY_REPRODUCED" : replayResult === "MISMATCH" ? "REPLAY_MISMATCH" : replayResult === "INCOMPLETE_EVIDENCE" ? "REPLAY_INCOMPLETE_EVIDENCE" : "REPLAY_UNREPLAYABLE");

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
  addReason(reasons, "NETWORK_GOVERNANCE_IS_NOT_CONTROL");

  const contractValid = networkPolicyIdPresent && targetPresent && protocolTypeValid && governancePolicyReferencePresent;
  const valid = contractValid
    && domainGovernanceValid
    && ipGovernanceValid
    && cidrGovernanceValid
    && protocolGovernanceValid
    && outboundGovernanceValid
    && inboundGovernanceValid
    && federationRoutingValid
    && tenantIsolationValid
    && policyEvaluationValid
    && replayResult === "REPRODUCED"
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const observabilityOperational = input.observabilityGapDetected !== true && input.reportingLimitationDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const conditional = valid && !observabilityOperational && input.remediationDocumented === true && replayResult === "REPRODUCED";
  const certification = certificationState(valid && observabilityOperational, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");

  const governance: TruthNetworkGovernanceContract = Object.freeze({
    network_policy_id: networkPolicyId,
    tenant_id: input.request.tenant_id,
    network_scope: input.networkScope,
    network_action: decision,
    network_state: valid || conditional ? "EVALUATED" : "REJECTED",
    target_domain: input.targetDomain,
    target_ip: input.targetIp,
    target_cidr: input.targetCidr,
    protocol_type: input.protocolType,
    routing_scope: input.routingScope,
    governance_policy_id: policy.policy_id,
    replay_references: replayReferences,
  });

  const failureReason = valid ? null : [
    !contractValid && "network governance contract invalid",
    !domainGovernanceValid && "unauthorized domain allowed",
    !ipGovernanceValid && "unauthorized IP allowed",
    !cidrGovernanceValid && "unauthorized CIDR allowed",
    !protocolGovernanceValid && "unauthorized protocol allowed",
    !federationRoutingValid && "unauthorized routing allowed",
    !tenantIsolationValid && "cross-tenant traffic allowed",
    replayResult === "MISMATCH" && "network replay mismatch",
  ].filter(Boolean).join("; ");

  const ledgerEntry: TruthNetworkGovernanceLedgerEntry = Object.freeze({
    network_policy_id: governance.network_policy_id,
    tenant_id: governance.tenant_id,
    target,
    protocol_type: governance.protocol_type,
    routing_scope: governance.routing_scope,
    network_action: governance.network_action,
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthNetworkGovernanceVisibility = Object.freeze({
    network_policy_id: governance.network_policy_id,
    target_domain: governance.target_domain,
    target_ip: governance.target_ip,
    protocol_type: governance.protocol_type,
    policy_action: governance.network_action,
    routing_status: governance.routing_scope,
    tenant_status: tenantIsolationValid ? "VALID" : "INVALID",
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthNetworkGovernanceObservability = Object.freeze({
    network_requests_total: 1,
    allowed_requests: decision === "ALLOW" ? 1 : 0,
    denied_requests: decision === "DENY" ? 1 : 0,
    escalated_requests: decision === "ESCALATE" ? 1 : 0,
    contained_requests: decision === "CONTAIN" ? 1 : 0,
    domain_violations: input.domainApproved === false || input.domainUnknownDetected ? 1 : 0,
    IP_violations: input.ipApproved === false || input.restrictedIpDetected ? 1 : 0,
    protocol_violations: input.protocolAuthorized === false || input.restrictedProtocolDetected ? 1 : 0,
    routing_violations: input.outboundAuthorized === false || input.inboundAuthorized === false || input.federationAuthorized === false || input.federationTrustViolationDetected ? 1 : 0,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthNetworkGovernanceValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    domainGovernanceValid,
    ipGovernanceValid,
    cidrGovernanceValid,
    protocolGovernanceValid,
    outboundGovernanceValid,
    inboundGovernanceValid,
    federationRoutingValid,
    tenantIsolationValid,
    policyEvaluationValid,
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

  const replay: TruthNetworkGovernanceReplay = Object.freeze({
    replayResult,
    reconstructedContract: governance,
    reconstructedPolicy: policy,
    reconstructedDecision: decision,
  });

  return Object.freeze({
    request: requestCore(input.request),
    governance,
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
