import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthDecisionReplayBinderCertificationGate,
  TruthCertificationState,
  TruthDecisionReplayBinderCertificationComponent,
  TruthDecisionReplayBinderCertificationContract,
  TruthDecisionReplayBinderCertificationInput,
  TruthDecisionReplayBinderCertificationLedgerEntry,
  TruthDecisionReplayBinderCertificationObservability,
  TruthDecisionReplayBinderCertificationReasonCode,
  TruthDecisionReplayBinderCertificationReplay,
  TruthDecisionReplayBinderCertificationRequest,
  TruthDecisionReplayBinderCertificationValidation,
  TruthDecisionReplayBinderCertificationVisibility,
  TruthDecisionReplayBinderCompletionGate,
  TruthReplayResult,
} from "./types";

const DEFAULT_SCOPE: readonly TruthDecisionReplayBinderCertificationComponent[] = Object.freeze([
  "Decision Replay Contract",
  "Decision Context Reconstruction Engine",
  "Evidence Replay Binder",
  "Governance Replay Binder",
  "Authority Replay Binder",
  "Confidence Replay Binder",
  "Environmental Replay Binder",
  "Decision Bundle Assembly Engine",
  "Replay Integrity Validation",
  "Replay Verification Engine",
  "Replay Ledger",
  "Tenant Replay Isolation",
  "Operator Visibility Surface",
  "Replay Observability",
  "Exact Decision Reconstruction",
  "Fail-Closed Replay Behavior",
]);

function addReason(
  reasons: TruthDecisionReplayBinderCertificationReasonCode[],
  reason: TruthDecisionReplayBinderCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: TruthDecisionReplayBinderCertificationRequest,
): TruthDecisionReplayBinderCertificationRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function completionGate(state: TruthCertificationState): TruthDecisionReplayBinderCompletionGate {
  if (state === "PASS") return "DECISION_REPLAY_BINDER_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "DECISION_REPLAY_BINDER_CONDITIONAL";
  return "DECISION_REPLAY_BINDER_FAILED";
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

export function buildTruthDecisionReplayBinderCertificationRequest(
  request: TruthDecisionReplayBinderCertificationRequest,
): TruthDecisionReplayBinderCertificationRequest {
  return requestCore(request);
}

export function sealTruthDecisionReplayBinderCertificationGate(
  input: TruthDecisionReplayBinderCertificationInput,
): SealedTruthDecisionReplayBinderCertificationGate {
  const reasons: TruthDecisionReplayBinderCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  const binder = input.replayBinder;

  const scopeValid = scope.length > 0;
  addReason(reasons, scopeValid ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");
  const authorityValid = input.certificationAuthority.trim().length > 0;
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");

  const contractCertified = binder.replay.replay_id.length > 0
    && binder.replay.decision_id.length > 0
    && binder.replay.replay_scope.length > 0
    && binder.validation.reasonCodes.includes("REPLAY_SCOPE_VALID");
  addReason(
    reasons,
    contractCertified ? "DECISION_REPLAY_CONTRACT_CERTIFIED" : "DECISION_REPLAY_CONTRACT_FAILED",
  );

  const contextCertified = binder.validation.contextValid;
  addReason(reasons, contextCertified ? "CONTEXT_RECONSTRUCTION_CERTIFIED" : "CONTEXT_RECONSTRUCTION_FAILED");
  const evidenceCertified = binder.validation.evidenceValid;
  addReason(reasons, evidenceCertified ? "EVIDENCE_REPLAY_CERTIFIED" : "EVIDENCE_REPLAY_FAILED");
  const governanceCertified = binder.validation.governanceValid;
  addReason(reasons, governanceCertified ? "GOVERNANCE_REPLAY_CERTIFIED" : "GOVERNANCE_REPLAY_FAILED");
  const authorityCertified = binder.validation.authorityValid;
  addReason(reasons, authorityCertified ? "AUTHORITY_REPLAY_CERTIFIED" : "AUTHORITY_REPLAY_FAILED");
  const confidenceCertified = binder.validation.confidenceValid;
  addReason(reasons, confidenceCertified ? "CONFIDENCE_REPLAY_CERTIFIED" : "CONFIDENCE_REPLAY_FAILED");
  const environmentCertified = binder.validation.environmentValid;
  addReason(reasons, environmentCertified ? "ENVIRONMENT_REPLAY_CERTIFIED" : "ENVIRONMENT_REPLAY_FAILED");
  const bundleCertified = binder.validation.bundleValid;
  addReason(reasons, bundleCertified ? "BUNDLE_ASSEMBLY_CERTIFIED" : "BUNDLE_ASSEMBLY_FAILED");
  const integrityCertified = binder.validation.replayValid && binder.replayResult.replayResult === "REPRODUCED";
  addReason(reasons, integrityCertified ? "REPLAY_INTEGRITY_CERTIFIED" : "REPLAY_INTEGRITY_FAILED");
  const verificationCertified = binder.validation.verificationValid && binder.replayResult.verificationState === "MATCH";
  addReason(reasons, verificationCertified ? "REPLAY_VERIFICATION_CERTIFIED" : "REPLAY_VERIFICATION_FAILED");
  const ledgerCertified = input.replayLedgerMutationDetected !== true
    && binder.validation.reasonCodes.includes("LEDGER_APPEND_ONLY")
    && binder.validation.reasonCodes.includes("LEDGER_IMMUTABLE");
  addReason(reasons, ledgerCertified ? "REPLAY_LEDGER_CERTIFIED" : "REPLAY_LEDGER_FAILED");
  const tenantIsolationCertified = binder.validation.tenantIsolationValid
    && binder.replay.tenant_id === input.request.tenant_id
    && binder.decision.decision.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(
    reasons,
    tenantIsolationCertified ? "TENANT_REPLAY_ISOLATION_CERTIFIED" : "TENANT_REPLAY_ISOLATION_FAILED",
  );
  const visibilityCertified = input.hiddenReplayFailureDetected !== true
    && binder.visibility.readOnly
    && binder.visibility.tenantScoped
    && binder.visibility.auditable
    && binder.visibility.replayLinked;
  addReason(reasons, visibilityCertified ? "OPERATOR_VISIBILITY_CERTIFIED" : "OPERATOR_VISIBILITY_FAILED");
  const observabilityCertified = input.observabilityGapDetected !== true
    && input.reportingLimitationDetected !== true
    && binder.observability.replays_total === 1;
  addReason(
    reasons,
    observabilityCertified ? "REPLAY_OBSERVABILITY_OPERATIONAL" : "REPLAY_OBSERVABILITY_GAP_DETECTED",
  );
  const exactReconstructionCertified = binder.certification === "PASS"
    && binder.replayResult.verificationState === "MATCH"
    && binder.replayResult.replayResult === "REPRODUCED";
  addReason(
    reasons,
    exactReconstructionCertified ? "EXACT_RECONSTRUCTION_CERTIFIED" : "EXACT_RECONSTRUCTION_FAILED",
  );
  const failClosedCertified = binder.validation.failClosed
    && binder.readOnly
    && binder.executionAuthorized === false
    && binder.approvalAllowed === false
    && binder.authorityMutationAllowed === false;
  addReason(reasons, failClosedCertified ? "FAIL_CLOSED_CERTIFIED" : "FAIL_OPEN_DETECTED");

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
  addReason(reasons, "DECISION_REPLAY_BINDER_CERTIFICATION_IS_NOT_CONTROL");

  const allCriticalPass = scopeValid
    && authorityValid
    && contractCertified
    && contextCertified
    && evidenceCertified
    && governanceCertified
    && authorityCertified
    && confidenceCertified
    && environmentCertified
    && bundleCertified
    && integrityCertified
    && verificationCertified
    && ledgerCertified
    && tenantIsolationCertified
    && visibilityCertified
    && observabilityCertified
    && exactReconstructionCertified
    && failClosedCertified
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
    && contractCertified
    && contextCertified
    && evidenceCertified
    && governanceCertified
    && authorityCertified
    && confidenceCertified
    && environmentCertified
    && bundleCertified
    && integrityCertified
    && verificationCertified
    && ledgerCertified
    && tenantIsolationCertified
    && visibilityCertified
    && exactReconstructionCertified
    && failClosedCertified
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
    !contractCertified && "Decision Replay Contract",
    !contextCertified && "Decision Context Reconstruction Engine",
    !evidenceCertified && "Evidence Replay Binder",
    !governanceCertified && "Governance Replay Binder",
    !authorityCertified && "Authority Replay Binder",
    !confidenceCertified && "Confidence Replay Binder",
    !environmentCertified && "Environmental Replay Binder",
    !bundleCertified && "Decision Bundle Assembly Engine",
    !integrityCertified && "Replay Integrity Validation",
    !verificationCertified && "Replay Verification Engine",
    !ledgerCertified && "Replay Ledger",
    !tenantIsolationCertified && "Tenant Replay Isolation",
    !visibilityCertified && "Operator Visibility Surface",
    !observabilityCertified && "Replay Observability",
    !exactReconstructionCertified && "Exact Decision Reconstruction",
    !failClosedCertified && "Fail-Closed Replay Behavior",
  ].filter(Boolean) as string[];

  const requiredActions = [
    !contractCertified && "repair decision replay contract",
    !contextCertified && "restore decision context reconstruction",
    !evidenceCertified && "restore evidence replay binding",
    !governanceCertified && "restore governance replay binding",
    !authorityCertified && "restore authority replay binding",
    !confidenceCertified && "restore confidence replay binding",
    !environmentCertified && "restore environmental replay binding",
    !bundleCertified && "repair replay bundle assembly",
    !integrityCertified && "restore replay integrity",
    !verificationCertified && "restore replay verification",
    !ledgerCertified && "restore immutable replay ledger",
    !tenantIsolationCertified && "restore tenant replay isolation",
    !visibilityCertified && "restore operator visibility",
    !observabilityCertified && "document and remediate observability gap",
    !exactReconstructionCertified && "restore exact reconstruction",
    !failClosedCertified && "restore fail-closed replay behavior",
  ].filter(Boolean) as string[];

  const decisionReplayBinderVersion = input.decisionReplayBinderVersion ?? "truth-decision-replay-binder/v1";
  const certification: TruthDecisionReplayBinderCertificationContract = Object.freeze({
    certification_id: hashValue("mission-control-decision-replay-binder-certification-id", {
      tenant_id: input.request.tenant_id,
      certification_timestamp: input.request.now,
      authority: input.certificationAuthority,
      replay_id: binder.replay.replay_id,
      decision_replay_binder_version: decisionReplayBinderVersion,
    }),
    certification_timestamp: input.request.now,
    decision_replay_binder_version: decisionReplayBinderVersion,
    certification_scope: scope,
    certification_state: certificationStateValue,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    replay_id: binder.replay.replay_id,
    decision_id: binder.replay.decision_id,
    evidence_references: Object.freeze([...binder.replay.evidence_references]),
  });

  const completionGateValue = completionGate(certificationStateValue);
  const replayStatus: TruthReplayResult = binder.replayResult.replayResult;
  const ledgerEntry: TruthDecisionReplayBinderCertificationLedgerEntry = Object.freeze({
    certification_id: certification.certification_id,
    tenant_id: input.request.tenant_id,
    decision_id: binder.replay.decision_id,
    replay_id: binder.replay.replay_id,
    certification_state: certification.certification_state,
    completion_gate: completionGateValue,
    replay_status: replayStatus,
    failed_components: Object.freeze([...failedComponents]),
    required_actions: Object.freeze([...requiredActions]),
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthDecisionReplayBinderCertificationVisibility = Object.freeze({
    certification_state: certification.certification_state,
    decision_replay_binder_version: certification.decision_replay_binder_version,
    certified_components: Object.freeze(scope.filter((component) => !failedComponents.includes(component))),
    failed_components: Object.freeze([...failedComponents]),
    replay_status: replayStatus,
    verification_status: binder.replayResult.verificationState,
    authority_status: authorityCertified ? "PASS" : "FAIL",
    confidence_status: confidenceCertified ? "PASS" : "FAIL",
    environment_status: environmentCertified ? "PASS" : "FAIL",
    tenant_status: tenantIsolationCertified ? "PASS" : "FAIL",
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

  const observability: TruthDecisionReplayBinderCertificationObservability = Object.freeze({
    decision_replay_certifications_total: 1,
    decision_replay_pass_total: certificationStateValue === "PASS" ? 1 : 0,
    decision_replay_conditional_total: certificationStateValue === "CONDITIONAL_PASS" ? 1 : 0,
    decision_replay_fail_total: certificationStateValue === "FAIL" ? 1 : 0,
    contract_failures: contractCertified ? 0 : 1,
    context_failures: contextCertified ? 0 : 1,
    evidence_failures: evidenceCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    authority_failures: authorityCertified ? 0 : 1,
    confidence_failures: confidenceCertified ? 0 : 1,
    environment_failures: environmentCertified ? 0 : 1,
    bundle_failures: bundleCertified ? 0 : 1,
    verification_failures: verificationCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    fail_closed_failures: failClosedCertified ? 0 : 1,
  });

  const validation: TruthDecisionReplayBinderCertificationValidation = Object.freeze({
    valid: certificationStateValue !== "FAIL",
    validationState: certificationStateValue === "FAIL" ? "INVALID" : "VALID",
    reasonCodes: Object.freeze([...reasons]),
    contractCertified,
    contextCertified,
    evidenceCertified,
    governanceCertified,
    authorityCertified,
    confidenceCertified,
    environmentCertified,
    bundleCertified,
    integrityCertified,
    verificationCertified,
    ledgerCertified,
    tenantIsolationCertified,
    visibilityCertified,
    observabilityCertified: observabilityCertified || conditionalEligible,
    exactReconstructionCertified,
    failClosedCertified,
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

  const replay: TruthDecisionReplayBinderCertificationReplay = Object.freeze({
    replayResult: replayStatus,
    executedTests: Object.freeze([...scope]),
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
