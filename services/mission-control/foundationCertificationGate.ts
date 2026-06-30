import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthFoundationCertificationGate,
  TruthCertificationState,
  TruthFoundationCertification,
  TruthFoundationCertificationAnalytics,
  TruthFoundationCertificationInput,
  TruthFoundationCertificationReasonCode,
  TruthFoundationCertificationRequest,
  TruthFoundationCertificationState,
  TruthFoundationCertificationValidation,
  TruthFoundationCertificationVisibility,
  TruthReplayResult,
  TruthStateAuthoritySource,
} from "./types";

const AUTHORITIES = new Set<TruthStateAuthoritySource>([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "SUPERVISION_ENGINE",
]);

const DEFAULT_SCOPE = Object.freeze([
  "6A.1 Truth Record Contract",
  "6A.2 Truth Classification System",
  "6A.3 Truth Identity Framework",
  "6A.4 Truth State Model",
  "Replay Integrity",
  "Tenant Isolation",
  "Governance Compliance",
  "Operator Visibility",
]);

function addReason(
  reasons: TruthFoundationCertificationReasonCode[],
  reason: TruthFoundationCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthFoundationCertificationRequest): TruthFoundationCertificationRequest {
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

function certificationState(
  allCriticalPass: boolean,
  conditionalEligible: boolean,
): TruthCertificationState {
  if (allCriticalPass) return "PASS";
  if (conditionalEligible) return "CONDITIONAL_PASS";
  return "FAIL";
}

function completionGateFromState(state: TruthCertificationState): TruthFoundationCertificationState {
  if (state === "PASS") return "FOUNDATION_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "FOUNDATION_CONDITIONAL";
  return "FOUNDATION_FAILED";
}

export function buildTruthFoundationCertificationRequest(
  request: TruthFoundationCertificationRequest,
): TruthFoundationCertificationRequest {
  return requestCore(request);
}

export function sealTruthFoundationCertificationGate(
  input: TruthFoundationCertificationInput,
): SealedTruthFoundationCertificationGate {
  const reasons: TruthFoundationCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  addReason(reasons, scope.length > 0 ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");

  const authorityPresent = input.certificationAuthority.length > 0;
  addReason(reasons, authorityPresent ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");
  const authorityValid = AUTHORITIES.has(input.certificationAuthority);
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_VALID" : "CERTIFICATION_AUTHORITY_INVALID");

  const evidenceReferences = Object.freeze([
    ...(input.evidenceReferences ?? input.truthRecord.record.evidence_references),
  ]);
  addReason(reasons, evidenceReferences.length > 0 ? "CERTIFICATION_EVIDENCE_PRESENT" : "CERTIFICATION_EVIDENCE_MISSING");
  const replayReferences = Object.freeze([
    ...(input.replayReferences ?? input.truthRecord.record.replay_references),
  ]);
  addReason(reasons, replayReferences.length > 0 ? "CERTIFICATION_REPLAY_PRESENT" : "CERTIFICATION_REPLAY_MISSING");

  const truthRecordCertified = input.truthRecord.certification.certificationState === "PASS";
  addReason(reasons, truthRecordCertified ? "TRUTH_RECORD_CERTIFICATION_PASS" : "TRUTH_RECORD_CERTIFICATION_FAIL");
  const classificationCertified = input.classification.certification.certificationState === "PASS";
  addReason(reasons, classificationCertified ? "CLASSIFICATION_CERTIFICATION_PASS" : "CLASSIFICATION_CERTIFICATION_FAIL");
  const identityCertified = input.identity.certification.certificationState === "PASS";
  addReason(reasons, identityCertified ? "IDENTITY_CERTIFICATION_PASS" : "IDENTITY_CERTIFICATION_FAIL");
  const stateCertified = input.state.certification.certificationState === "PASS";
  addReason(reasons, stateCertified ? "STATE_CERTIFICATION_PASS" : "STATE_CERTIFICATION_FAIL");

  const replayCertified = input.truthRecord.replay.replayResult === "REPRODUCED"
    && input.classification.replay.replayResult === "REPRODUCED"
    && input.identity.replay.replayResult === "REPRODUCED"
    && input.state.replay.replayResult === "REPRODUCED";
  addReason(reasons, replayCertified ? "REPLAY_CERTIFICATION_PASS" : "REPLAY_CERTIFICATION_FAIL");

  const tenantIsolationCertified = input.truthRecord.validation.tenantIsolationValid
    && input.classification.validation.tenantIsolationValid
    && input.identity.validation.tenantIsolationValid
    && input.state.validation.tenantIsolationValid
    && (input.accessTenantId === undefined || input.accessTenantId === input.truthRecord.record.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFICATION_PASS" : "TENANT_ISOLATION_CERTIFICATION_FAIL");
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const governanceCertified = input.truthRecord.validation.controlSurfaceAbsent
    && input.classification.validation.controlSurfaceAbsent
    && input.identity.validation.controlSurfaceAbsent
    && input.state.validation.controlSurfaceAbsent
    && input.truthRecord.validation.authorityBounded
    && input.classification.validation.authorityBounded
    && input.identity.validation.authorityBounded
    && input.state.validation.authorityBounded
    && input.authorityExpansionDetected !== true;
  addReason(reasons, governanceCertified ? "GOVERNANCE_CERTIFICATION_PASS" : "GOVERNANCE_CERTIFICATION_FAIL");
  addReason(reasons, governanceCertified ? "GOVERNANCE_COMPLIANCE_VALID" : "GOVERNANCE_COMPLIANCE_FAILED");

  const visibilityCertified = input.truthRecord.operatorVisibility.tenantScoped
    && input.classification.operatorVisibility.every((item) => item.tenantScoped)
    && input.identity.operatorVisibility.tenantScoped
    && input.state.operatorVisibility.tenantScoped;
  addReason(reasons, visibilityCertified ? "VISIBILITY_CERTIFICATION_PASS" : "VISIBILITY_CERTIFICATION_FAIL");
  addReason(reasons, visibilityCertified ? "VISIBILITY_VALID" : "VISIBILITY_FAILED");

  const replayResult: TruthReplayResult = evidenceReferences.length === 0
    ? "INCOMPLETE_EVIDENCE"
    : replayReferences.length === 0
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
  addReason(reasons, "FOUNDATION_CERTIFICATION_GATE_IS_NOT_CONTROL");

  const analyticsOperational = true;
  addReason(reasons, analyticsOperational ? "ANALYTICS_OPERATIONAL" : "ANALYTICS_FAILED");

  const allCriticalPass = scope.length > 0
    && authorityPresent
    && authorityValid
    && evidenceReferences.length > 0
    && replayReferences.length > 0
    && truthRecordCertified
    && classificationCertified
    && identityCertified
    && stateCertified
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
    && controlSurfaceAbsent
    && analyticsOperational;

  const conditionalEligible = !allCriticalPass
    && input.observabilityGapDetected === true
    && input.analyticsGapDetected === true
    && input.remediationPlanExists === true
    && input.governanceApproved === true
    && truthRecordCertified
    && classificationCertified
    && identityCertified
    && stateCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified;

  const certification_state = certificationState(allCriticalPass, conditionalEligible);
  addReason(
    reasons,
    certification_state === "PASS"
      ? "FOUNDATION_DECISION_PASS"
      : certification_state === "CONDITIONAL_PASS"
        ? "FOUNDATION_DECISION_CONDITIONAL"
        : "FOUNDATION_DECISION_FAIL",
  );

  const certification: TruthFoundationCertification = Object.freeze({
    certification_id: hashValue("mission-control-foundation-certification-id", {
      tenant_id: input.request.tenant_id,
      foundation_version: input.foundationVersion ?? "truth-foundation/v1",
      scope,
      certification_state,
      certification_authority: input.certificationAuthority,
      evidenceReferences,
      replayReferences,
    }),
    certification_timestamp: input.request.now,
    foundation_version: input.foundationVersion ?? "truth-foundation/v1",
    certification_scope: scope,
    certification_state,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: evidenceReferences,
    replay_references: replayReferences,
  });

  const completionGate = completionGateFromState(certification_state);
  addReason(
    reasons,
    completionGate === "FOUNDATION_CERTIFIED"
      ? "FOUNDATION_COMPLETION_CERTIFIED"
      : completionGate === "FOUNDATION_CONDITIONAL"
        ? "FOUNDATION_COMPLETION_CONDITIONAL"
        : "FOUNDATION_COMPLETION_FAILED",
  );

  const failed_components = Object.freeze([
    ...(truthRecordCertified ? [] : ["Truth Record Contract"]),
    ...(classificationCertified ? [] : ["Truth Classification System"]),
    ...(identityCertified ? [] : ["Truth Identity Framework"]),
    ...(stateCertified ? [] : ["Truth State Model"]),
    ...(replayCertified ? [] : ["Replay Integrity"]),
    ...(tenantIsolationCertified ? [] : ["Tenant Isolation"]),
    ...(governanceCertified ? [] : ["Governance Compliance"]),
    ...(visibilityCertified ? [] : ["Operator Visibility"]),
  ]);
  const certified_components = Object.freeze(scope.filter((item) => !failed_components.includes(item.replace(/^6A\.\d+\s/, "")) && !failed_components.includes(item)));

  const visibility: TruthFoundationCertificationVisibility = Object.freeze({
    certification_state,
    foundation_version: certification.foundation_version,
    certified_components,
    failed_components,
    replay_status: replayResult,
    tenant_status: tenantIsolationCertified ? "ISOLATED" : "VIOLATION",
    governance_status: governanceCertified ? "COMPLIANT" : "FAILED",
    visibility_status: visibilityCertified ? "VISIBLE" : "HIDDEN",
    required_actions: Object.freeze(
      completionGate === "FOUNDATION_CERTIFIED"
        ? []
        : failed_components.map((component) => `Remediate ${component}`),
    ),
    certification_timestamp: certification.certification_timestamp,
    certification_authority: certification.certification_authority,
    readOnly: true,
    tenantScoped: tenantIsolationCertified,
    auditable: true,
    replayLinked: true,
  });

  const analytics: TruthFoundationCertificationAnalytics = Object.freeze({
    foundation_certifications_total: 1,
    foundation_pass_total: certification_state === "PASS" ? 1 : 0,
    foundation_conditional_total: certification_state === "CONDITIONAL_PASS" ? 1 : 0,
    foundation_fail_total: certification_state === "FAIL" ? 1 : 0,
    truth_record_failures: truthRecordCertified ? 0 : 1,
    classification_failures: classificationCertified ? 0 : 1,
    identity_failures: identityCertified ? 0 : 1,
    state_failures: stateCertified ? 0 : 1,
    replay_failures: replayCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    visibility_failures: visibilityCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthFoundationCertificationValidation = Object.freeze({
    valid: allCriticalPass || conditionalEligible,
    validationState: allCriticalPass || conditionalEligible ? "VALID" : "INVALID",
    reasonCodes: [...reasons],
    truthRecordCertified,
    classificationCertified,
    identityCertified,
    stateCertified,
    replayCertified,
    tenantIsolationCertified,
    governanceCertified,
    visibilityCertified,
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
    certification,
    validation,
    replay: Object.freeze({
      replayResult,
      reconstructedCertification: certification,
    }),
    visibility,
    analytics,
    completionGate,
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
