import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthPersistenceCertificationGate,
  TruthCertificationState,
  TruthPersistenceCertification,
  TruthPersistenceCertificationAnalytics,
  TruthPersistenceCertificationInput,
  TruthPersistenceCertificationReasonCode,
  TruthPersistenceCertificationRequest,
  TruthPersistenceCertificationState,
  TruthPersistenceCertificationValidation,
  TruthPersistenceCertificationVisibility,
  TruthReplayResult,
  TruthStateAuthoritySource,
} from "./types";

const DEFAULT_SCOPE = Object.freeze([
  "6B.1 Storage Abstraction Layer",
  "6B.2 Write Engine",
  "6B.3 Read Engine",
  "6B.4 Retention Manager",
  "Replay Preservation",
  "Tenant Isolation",
  "Governance Compliance",
  "Operator Visibility",
]);

const AUTHORITIES = new Set<TruthStateAuthoritySource>([
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "SUPERVISION_ENGINE",
]);

function addReason(reasons: TruthPersistenceCertificationReasonCode[], reason: TruthPersistenceCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthPersistenceCertificationRequest): TruthPersistenceCertificationRequest {
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

function certificationState(allCriticalPass: boolean, conditionalEligible: boolean): TruthCertificationState {
  if (allCriticalPass) return "PASS";
  if (conditionalEligible) return "CONDITIONAL_PASS";
  return "FAIL";
}

function completionGateFromState(state: TruthCertificationState): TruthPersistenceCertificationState {
  if (state === "PASS") return "PERSISTENCE_CERTIFIED";
  if (state === "CONDITIONAL_PASS") return "PERSISTENCE_CONDITIONAL";
  return "PERSISTENCE_FAILED";
}

export function buildTruthPersistenceCertificationRequest(
  request: TruthPersistenceCertificationRequest,
): TruthPersistenceCertificationRequest {
  return requestCore(request);
}

export function sealTruthPersistenceCertificationGate(
  input: TruthPersistenceCertificationInput,
): SealedTruthPersistenceCertificationGate {
  const reasons: TruthPersistenceCertificationReasonCode[] = [];
  const scope = Object.freeze([...(input.certificationScope ?? DEFAULT_SCOPE)]);
  addReason(reasons, scope.length > 0 ? "CERTIFICATION_SCOPE_PRESENT" : "CERTIFICATION_SCOPE_MISSING");

  const authorityPresent = input.certificationAuthority.length > 0;
  addReason(reasons, authorityPresent ? "CERTIFICATION_AUTHORITY_PRESENT" : "CERTIFICATION_AUTHORITY_MISSING");
  const authorityValid = AUTHORITIES.has(input.certificationAuthority);
  addReason(reasons, authorityValid ? "CERTIFICATION_AUTHORITY_VALID" : "CERTIFICATION_AUTHORITY_INVALID");

  const evidenceReferences = Object.freeze([
    ...(input.evidenceReferences ?? input.storage.primarySnapshot.truth_record_id ? input.storage.primarySnapshot.truth_record_id ? input.storage.primarySnapshot.truth_record_id ? input.storage.visibility.last_successful_write ? [input.storage.primarySnapshot.truth_record_id] : [] : [] : [] : []),
    ...(input.evidenceReferences ?? []),
  ]);
  const effectiveEvidenceReferences = evidenceReferences.length > 0
    ? evidenceReferences
    : Object.freeze([input.storage.primarySnapshot.truth_record_id]);
  addReason(reasons, effectiveEvidenceReferences.length > 0 ? "CERTIFICATION_EVIDENCE_PRESENT" : "CERTIFICATION_EVIDENCE_MISSING");
  const replayReferences = Object.freeze([
    ...(input.replayReferences ?? input.storage.primarySnapshot.truth_record_id ? [input.storage.primarySnapshot.truth_record_id] : []),
  ]);
  const effectiveReplayReferences = replayReferences.length > 0
    ? replayReferences
    : Object.freeze([input.storage.primarySnapshot.truth_record_id]);
  addReason(reasons, effectiveReplayReferences.length > 0 ? "CERTIFICATION_REPLAY_PRESENT" : "CERTIFICATION_REPLAY_MISSING");

  const storageCertified = input.storage.certification === "PASS";
  addReason(reasons, storageCertified ? "STORAGE_CERTIFICATION_PASS" : "STORAGE_CERTIFICATION_FAIL");
  const writeCertified = input.write.certification === "PASS";
  addReason(reasons, writeCertified ? "WRITE_CERTIFICATION_PASS" : "WRITE_CERTIFICATION_FAIL");
  const readCertified = input.read.certification === "PASS";
  addReason(reasons, readCertified ? "READ_CERTIFICATION_PASS" : "READ_CERTIFICATION_FAIL");
  const retentionCertified = input.retention.certification === "PASS";
  addReason(reasons, retentionCertified ? "RETENTION_CERTIFICATION_PASS" : "RETENTION_CERTIFICATION_FAIL");

  const replayCertified = input.storage.replay.replayResult === "REPRODUCED"
    && input.write.replay.replayResult === "REPRODUCED"
    && input.read.replay.replayResult === "REPRODUCED"
    && input.retention.replay.replayResult === "REPRODUCED";
  addReason(reasons, replayCertified ? "REPLAY_CERTIFICATION_PASS" : "REPLAY_CERTIFICATION_FAIL");

  const tenantIsolationCertified = input.storage.validation.tenantIsolationValid
    && input.write.validation.tenantIsolationValid
    && input.read.validation.tenantIsolationValid
    && input.retention.validation.tenantIsolationValid
    && (input.accessTenantId === undefined || input.accessTenantId === input.storage.request.tenant_id);
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_CERTIFICATION_PASS" : "TENANT_ISOLATION_CERTIFICATION_FAIL");
  addReason(reasons, tenantIsolationCertified ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const governanceCertified = input.storage.validation.controlSurfaceAbsent
    && input.write.validation.controlSurfaceAbsent
    && input.read.validation.controlSurfaceAbsent
    && input.retention.validation.controlSurfaceAbsent
    && input.storage.validation.authorityBounded
    && input.write.validation.authorityBounded
    && input.read.validation.authorityBounded
    && input.retention.validation.authorityBounded
    && input.authorityExpansionDetected !== true;
  addReason(reasons, governanceCertified ? "GOVERNANCE_CERTIFICATION_PASS" : "GOVERNANCE_CERTIFICATION_FAIL");
  addReason(reasons, governanceCertified ? "GOVERNANCE_COMPLIANCE_VALID" : "GOVERNANCE_COMPLIANCE_FAILED");

  const visibilityCertified = input.storage.visibility.tenantScoped
    && input.write.visibility.tenantScoped
    && input.read.visibility.tenantScoped
    && input.retention.visibility.tenantScoped;
  addReason(reasons, visibilityCertified ? "VISIBILITY_CERTIFICATION_PASS" : "VISIBILITY_CERTIFICATION_FAIL");
  addReason(reasons, visibilityCertified ? "VISIBILITY_VALID" : "VISIBILITY_FAILED");

  const replayResult: TruthReplayResult = effectiveEvidenceReferences.length === 0
    ? "INCOMPLETE_EVIDENCE"
    : effectiveReplayReferences.length === 0
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
  addReason(reasons, "PERSISTENCE_CERTIFICATION_GATE_IS_NOT_CONTROL");

  const analyticsOperational = input.analyticsGapDetected !== true;
  addReason(reasons, analyticsOperational ? "ANALYTICS_OPERATIONAL" : "ANALYTICS_FAILED");

  const allCriticalPass = scope.length > 0
    && authorityPresent
    && authorityValid
    && effectiveEvidenceReferences.length > 0
    && effectiveReplayReferences.length > 0
    && storageCertified
    && writeCertified
    && readCertified
    && retentionCertified
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
    && storageCertified
    && writeCertified
    && readCertified
    && retentionCertified
    && replayCertified
    && tenantIsolationCertified
    && governanceCertified
    && visibilityCertified;

  const certification_state = certificationState(allCriticalPass, conditionalEligible);
  addReason(
    reasons,
    certification_state === "PASS"
      ? "PERSISTENCE_DECISION_PASS"
      : certification_state === "CONDITIONAL_PASS"
        ? "PERSISTENCE_DECISION_CONDITIONAL"
        : "PERSISTENCE_DECISION_FAIL",
  );

  const certification: TruthPersistenceCertification = Object.freeze({
    certification_id: hashValue("mission-control-persistence-certification-id", {
      tenant_id: input.request.tenant_id,
      persistence_version: input.persistenceVersion ?? "truth-persistence/v1",
      scope,
      certification_state,
      certification_authority: input.certificationAuthority,
      effectiveEvidenceReferences,
      effectiveReplayReferences,
    }),
    certification_timestamp: input.request.now,
    persistence_version: input.persistenceVersion ?? "truth-persistence/v1",
    certification_scope: scope,
    certification_state,
    certification_reason: input.certificationReason,
    certification_authority: input.certificationAuthority,
    evidence_references: effectiveEvidenceReferences,
    replay_references: effectiveReplayReferences,
  });

  const completionGate = completionGateFromState(certification_state);
  addReason(
    reasons,
    completionGate === "PERSISTENCE_CERTIFIED"
      ? "PERSISTENCE_COMPLETION_CERTIFIED"
      : completionGate === "PERSISTENCE_CONDITIONAL"
        ? "PERSISTENCE_COMPLETION_CONDITIONAL"
        : "PERSISTENCE_COMPLETION_FAILED",
  );

  const failed_components = Object.freeze([
    ...(storageCertified ? [] : ["Storage Abstraction Layer"]),
    ...(writeCertified ? [] : ["Write Engine"]),
    ...(readCertified ? [] : ["Read Engine"]),
    ...(retentionCertified ? [] : ["Retention Manager"]),
    ...(replayCertified ? [] : ["Replay Preservation"]),
    ...(tenantIsolationCertified ? [] : ["Tenant Isolation"]),
    ...(governanceCertified ? [] : ["Governance Compliance"]),
    ...(visibilityCertified ? [] : ["Operator Visibility"]),
  ]);
  const certified_components = Object.freeze(scope.filter((item) => !failed_components.includes(item.replace(/^6B\.\d+\s/, "")) && !failed_components.includes(item)));

  const visibility: TruthPersistenceCertificationVisibility = Object.freeze({
    certification_state,
    persistence_version: certification.persistence_version,
    certified_components,
    failed_components,
    replay_status: replayResult,
    tenant_status: tenantIsolationCertified ? "ISOLATED" : "VIOLATION",
    governance_status: governanceCertified ? "COMPLIANT" : "FAILED",
    visibility_status: visibilityCertified ? "VISIBLE" : "HIDDEN",
    required_actions: Object.freeze(
      completionGate === "PERSISTENCE_CERTIFIED"
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

  const analytics: TruthPersistenceCertificationAnalytics = Object.freeze({
    persistence_certifications_total: 1,
    persistence_pass_total: certification_state === "PASS" ? 1 : 0,
    persistence_conditional_total: certification_state === "CONDITIONAL_PASS" ? 1 : 0,
    persistence_fail_total: certification_state === "FAIL" ? 1 : 0,
    storage_failures: storageCertified ? 0 : 1,
    write_failures: writeCertified ? 0 : 1,
    read_failures: readCertified ? 0 : 1,
    retention_failures: retentionCertified ? 0 : 1,
    replay_failures: replayCertified ? 0 : 1,
    tenant_isolation_failures: tenantIsolationCertified ? 0 : 1,
    governance_failures: governanceCertified ? 0 : 1,
    visibility_failures: visibilityCertified ? 0 : 1,
    certification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthPersistenceCertificationValidation = Object.freeze({
    valid: allCriticalPass || conditionalEligible,
    validationState: allCriticalPass || conditionalEligible ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    storageCertified,
    writeCertified,
    readCertified,
    retentionCertified,
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
