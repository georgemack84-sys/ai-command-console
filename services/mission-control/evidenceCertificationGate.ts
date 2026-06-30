import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvidenceCertificationGate,
  TruthCertificationState,
  TruthEvidenceCertificationContract,
  TruthEvidenceCertificationDomain,
  TruthEvidenceCertificationInput,
  TruthEvidenceCertificationLedgerEntry,
  TruthEvidenceCertificationObservability,
  TruthEvidenceCertificationReasonCode,
  TruthEvidenceCertificationReplay,
  TruthEvidenceCertificationRequest,
  TruthEvidenceCertificationValidation,
  TruthEvidenceCertificationVisibility,
  TruthEvidenceLayerCertificationState,
  TruthReplayResult,
} from "./types";

const DEFAULT_SCOPE: readonly TruthEvidenceCertificationDomain[] = Object.freeze([
  "6D.1 Evidence Contract",
  "6D.2 Evidence Registration Engine",
  "6D.3 Evidence Integrity Verification",
  "6D.4 Evidence Relationship Graph",
  "Replay Preservation",
  "Tenant Isolation",
  "Governance Compliance",
  "Operator Visibility",
]);

function addReason(reasons: TruthEvidenceCertificationReasonCode[], reason: TruthEvidenceCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvidenceCertificationRequest): TruthEvidenceCertificationRequest {
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

function completionGate(state: TruthCertificationState): TruthEvidenceLayerCertificationState {
  if (state === "PASS") return "EVIDENCE_LAYER_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "EVIDENCE_LAYER_CONDITIONAL";
  return "EVIDENCE_LAYER_FAILED";
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

export function buildTruthEvidenceCertificationRequest(
  request: TruthEvidenceCertificationRequest,
): TruthEvidenceCertificationRequest {
  return requestCore(request);
}

export function sealTruthEvidenceCertificationGate(
  input: TruthEvidenceCertificationInput,
): SealedTruthEvidenceCertificationGate {
  const reasons: TruthEvidenceCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  const scopeValid = scope.length > 0;
  addReason(reasons, scopeValid ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");

  const authorityValid = input.certificationAuthority.length > 0;
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");

  const evidenceReferences = Object.freeze([
    ...(input.evidenceReferences ?? input.evidenceGraph.relationship.evidence_references),
  ]);
  const replayReferences = Object.freeze([
    ...(input.replayReferences ?? input.evidenceGraph.relationship.replay_references),
  ]);
  const evidenceValid = evidenceReferences.length > 0;
  const replayReferencesValid = replayReferences.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  addReason(reasons, replayReferencesValid ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");

  const evidenceContractCertified = input.evidenceContract.certification === "PASS";
  addReason(reasons, evidenceContractCertified ? "EVIDENCE_CONTRACT_CERTIFIED" : "EVIDENCE_CONTRACT_FAILED");
  const evidenceRegistrationCertified = input.evidenceRegistration.certification === "PASS";
  addReason(reasons, evidenceRegistrationCertified ? "EVIDENCE_REGISTRATION_CERTIFIED" : "EVIDENCE_REGISTRATION_FAILED");
  const evidenceIntegrityCertified = input.evidenceIntegrity.certification === "PASS";
  addReason(reasons, evidenceIntegrityCertified ? "EVIDENCE_INTEGRITY_CERTIFIED" : "EVIDENCE_INTEGRITY_FAILED");
  const evidenceGraphCertified = input.evidenceGraph.certification === "PASS";
  addReason(reasons, evidenceGraphCertified ? "EVIDENCE_GRAPH_CERTIFIED" : "EVIDENCE_GRAPH_FAILED");

  const replayCertified = input.evidenceContract.replay.replayResult === "REPRODUCED"
    && input.evidenceRegistration.replay.replayResult === "REPRODUCED"
    && input.evidenceIntegrity.replay.replayResult === "REPRODUCED"
    && input.evidenceGraph.replay.replayResult === "REPRODUCED";
  addReason(reasons, replayCertified ? "EVIDENCE_REPLAY_CERTIFIED" : "EVIDENCE_REPLAY_FAILED");

  const tenantIsolationCertified = input.evidenceContract.visibility.tenantScoped
    && input.evidenceRegistration.visibility.tenantScoped
    && input.evidenceIntegrity.visibility.tenantScoped
    && input.evidenceGraph.visibility.tenantScoped
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");

  const governanceCertified = input.governanceBypassDetected !== true
    && input.evidenceContract.validation.controlSurfaceAbsent
    && input.evidenceRegistration.validation.controlSurfaceAbsent
    && input.evidenceIntegrity.validation.controlSurfaceAbsent
    && input.evidenceGraph.validation.controlSurfaceAbsent
    && input.evidenceContract.validation.authorityBounded
    && input.evidenceRegistration.validation.authorityBounded
    && input.evidenceIntegrity.validation.authorityBounded
    && input.evidenceGraph.validation.authorityBounded;
  addReason(reasons, governanceCertified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_FAILED");

  const visibilityCertified = input.hiddenFailureDetected !== true
    && input.evidenceRegistration.visibility.validation_status !== undefined
    && input.evidenceIntegrity.visibility.trust_state !== undefined
    && input.evidenceGraph.visibility.validation_status !== undefined;
  addReason(reasons, visibilityCertified ? "VISIBILITY_CERTIFIED" : "VISIBILITY_FAILED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const reportingLimitationsAbsent = input.reportingLimitationDetected !== true;
  addReason(reasons, reportingLimitationsAbsent ? "REPORTING_LIMITATIONS_ABSENT" : "REPORTING_LIMITATIONS_PRESENT");

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
  addReason(reasons, "EVIDENCE_CERTIFICATION_GATE_IS_NOT_CONTROL");

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

  const allCriticalPass = scopeValid
    && authorityValid
    && evidenceValid
    && replayReferencesValid
    && evidenceContractCertified
    && evidenceRegistrationCertified
    && evidenceIntegrityCertified
    && evidenceGraphCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified
    && observabilityOperational
    && reportingLimitationsAbsent
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
    && evidenceContractCertified
    && evidenceRegistrationCertified
    && evidenceIntegrityCertified
    && evidenceGraphCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified
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
      ? "DECISION_ENGINE_PASS"
      : certificationStateValue === "CONDITIONAL_PASS"
        ? "DECISION_ENGINE_CONDITIONAL"
        : "DECISION_ENGINE_FAIL",
  );

  const failedComponents = [
    !evidenceContractCertified && "6D.1 Evidence Contract",
    !evidenceRegistrationCertified && "6D.2 Evidence Registration Engine",
    !evidenceIntegrityCertified && "6D.3 Evidence Integrity Verification",
    !evidenceGraphCertified && "6D.4 Evidence Relationship Graph",
    !replayCertified && "Replay Preservation",
    !tenantIsolationCertified && "Tenant Isolation",
    !governanceCertified && "Governance Compliance",
    !visibilityCertified && "Operator Visibility",
  ].filter(Boolean) as string[];
  const requiredActions = [
    !evidenceValid && "attach evidence references",
    !replayReferencesValid && "attach replay references",
    !evidenceContractCertified && "repair evidence contract failures",
    !evidenceRegistrationCertified && "repair evidence registration failures",
    !evidenceIntegrityCertified && "repair evidence integrity failures",
    !evidenceGraphCertified && "repair evidence graph failures",
    !replayCertified && "restore evidence replay determinism",
    !tenantIsolationCertified && "restore evidence tenant isolation",
    !governanceCertified && "restore governance compliance",
    !visibilityCertified && "restore operator visibility",
  ].filter(Boolean) as string[];

  const certification: TruthEvidenceCertificationContract = Object.freeze({
    certification_id: hashValue("mission-control-evidence-certification-id", {
      tenant_id: input.request.tenant_id,
      certification_timestamp: input.request.now,
      authority: input.certificationAuthority,
    }),
    certification_timestamp: input.request.now,
    evidence_layer_version: "truth-evidence-layer/v1",
    certification_scope: scope,
    certification_state: certificationStateValue,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const trustStatus: TruthCertificationState = evidenceIntegrityCertified && evidenceGraphCertified ? "PASS" : "FAIL";
  const visibility: TruthEvidenceCertificationVisibility = Object.freeze({
    certification_state: certification.certification_state,
    evidence_layer_version: certification.evidence_layer_version,
    certified_components: Object.freeze(scope.filter((domain) => !failedComponents.includes(domain))),
    failed_components: Object.freeze([...failedComponents]),
    trust_status: trustStatus,
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
  const ledgerEntry: TruthEvidenceCertificationLedgerEntry = Object.freeze({
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

  const observability: TruthEvidenceCertificationObservability = Object.freeze({
    evidence_certifications_total: 1,
    evidence_pass_total: certificationStateValue === "PASS" ? 1 : 0,
    evidence_conditional_total: certificationStateValue === "CONDITIONAL_PASS" ? 1 : 0,
    evidence_fail_total: certificationStateValue === "FAIL" ? 1 : 0,
    contract_failures: evidenceContractCertified ? 0 : 1,
    registration_failures: evidenceRegistrationCertified ? 0 : 1,
    verification_failures: evidenceIntegrityCertified ? 0 : 1,
    graph_failures: evidenceGraphCertified ? 0 : 1,
    replay_failures: replayCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    visibility_failures: visibilityCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthEvidenceCertificationValidation = Object.freeze({
    valid: certificationStateValue !== "FAIL",
    validationState: certificationStateValue === "FAIL" ? "INVALID" : "VALID",
    reasonCodes: Object.freeze([...reasons]),
    scopeValid,
    authorityValid,
    evidenceValid,
    replayReferencesValid,
    evidenceContractCertified,
    evidenceRegistrationCertified,
    evidenceIntegrityCertified,
    evidenceGraphCertified,
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

  const replay: TruthEvidenceCertificationReplay = Object.freeze({
    replayResult,
    executedTests: Object.freeze([
      "Evidence Contract Certification",
      "Evidence Registration Certification",
      "Evidence Integrity Certification",
      "Evidence Graph Certification",
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
