import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthCapabilityGovernance,
  TruthCapabilityGovernanceContract,
  TruthCapabilityGovernanceInput,
  TruthCapabilityGovernanceLedgerEntry,
  TruthCapabilityGovernanceObservability,
  TruthCapabilityGovernanceReasonCode,
  TruthCapabilityGovernanceReplay,
  TruthCapabilityGovernanceRequest,
  TruthCapabilityGovernanceValidation,
  TruthCapabilityGovernanceVisibility,
  TruthCertificationState,
  TruthPolicyAction,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthCapabilityGovernanceReasonCode[], reason: TruthCapabilityGovernanceReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthCapabilityGovernanceRequest): TruthCapabilityGovernanceRequest {
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

function trustRank(state: string): number {
  if (state === "TRUSTED") return 3;
  if (state === "CONDITIONALLY_TRUSTED") return 2;
  if (state === "RESTRICTED") return 1;
  return 0;
}

function decideAction(input: TruthCapabilityGovernanceInput): TruthPolicyAction {
  if (input.crossTenantCapabilityAccessDetected || input.crossTenantTrustAccessDetected) return "DENY";
  if (input.prohibitedToolDetected) return "DENY";
  if (input.toolApproved === false || input.toolCertified === false || input.toolAuthorized === false) return "DENY";
  if (input.capabilityAuthorized === false) return "DENY";
  if (input.restrictedCapabilityDetected) return "CONTAIN";
  if (input.certificationState === "MISSING" || input.certificationState === "EXPIRED") return "DENY";
  if (trustRank(input.trustState) < trustRank(input.trustRequirement)) return "DENY";
  if (input.trustViolationDetected) return "ESCALATE";
  if (input.authorityState === "INSUFFICIENT") return "DENY";
  if (input.authorityState === "MISMATCH") return "ESCALATE";
  if (input.profileMismatchDetected || input.agentProfile.denied_capabilities.includes(input.capabilityName)) return "DENY";
  if (!input.agentProfile.allowed_capabilities.includes(input.capabilityName)) return "DENY";
  return input.policy.policy.policy_action;
}

export function buildTruthCapabilityGovernanceRequest(
  request: TruthCapabilityGovernanceRequest,
): TruthCapabilityGovernanceRequest {
  return requestCore(request);
}

export function sealTruthCapabilityGovernance(input: TruthCapabilityGovernanceInput): SealedTruthCapabilityGovernance {
  const reasons: TruthCapabilityGovernanceReasonCode[] = [];
  const policy = input.policy.policy;
  const replayReferences = Object.freeze([...(input.replayReferences ?? policy.replay_reference_ids)]);
  const capabilityPolicyId = hashValue("mission-control-capability-governance-id", {
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    agent_id: input.agentProfile.agent_id,
    tool_name: input.toolName,
    capability_name: input.capabilityName,
    timestamp: input.request.now,
  });

  const capabilityPolicyIdPresent = capabilityPolicyId.length > 0;
  addReason(reasons, capabilityPolicyIdPresent ? "CAPABILITY_POLICY_ID_PRESENT" : "CAPABILITY_POLICY_ID_MISSING");
  const toolNamePresent = input.toolName.trim().length > 0;
  addReason(reasons, toolNamePresent ? "TOOL_NAME_PRESENT" : "TOOL_NAME_MISSING");
  const capabilityNamePresent = input.capabilityName.length > 0;
  addReason(reasons, capabilityNamePresent ? "CAPABILITY_NAME_PRESENT" : "CAPABILITY_NAME_MISSING");
  const governancePolicyReferencePresent = policy.policy_id.length > 0 && input.policy.certification !== "FAIL";
  addReason(reasons, governancePolicyReferencePresent ? "GOVERNANCE_POLICY_REFERENCE_PRESENT" : "GOVERNANCE_POLICY_REFERENCE_MISSING");

  const decision = decideAction(input);
  const approvedToolGovernanceValid = input.toolApproved === false || input.toolCertified === false || input.toolAuthorized === false
    ? decision === "DENY"
    : toolNamePresent;
  addReason(reasons, approvedToolGovernanceValid ? "APPROVED_TOOL_GOVERNANCE_OPERATIONAL" : "APPROVED_TOOL_GOVERNANCE_FAILED");
  const prohibitedToolGovernanceValid = input.prohibitedToolDetected === true ? decision === "DENY" : true;
  addReason(reasons, prohibitedToolGovernanceValid ? "PROHIBITED_TOOL_GOVERNANCE_OPERATIONAL" : "PROHIBITED_TOOL_GOVERNANCE_FAILED");
  const capabilityRestrictionValid = input.capabilityAuthorized === false
    ? decision === "DENY"
    : input.restrictedCapabilityDetected === true
      ? decision === "CONTAIN"
      : capabilityNamePresent;
  addReason(reasons, capabilityRestrictionValid ? "CAPABILITY_RESTRICTION_OPERATIONAL" : "CAPABILITY_RESTRICTION_FAILED");
  const certificationRequirementValid = input.certificationState === "VALID" || decision === "DENY";
  addReason(reasons, certificationRequirementValid ? "CERTIFICATION_REQUIREMENT_OPERATIONAL" : "CERTIFICATION_REQUIREMENT_FAILED");
  const trustRequirementValid = trustRank(input.trustState) >= trustRank(input.trustRequirement)
    ? input.trustViolationDetected === true ? decision === "ESCALATE" : true
    : decision === "DENY";
  addReason(reasons, trustRequirementValid ? "TRUST_REQUIREMENT_OPERATIONAL" : "TRUST_REQUIREMENT_FAILED");
  const authorityRequirementValid = input.authorityState === "AUTHORIZED"
    ? true
    : input.authorityState === "INSUFFICIENT"
      ? decision === "DENY"
      : decision === "ESCALATE";
  addReason(reasons, authorityRequirementValid ? "AUTHORITY_REQUIREMENT_OPERATIONAL" : "AUTHORITY_REQUIREMENT_FAILED");
  const agentProfileValid = input.profileMismatchDetected === true
    || input.agentProfile.denied_capabilities.includes(input.capabilityName)
    || !input.agentProfile.allowed_capabilities.includes(input.capabilityName)
    ? decision === "DENY"
    : input.agentProfile.agent_id.length > 0;
  addReason(reasons, agentProfileValid ? "AGENT_PROFILE_OPERATIONAL" : "AGENT_PROFILE_FAILED");

  const tenantIsolationValid = input.crossTenantCapabilityAccessDetected !== true
    && input.crossTenantTrustAccessDetected !== true
    && policy.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_CAPABILITY_ISOLATION_VALID" : "TENANT_CAPABILITY_ISOLATION_FAILED");
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
  addReason(reasons, "CAPABILITY_GOVERNANCE_IS_NOT_CONTROL");

  const contractValid = capabilityPolicyIdPresent && toolNamePresent && capabilityNamePresent && governancePolicyReferencePresent;
  const valid = contractValid
    && approvedToolGovernanceValid
    && prohibitedToolGovernanceValid
    && capabilityRestrictionValid
    && certificationRequirementValid
    && trustRequirementValid
    && authorityRequirementValid
    && agentProfileValid
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

  const governance: TruthCapabilityGovernanceContract = Object.freeze({
    capability_policy_id: capabilityPolicyId,
    tenant_id: input.request.tenant_id,
    agent_id: input.agentProfile.agent_id,
    capability_scope: input.capabilityScope,
    capability_action: decision,
    capability_state: valid || conditional ? "EVALUATED" : "REJECTED",
    tool_name: input.toolName,
    capability_name: input.capabilityName,
    trust_requirement: input.trustRequirement,
    trust_state: input.trustState,
    certification_requirement: input.certificationRequirement,
    certification_state: input.certificationState,
    authority_requirement: input.authorityRequirement,
    authority_state: input.authorityState,
    governance_policy_id: policy.policy_id,
    replay_references: replayReferences,
  });

  const failureReason = valid ? null : [
    !contractValid && "capability governance contract invalid",
    !approvedToolGovernanceValid && "unauthorized tool allowed",
    !capabilityRestrictionValid && "unauthorized capability allowed",
    !certificationRequirementValid && "expired certification allowed",
    !trustRequirementValid && "trust violation ignored",
    !authorityRequirementValid && "authority violation ignored",
    !tenantIsolationValid && "cross-tenant capability access",
    replayResult === "MISMATCH" && "capability replay mismatch",
  ].filter(Boolean).join("; ");

  const ledgerEntry: TruthCapabilityGovernanceLedgerEntry = Object.freeze({
    capability_policy_id: governance.capability_policy_id,
    tenant_id: governance.tenant_id,
    agent_id: governance.agent_id,
    tool_name: governance.tool_name,
    capability_name: governance.capability_name,
    capability_action: governance.capability_action,
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthCapabilityGovernanceVisibility = Object.freeze({
    agent_id: governance.agent_id,
    tool_name: governance.tool_name,
    capability_name: governance.capability_name,
    trust_state: governance.trust_state,
    authority_state: governance.authority_state,
    certification_state: governance.certification_state,
    policy_action: governance.capability_action,
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthCapabilityGovernanceObservability = Object.freeze({
    capability_requests_total: 1,
    allowed_capabilities: decision === "ALLOW" ? 1 : 0,
    denied_capabilities: decision === "DENY" ? 1 : 0,
    escalated_capabilities: decision === "ESCALATE" ? 1 : 0,
    contained_capabilities: decision === "CONTAIN" ? 1 : 0,
    trust_violations: input.trustViolationDetected || trustRank(input.trustState) < trustRank(input.trustRequirement) ? 1 : 0,
    authority_violations: input.authorityState === "AUTHORIZED" ? 0 : 1,
    certification_violations: input.certificationState === "VALID" ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthCapabilityGovernanceValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    approvedToolGovernanceValid,
    prohibitedToolGovernanceValid,
    capabilityRestrictionValid,
    certificationRequirementValid,
    trustRequirementValid,
    authorityRequirementValid,
    agentProfileValid,
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

  const replay: TruthCapabilityGovernanceReplay = Object.freeze({
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
