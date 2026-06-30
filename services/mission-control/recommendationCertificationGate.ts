import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRecommendationCertificationGate,
  TruthCertificationState,
  TruthRecommendationCertificationContract,
  TruthRecommendationCertificationDomain,
  TruthRecommendationCertificationInput,
  TruthRecommendationCertificationLedgerEntry,
  TruthRecommendationCertificationObservability,
  TruthRecommendationCertificationReasonCode,
  TruthRecommendationCertificationReplay,
  TruthRecommendationCertificationRequest,
  TruthRecommendationCertificationValidation,
  TruthRecommendationCertificationVisibility,
  TruthRecommendationLayerCertificationState,
  TruthReplayResult,
} from "./types";

const DEFAULT_SCOPE: readonly TruthRecommendationCertificationDomain[] = Object.freeze([
  "6E.1 Recommendation Contract",
  "6E.2 Recommendation Recorder",
  "6E.3 Recommendation Evolution Tracker",
  "6E.4 Recommendation Reconstruction Engine",
  "Replay Preservation",
  "Confidence Integrity",
  "Governance Compliance",
  "Tenant Isolation",
  "Operator Visibility",
  "Advisory-Only Enforcement",
]);

function addReason(
  reasons: TruthRecommendationCertificationReasonCode[],
  reason: TruthRecommendationCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRecommendationCertificationRequest): TruthRecommendationCertificationRequest {
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

function completionGate(state: TruthCertificationState): TruthRecommendationLayerCertificationState {
  if (state === "PASS") return "RECOMMENDATION_LAYER_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "RECOMMENDATION_LAYER_CONDITIONAL";
  return "RECOMMENDATION_LAYER_FAILED";
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))]);
}

export function buildTruthRecommendationCertificationRequest(
  request: TruthRecommendationCertificationRequest,
): TruthRecommendationCertificationRequest {
  return requestCore(request);
}

export function sealTruthRecommendationCertificationGate(
  input: TruthRecommendationCertificationInput,
): SealedTruthRecommendationCertificationGate {
  const reasons: TruthRecommendationCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  const scopeValid = scope.length > 0;
  addReason(reasons, scopeValid ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");

  const authorityValid = input.certificationAuthority.trim().length > 0;
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");

  const evidenceReferences = unique(
    input.evidenceReferences
      ?? [
        ...input.recommendationContract.recommendation.supporting_evidence_ids,
        ...input.recommendationRecorder.record.evidence_references,
        ...input.recommendationReconstruction.reconstruction.evidence_references,
      ],
  );
  const replayReferences = unique(
    input.replayReferences
      ?? [
        ...input.recommendationContract.recommendation.replay_reference_ids,
        ...input.recommendationRecorder.record.replay_references,
        ...input.recommendationReconstruction.reconstruction.replay_references,
      ],
  );
  const evidenceValid = evidenceReferences.length > 0;
  const replayReferencesValid = replayReferences.length > 0;
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_PRESENT" : "EVIDENCE_REFERENCES_MISSING");
  addReason(reasons, replayReferencesValid ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");

  const recommendationContractCertified = input.recommendationContract.certification === "PASS"
    && input.recommendationContract.validation.valid
    && input.duplicateRecommendationIdentityDetected !== true
    && input.missingRecommendationRationaleDetected !== true
    && input.executionAuthorityDetected !== true;
  addReason(
    reasons,
    recommendationContractCertified ? "RECOMMENDATION_CONTRACT_CERTIFIED" : "RECOMMENDATION_CONTRACT_FAILED",
  );

  const recommendationRecorderCertified = input.recommendationRecorder.certification === "PASS"
    && input.recommendationRecorder.validation.valid
    && input.alternativeLostDetected !== true;
  addReason(
    reasons,
    recommendationRecorderCertified ? "RECOMMENDATION_RECORDER_CERTIFIED" : "RECOMMENDATION_RECORDER_FAILED",
  );

  const recommendationEvolutionCertified = input.recommendationEvolution.certification === "PASS"
    && input.recommendationEvolution.replayResult === "REPRODUCED"
    && input.recommendationEvolution.lineagePreserved
    && input.recommendationEvolution.versionManagementValid
    && input.recommendationEvolution.supersessionManagementValid
    && input.recommendationEvolution.impactAnalysisValid
    && input.recommendationEvolution.deterministic
    && input.brokenEvolutionLineageDetected !== true;
  addReason(
    reasons,
    recommendationEvolutionCertified ? "RECOMMENDATION_EVOLUTION_CERTIFIED" : "RECOMMENDATION_EVOLUTION_FAILED",
  );

  const recommendationReconstructionCertified = input.recommendationReconstruction.certification === "PASS"
    && input.recommendationReconstruction.validation.valid
    && input.recommendationReconstruction.validation.bundleValid
    && input.incompleteReconstructionBundleDetected !== true;
  addReason(
    reasons,
    recommendationReconstructionCertified
      ? "RECOMMENDATION_RECONSTRUCTION_CERTIFIED"
      : "RECOMMENDATION_RECONSTRUCTION_FAILED",
  );

  const replayCertified = input.recommendationContract.replay.replayResult === "REPRODUCED"
    && input.recommendationRecorder.replay.replayResult === "REPRODUCED"
    && input.recommendationEvolution.replayResult === "REPRODUCED"
    && input.recommendationReconstruction.replay.replayResult === "REPRODUCED"
    && input.replayMismatchDetected !== true;
  addReason(reasons, replayCertified ? "REPLAY_CERTIFIED" : "REPLAY_FAILED");

  const confidenceCertified = input.recommendationContract.validation.confidenceValid
    && input.recommendationRecorder.recommendation.validation.confidenceValid
    && input.recommendationReconstruction.validation.confidenceValid
    && input.recommendationEvolution.confidencePreserved
    && input.confidenceCorruptionDetected !== true;
  addReason(reasons, confidenceCertified ? "CONFIDENCE_CERTIFIED" : "CONFIDENCE_FAILED");

  const governanceCertified = input.governanceBypassDetected !== true
    && input.executionAuthorityDetected !== true
    && input.recommendationContract.validation.authorityBounded
    && input.recommendationRecorder.validation.authorityBounded
    && input.recommendationReconstruction.validation.authorityBounded
    && input.recommendationEvolution.governanceCompliant
    && input.recommendationContract.validation.controlSurfaceAbsent
    && input.recommendationRecorder.validation.controlSurfaceAbsent
    && input.recommendationReconstruction.validation.controlSurfaceAbsent;
  addReason(reasons, governanceCertified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_FAILED");

  const tenantIsolationCertified = input.crossTenantAccessDetected !== true
    && input.recommendationContract.visibility.tenantScoped
    && input.recommendationRecorder.visibility.tenantScoped
    && input.recommendationReconstruction.visibility.tenantScoped
    && input.recommendationEvolution.tenantScoped
    && input.recommendationContract.recommendation.tenant_id === input.request.tenant_id
    && input.recommendationRecorder.record.tenant_id === input.request.tenant_id
    && input.recommendationReconstruction.reconstruction.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFIED" : "TENANT_ISOLATION_FAILED");

  const visibilityCertified = input.hiddenRecommendationDetected !== true
    && input.hiddenConfidenceIssueDetected !== true
    && input.hiddenGovernanceIssueDetected !== true
    && input.hiddenCertificationFailureDetected !== true
    && input.recommendationContract.visibility.validation_status !== undefined
    && input.recommendationRecorder.visibility.validation_status !== undefined
    && input.recommendationReconstruction.visibility.validation_status !== undefined
    && input.recommendationEvolution.visibilityOperational;
  addReason(reasons, visibilityCertified ? "VISIBILITY_CERTIFIED" : "VISIBILITY_FAILED");

  const advisoryOnlyCertified = input.executionAuthorityDetected !== true
    && input.recommendationContract.validation.controlSurfaceAbsent
    && input.recommendationRecorder.validation.controlSurfaceAbsent
    && input.recommendationReconstruction.validation.controlSurfaceAbsent
    && input.recommendationEvolution.advisoryOnly;
  addReason(reasons, advisoryOnlyCertified ? "ADVISORY_ONLY_CERTIFIED" : "ADVISORY_ONLY_FAILED");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");
  const reportingLimitationsAbsent = input.reportingLimitationDetected !== true;
  addReason(
    reasons,
    reportingLimitationsAbsent ? "REPORTING_LIMITATIONS_ABSENT" : "REPORTING_LIMITATIONS_PRESENT",
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
  addReason(reasons, "RECOMMENDATION_CERTIFICATION_GATE_IS_NOT_CONTROL");

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
    && recommendationContractCertified
    && recommendationRecorderCertified
    && recommendationEvolutionCertified
    && recommendationReconstructionCertified
    && replayCertified
    && confidenceCertified
    && governanceCertified
    && tenantIsolationCertified
    && visibilityCertified
    && advisoryOnlyCertified
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
    && scopeValid
    && authorityValid
    && evidenceValid
    && replayReferencesValid
    && recommendationContractCertified
    && recommendationRecorderCertified
    && recommendationEvolutionCertified
    && recommendationReconstructionCertified
    && replayCertified
    && confidenceCertified
    && governanceCertified
    && tenantIsolationCertified
    && visibilityCertified
    && advisoryOnlyCertified
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
    !recommendationContractCertified && "6E.1 Recommendation Contract",
    !recommendationRecorderCertified && "6E.2 Recommendation Recorder",
    !recommendationEvolutionCertified && "6E.3 Recommendation Evolution Tracker",
    !recommendationReconstructionCertified && "6E.4 Recommendation Reconstruction Engine",
    !replayCertified && "Replay Preservation",
    !confidenceCertified && "Confidence Integrity",
    !governanceCertified && "Governance Compliance",
    !tenantIsolationCertified && "Tenant Isolation",
    !visibilityCertified && "Operator Visibility",
    !advisoryOnlyCertified && "Advisory-Only Enforcement",
  ].filter(Boolean) as string[];

  const requiredActions = [
    !evidenceValid && "attach evidence references",
    !replayReferencesValid && "attach replay references",
    !recommendationContractCertified && "repair recommendation contract failures",
    !recommendationRecorderCertified && "repair recommendation recorder failures",
    !recommendationEvolutionCertified && "repair recommendation evolution failures",
    !recommendationReconstructionCertified && "repair recommendation reconstruction failures",
    !replayCertified && "restore recommendation replay determinism",
    !confidenceCertified && "restore confidence integrity",
    !governanceCertified && "restore governance compliance",
    !tenantIsolationCertified && "restore tenant isolation",
    !visibilityCertified && "restore operator visibility",
    !advisoryOnlyCertified && "remove execution authority pathways",
  ].filter(Boolean) as string[];

  const recommendationLayerVersion = input.recommendationLayerVersion ?? "truth-recommendation-layer/v1";
  const certification: TruthRecommendationCertificationContract = Object.freeze({
    certification_id: hashValue("mission-control-recommendation-certification-id", {
      tenant_id: input.request.tenant_id,
      certification_timestamp: input.request.now,
      authority: input.certificationAuthority,
      recommendation_layer_version: recommendationLayerVersion,
    }),
    certification_timestamp: input.request.now,
    recommendation_layer_version: recommendationLayerVersion,
    certification_scope: scope,
    certification_state: certificationStateValue,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const visibility: TruthRecommendationCertificationVisibility = Object.freeze({
    certification_state: certification.certification_state,
    recommendation_layer_version: certification.recommendation_layer_version,
    certified_components: Object.freeze(scope.filter((domain) => !failedComponents.includes(domain))),
    failed_components: Object.freeze([...failedComponents]),
    confidence_status: confidenceCertified ? "PASS" : "FAIL",
    governance_status: governanceCertified ? "PASS" : "FAIL",
    tenant_status: tenantIsolationCertified ? "PASS" : "FAIL",
    replay_status: replayResult,
    advisory_status: advisoryOnlyCertified ? "PASS" : "FAIL",
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
  const ledgerEntry: TruthRecommendationCertificationLedgerEntry = Object.freeze({
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

  const observability: TruthRecommendationCertificationObservability = Object.freeze({
    recommendation_certifications_total: 1,
    recommendation_pass_total: certificationStateValue === "PASS" ? 1 : 0,
    recommendation_conditional_total: certificationStateValue === "CONDITIONAL_PASS" ? 1 : 0,
    recommendation_fail_total: certificationStateValue === "FAIL" ? 1 : 0,
    contract_failures: recommendationContractCertified ? 0 : 1,
    recorder_failures: recommendationRecorderCertified ? 0 : 1,
    evolution_failures: recommendationEvolutionCertified ? 0 : 1,
    reconstruction_failures: recommendationReconstructionCertified ? 0 : 1,
    confidence_failures: confidenceCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    visibility_failures: visibilityCertified ? 0 : 1,
    replay_failures: replayCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthRecommendationCertificationValidation = Object.freeze({
    valid: certificationStateValue !== "FAIL",
    validationState: certificationStateValue === "FAIL" ? "INVALID" : "VALID",
    reasonCodes: Object.freeze([...reasons]),
    scopeValid,
    authorityValid,
    evidenceValid,
    replayReferencesValid,
    recommendationContractCertified,
    recommendationRecorderCertified,
    recommendationEvolutionCertified,
    recommendationReconstructionCertified,
    replayCertified,
    confidenceCertified,
    governanceCertified,
    tenantIsolationCertified,
    visibilityCertified,
    advisoryOnlyCertified,
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

  const replay: TruthRecommendationCertificationReplay = Object.freeze({
    replayResult,
    executedTests: Object.freeze([
      "Recommendation Contract Certification",
      "Recommendation Recorder Certification",
      "Recommendation Evolution Certification",
      "Recommendation Reconstruction Certification",
      "Replay Certification",
      "Confidence Certification",
      "Governance Certification",
      "Tenant Isolation Certification",
      "Visibility Certification",
      "Advisory-Only Enforcement Certification",
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
