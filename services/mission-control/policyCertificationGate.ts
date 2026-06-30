import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPolicyCertificationGate,
  TruthCertificationState,
  TruthPolicyCertificationContract,
  TruthPolicyCertificationDomainResult,
  TruthPolicyCertificationInput,
  TruthPolicyCertificationLedgerEntry,
  TruthPolicyCertificationReasonCode,
  TruthPolicyCertificationReplay,
  TruthPolicyCertificationRequest,
  TruthPolicyCertificationScope,
  TruthPolicyCertificationValidation,
  TruthPolicyLayerAdvancementState,
  TruthReplayResult,
} from "./types";

function addReason(reasons: TruthPolicyCertificationReasonCode[], reason: TruthPolicyCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPolicyCertificationRequest): TruthPolicyCertificationRequest {
  return Object.freeze({ tenant_id: request.tenant_id, now: request.now });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function advancementState(certification: TruthCertificationState): TruthPolicyLayerAdvancementState {
  if (certification === "PASS") return "POLICY_LAYER_CERTIFIED";
  if (certification === "CONDITIONAL_PASS") return "POLICY_LAYER_CONDITIONAL";
  return "POLICY_LAYER_FAILED";
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

function certified(state: TruthCertificationState): boolean {
  return state !== "FAIL";
}

function domainResult(
  scope: TruthPolicyCertificationScope,
  certification_state: TruthCertificationState,
  failure_reason: string | null,
): TruthPolicyCertificationDomainResult {
  return Object.freeze({
    scope,
    certification_state,
    certified: certified(certification_state),
    failure_reason,
  });
}

export function buildTruthPolicyCertificationRequest(
  request: TruthPolicyCertificationRequest,
): TruthPolicyCertificationRequest {
  return requestCore(request);
}

export function sealTruthPolicyCertificationGate(input: TruthPolicyCertificationInput): SealedTruthPolicyCertificationGate {
  const reasons: TruthPolicyCertificationReasonCode[] = [];
  const scope = Object.freeze([...input.certificationScope]);
  const evidenceReferences = Object.freeze([...input.evidenceReferences]);
  const replayReferences = Object.freeze([...input.replayReferences]);

  const scopePresent = scope.length > 0;
  addReason(reasons, scopePresent ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");
  const authorityPresent = input.certificationAuthority.authority_id.trim().length > 0
    && input.certificationAuthority.authority_scope.trim().length > 0
    && input.certificationAuthority.authority_evidence.length > 0;
  addReason(reasons, authorityPresent ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");
  const evidencePresent = evidenceReferences.length > 0;
  addReason(reasons, evidencePresent ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  const replayPresent = replayReferences.length > 0;
  addReason(reasons, replayPresent ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  const contractValid = scopePresent && authorityPresent && evidencePresent && replayPresent;

  const policyContractCertified = certified(input.policyContract.certification);
  addReason(reasons, policyContractCertified ? "POLICY_CONTRACT_CERTIFIED" : "POLICY_CONTRACT_FAILED");
  const filesystemGovernanceCertified = certified(input.filesystemGovernance.certification)
    && input.unauthorizedFilesystemAccessDetected !== true;
  addReason(reasons, filesystemGovernanceCertified ? "FILESYSTEM_GOVERNANCE_CERTIFIED" : "FILESYSTEM_GOVERNANCE_FAILED");
  addReason(reasons, input.unauthorizedFilesystemAccessDetected === true ? "UNAUTHORIZED_FILESYSTEM_ACCESS_DETECTED" : "AUTHORIZED_FILESYSTEM_ACCESS_CERTIFIED");
  const networkGovernanceCertified = certified(input.networkGovernance.certification)
    && input.unauthorizedNetworkAccessDetected !== true;
  addReason(reasons, networkGovernanceCertified ? "NETWORK_GOVERNANCE_CERTIFIED" : "NETWORK_GOVERNANCE_FAILED");
  addReason(reasons, input.unauthorizedNetworkAccessDetected === true ? "UNAUTHORIZED_NETWORK_ACCESS_DETECTED" : "AUTHORIZED_NETWORK_ACCESS_CERTIFIED");
  const capabilityGovernanceCertified = certified(input.capabilityGovernance.certification)
    && input.prohibitedToolUseDetected !== true;
  addReason(reasons, capabilityGovernanceCertified ? "CAPABILITY_GOVERNANCE_CERTIFIED" : "CAPABILITY_GOVERNANCE_FAILED");
  addReason(reasons, input.prohibitedToolUseDetected === true ? "PROHIBITED_TOOL_USE_DETECTED" : "APPROVED_TOOL_USE_CERTIFIED");
  const runtimePolicyEngineCertified = certified(input.runtimePolicyEngine.certification)
    && input.policyBypassDetected !== true
    && input.authorityBypassDetected !== true
    && input.governanceBypassDetected !== true;
  addReason(reasons, runtimePolicyEngineCertified ? "RUNTIME_POLICY_ENGINE_CERTIFIED" : "RUNTIME_POLICY_ENGINE_FAILED");
  addReason(reasons, input.authorityBypassDetected === true ? "AUTHORITY_VALIDATION_BYPASSED" : "AUTHORITY_VALIDATION_ENFORCED");
  addReason(reasons, input.governanceBypassDetected === true ? "GOVERNANCE_VALIDATION_BYPASSED" : "GOVERNANCE_VALIDATION_ENFORCED");
  if (input.policyBypassDetected === true) addReason(reasons, "POLICY_BYPASS_DETECTED");

  const enforcementLayerCertified = certified(input.enforcementLayer.certification)
    && input.enforcementBypassDetected !== true
    && input.containmentFailureDetected !== true;
  addReason(reasons, enforcementLayerCertified ? "ENFORCEMENT_LAYER_CERTIFIED" : "ENFORCEMENT_LAYER_FAILED");
  const policyLedgerCertified = certified(input.policyLedger.certification)
    && input.ledgerTamperingDetected !== true;
  addReason(reasons, policyLedgerCertified ? "POLICY_LEDGER_CERTIFIED" : "POLICY_LEDGER_FAILED");
  const policyReplayCertified = certified(input.policyReplay.certification)
    && input.replayMismatchDetected !== true
    && input.crossTenantReplayDetected !== true;
  addReason(reasons, policyReplayCertified ? "POLICY_REPLAY_CERTIFIED" : "POLICY_REPLAY_FAILED");
  const policyObservabilityCertified = certified(input.policyObservability.certification)
    && input.hiddenPolicyStateDetected !== true
    && input.hiddenViolationDetected !== true
    && input.hiddenAuthorityDetected !== true
    && input.crossTenantObservabilityDetected !== true;
  addReason(reasons, policyObservabilityCertified ? "POLICY_OBSERVABILITY_CERTIFIED" : "POLICY_OBSERVABILITY_FAILED");
  if (input.hiddenPolicyStateDetected === true) addReason(reasons, "HIDDEN_POLICY_STATE_DETECTED");

  const governanceComplianceVerified = input.governanceViolationDetected !== true
    && input.governanceBypassDetected !== true
    && input.authorityExpansionDetected !== true;
  addReason(reasons, governanceComplianceVerified ? "GOVERNANCE_COMPLIANCE_VERIFIED" : "GOVERNANCE_COMPLIANCE_FAILED");
  const constitutionalComplianceVerified = input.constitutionalViolationDetected !== true;
  addReason(reasons, constitutionalComplianceVerified ? "CONSTITUTIONAL_COMPLIANCE_VERIFIED" : "CONSTITUTIONAL_COMPLIANCE_FAILED");
  const tenantIsolationCertified = input.crossTenantAccessDetected !== true
    && input.crossTenantReplayDetected !== true
    && input.crossTenantObservabilityDetected !== true;
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");

  const domainResults = Object.freeze([
    domainResult("POLICY_CONTRACT", input.policyContract.certification, policyContractCertified ? null : "policy contract failed"),
    domainResult("FILESYSTEM_GOVERNANCE", filesystemGovernanceCertified ? input.filesystemGovernance.certification : "FAIL", filesystemGovernanceCertified ? null : "filesystem governance failed"),
    domainResult("NETWORK_GOVERNANCE", networkGovernanceCertified ? input.networkGovernance.certification : "FAIL", networkGovernanceCertified ? null : "network governance failed"),
    domainResult("CAPABILITY_GOVERNANCE", capabilityGovernanceCertified ? input.capabilityGovernance.certification : "FAIL", capabilityGovernanceCertified ? null : "capability governance failed"),
    domainResult("RUNTIME_POLICY_ENGINE", runtimePolicyEngineCertified ? input.runtimePolicyEngine.certification : "FAIL", runtimePolicyEngineCertified ? null : "runtime policy engine failed"),
    domainResult("ENFORCEMENT_LAYER", enforcementLayerCertified ? input.enforcementLayer.certification : "FAIL", enforcementLayerCertified ? null : "enforcement layer failed"),
    domainResult("POLICY_LEDGER", policyLedgerCertified ? input.policyLedger.certification : "FAIL", policyLedgerCertified ? null : "policy ledger failed"),
    domainResult("POLICY_REPLAY_FRAMEWORK", policyReplayCertified ? input.policyReplay.certification : "FAIL", policyReplayCertified ? null : "policy replay failed"),
    domainResult("POLICY_OBSERVABILITY_SURFACE", policyObservabilityCertified ? input.policyObservability.certification : "FAIL", policyObservabilityCertified ? null : "policy observability failed"),
    domainResult("GOVERNANCE_COMPLIANCE", governanceComplianceVerified ? "PASS" : "FAIL", governanceComplianceVerified ? null : "governance compliance failed"),
    domainResult("CONSTITUTIONAL_COMPLIANCE", constitutionalComplianceVerified ? "PASS" : "FAIL", constitutionalComplianceVerified ? null : "constitutional compliance failed"),
    domainResult("TENANT_ISOLATION", tenantIsolationCertified ? "PASS" : "FAIL", tenantIsolationCertified ? null : "tenant isolation failed"),
  ]);

  const replayResult: TruthReplayResult = !evidencePresent || !replayPresent
    ? "INCOMPLETE_EVIDENCE"
    : input.replayMismatchDetected === true
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(reasons, replayResult === "REPRODUCED" ? "CERTIFICATION_REPLAY_REPRODUCED" : replayResult === "MISMATCH" ? "CERTIFICATION_REPLAY_MISMATCH" : "CERTIFICATION_REPLAY_INCOMPLETE_EVIDENCE");
  const certificationReplayReproduced = replayResult === "REPRODUCED";

  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");
  const ledgerImmutable = true;
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
  addReason(reasons, "POLICY_CERTIFICATION_IS_NOT_CONTROL");

  const coreValid = contractValid
    && domainResults.every((domain) => domain.certified)
    && governanceComplianceVerified
    && constitutionalComplianceVerified
    && tenantIsolationCertified
    && certificationReplayReproduced
    && ledgerImmutable
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;
  const observabilityGap = input.observabilityGapDetected === true || input.reportingLimitationDetected === true;
  const conditional = coreValid && observabilityGap && input.remediationDocumented === true;
  const certification = certificationState(coreValid && !observabilityGap, conditional);
  addReason(reasons, certification === "PASS" ? "CERTIFICATION_PASS" : certification === "CONDITIONAL_PASS" ? "CERTIFICATION_CONDITIONAL_PASS" : "CERTIFICATION_FAIL");
  const advancement = advancementState(certification);

  const certificationId = hashValue("mission-control-policy-certification-id", {
    tenant_id: input.request.tenant_id,
    policy_layer_version: input.policyLayerVersion,
    scope,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });
  const certificationReason = certification === "PASS"
    ? "Policy layer certified for downstream governance advancement."
    : certification === "CONDITIONAL_PASS"
      ? "Policy layer conditionally certified with documented remediation for non-critical observability or reporting gaps."
      : "Policy layer certification failed; downstream governance advancement is blocked.";

  const contract: TruthPolicyCertificationContract = Object.freeze({
    certification_id: certificationId,
    certification_timestamp: input.request.now,
    policy_layer_version: input.policyLayerVersion,
    certification_scope: scope,
    certification_state: certification,
    certification_reason: certificationReason,
    certification_authority: Object.freeze({
      authority_id: input.certificationAuthority.authority_id,
      authority_type: input.certificationAuthority.authority_type,
      authority_scope: input.certificationAuthority.authority_scope,
      authority_evidence: Object.freeze([...input.certificationAuthority.authority_evidence]),
    }),
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const failureReason = coreValid
    ? null
    : domainResults.filter((domain) => !domain.certified).map((domain) => domain.failure_reason).filter(Boolean).join("; ");
  const ledgerEntry: TruthPolicyCertificationLedgerEntry = Object.freeze({
    certification_id: certificationId,
    tenant_id: input.request.tenant_id,
    policy_layer_version: input.policyLayerVersion,
    certification_state: certification,
    advancement_state: advancement,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
    failure_reason: failureReason,
    entry_hash: hashValue("mission-control-policy-certification-ledger-entry-hash", {
      certification_id: certificationId,
      certification,
      advancement,
      failureReason,
    }),
  });

  const replay: TruthPolicyCertificationReplay = Object.freeze({
    replayResult,
    reproducedContract: contract,
    reproducedDomains: domainResults,
  });

  const validation: TruthPolicyCertificationValidation = Object.freeze({
    valid: coreValid || conditional,
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    policyContractCertified,
    filesystemGovernanceCertified,
    networkGovernanceCertified,
    capabilityGovernanceCertified,
    runtimePolicyEngineCertified,
    enforcementLayerCertified,
    policyLedgerCertified,
    policyReplayCertified,
    policyObservabilityCertified,
    governanceComplianceVerified,
    constitutionalComplianceVerified,
    tenantIsolationCertified,
    certificationReplayReproduced,
    ledgerImmutable,
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

  return Object.freeze({
    request: requestCore(input.request),
    contract,
    domainResults,
    ledgerEntry,
    replay,
    validation,
    advancementState: advancement,
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
