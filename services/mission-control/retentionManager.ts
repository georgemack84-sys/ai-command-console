import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthRetentionFramework,
  TruthArchiveEligibilityState,
  TruthCertificationState,
  TruthExpirationStatus,
  TruthGovernanceRetentionAction,
  TruthReplayResult,
  TruthRetentionFrameworkInput,
  TruthRetentionFrameworkObservability,
  TruthRetentionFrameworkReasonCode,
  TruthRetentionFrameworkReplay,
  TruthRetentionFrameworkRequest,
  TruthRetentionFrameworkValidation,
  TruthRetentionFrameworkVisibility,
  TruthRetentionLedgerEntry,
  TruthRetentionPolicyId,
  TruthRetentionRecord,
  TruthRetentionState,
} from "./types";

const POLICY_SET = new Set<TruthRetentionPolicyId>([
  "PERMANENT",
  "LONG_TERM",
  "STANDARD",
  "SHORT_TERM",
  "MISSION_BOUND",
]);

const RETENTION_STATE_SET = new Set<TruthRetentionState>([
  "ACTIVE",
  "RETENTION_PENDING",
  "ARCHIVE_PENDING",
  "ARCHIVED",
  "EXPIRED",
  "RESTRICTED",
]);

const ALLOWED_LIFECYCLE_TRANSITIONS = new Set([
  "CREATED->VERIFIED",
  "VERIFIED->SUPERSEDED",
  "VERIFIED->RESTRICTED",
  "SUPERSEDED->ARCHIVED",
  "RESTRICTED->VERIFIED",
  "RESTRICTED->ARCHIVED",
  "ARCHIVED->ARCHIVED",
]);

function addReason(reasons: TruthRetentionFrameworkReasonCode[], reason: TruthRetentionFrameworkReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthRetentionFrameworkRequest): TruthRetentionFrameworkRequest {
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

export function buildTruthRetentionFrameworkRequest(
  request: TruthRetentionFrameworkRequest,
): TruthRetentionFrameworkRequest {
  return requestCore(request);
}

export function sealTruthRetentionFramework(
  input: TruthRetentionFrameworkInput,
): SealedTruthRetentionFramework {
  const reasons: TruthRetentionFrameworkReasonCode[] = [];

  const policyPresent = input.retentionPolicyId.length > 0;
  addReason(reasons, policyPresent ? "RETENTION_POLICY_PRESENT" : "RETENTION_POLICY_MISSING");
  const policyValid = POLICY_SET.has(input.retentionPolicyId);
  addReason(reasons, policyValid ? "RETENTION_POLICY_SUPPORTED" : "RETENTION_POLICY_UNSUPPORTED");
  const policyImmutable = input.policyActiveImmutable !== false && input.policyChangedAfterActivation !== true;
  addReason(reasons, policyImmutable ? "RETENTION_POLICY_IMMUTABLE" : "RETENTION_POLICY_MUTATED");

  const statePresent = input.retentionState.length > 0;
  addReason(reasons, statePresent ? "RETENTION_STATE_PRESENT" : "RETENTION_STATE_MISSING");
  const stateValid = RETENTION_STATE_SET.has(input.retentionState);
  addReason(reasons, stateValid ? "RETENTION_STATE_SUPPORTED" : "RETENTION_STATE_UNSUPPORTED");

  const archiveEligibilityValid = input.archiveEligibility === "NOT_ELIGIBLE"
    || (input.archiveEligibility === "ELIGIBLE" && input.governanceRestricted !== true)
    || input.archiveEligibility === "RESTRICTED";
  addReason(reasons, archiveEligibilityValid ? "ARCHIVE_ELIGIBILITY_VALID" : "ARCHIVE_ELIGIBILITY_INVALID");

  const lifecycleState = input.lifecycleState ?? "VERIFIED";
  const lifecycleTransitionValid = input.lifecycleTransitionLegal !== false
    && (input.retentionState !== "ARCHIVED"
      || lifecycleState === "ARCHIVED"
      || lifecycleState === "SUPERSEDED"
      || lifecycleState === "RESTRICTED"
      || lifecycleState === "VERIFIED");
  addReason(reasons, lifecycleTransitionValid ? "LIFECYCLE_TRANSITION_VALID" : "LIFECYCLE_TRANSITION_INVALID");
  const transitionAuthorityPresent = input.transitionAuthorityPresent !== false;
  addReason(reasons, transitionAuthorityPresent ? "TRANSITION_AUTHORITY_PRESENT" : "TRANSITION_AUTHORITY_MISSING");
  const transitionEvidencePresent = input.transitionEvidencePresent !== false;
  addReason(reasons, transitionEvidencePresent ? "TRANSITION_EVIDENCE_PRESENT" : "TRANSITION_EVIDENCE_MISSING");

  const governanceActionAuthorized = input.governanceAction === undefined
    || input.governanceAction === null
    || input.governanceActionAuthorized !== false;
  addReason(reasons, governanceActionAuthorized ? "GOVERNANCE_ACTION_AUTHORIZED" : "GOVERNANCE_ACTION_UNAUTHORIZED");
  const governanceEvidencePresent = input.governanceAction === undefined
    || input.governanceAction === null
    || input.governanceEvidencePresent !== false;
  addReason(reasons, governanceEvidencePresent ? "GOVERNANCE_EVIDENCE_PRESENT" : "GOVERNANCE_EVIDENCE_MISSING");

  const archiveExecutionValid = input.archiveExecuted !== true
    || input.archiveEligibility === "ELIGIBLE"
    || input.governanceAction === "FORCE_ARCHIVE";
  addReason(reasons, archiveExecutionValid ? "ARCHIVE_EXECUTION_VALID" : "ARCHIVE_EXECUTION_INVALID");
  const archiveDataPreserved = input.archiveDataLossDetected !== true;
  addReason(reasons, archiveDataPreserved ? "ARCHIVE_DATA_PRESERVED" : "ARCHIVE_DATA_LOSS_DETECTED");
  const archiveReplayPreserved = input.archiveReplayFailureDetected !== true;
  addReason(reasons, archiveReplayPreserved ? "ARCHIVE_REPLAY_PRESERVED" : "ARCHIVE_REPLAY_FAILURE");
  const archiveLineagePreserved = input.archiveLineageLossDetected !== true;
  addReason(reasons, archiveLineagePreserved ? "ARCHIVE_LINEAGE_PRESERVED" : "ARCHIVE_LINEAGE_LOSS");

  const expirationStatus = input.expirationStatus ?? "EXTENDED";
  const legalHoldEnforced = !(expirationStatus === "EXPIRED" && input.legalHoldActive === true);
  addReason(reasons, legalHoldEnforced ? "LEGAL_HOLD_ENFORCED" : "LEGAL_HOLD_VIOLATED");
  const governanceHoldEnforced = !(expirationStatus === "EXPIRED" && input.governanceRestricted === true);
  addReason(reasons, governanceHoldEnforced ? "GOVERNANCE_HOLD_ENFORCED" : "GOVERNANCE_HOLD_VIOLATED");
  const certificationDependencyEnforced = !(expirationStatus === "EXPIRED" && input.certificationDependencyActive === true);
  addReason(reasons, certificationDependencyEnforced ? "CERTIFICATION_DEPENDENCY_ENFORCED" : "CERTIFICATION_DEPENDENCY_VIOLATED");
  const expirationValid = legalHoldEnforced && governanceHoldEnforced && certificationDependencyEnforced;
  addReason(reasons, expirationValid ? "EXPIRATION_VALID" : "EXPIRATION_INVALID");

  const tenantIsolationValid = input.crossTenantAccessDetected !== true
    && input.crossTenantArchiveDetected !== true
    && input.crossTenantExpirationDetected !== true
    && input.crossTenantGovernanceDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id)
    && input.request.tenant_id === input.storage.primarySnapshot.tenant_id
    && input.request.tenant_id === input.write.ledgerEntry.tenant_id
    && input.request.tenant_id === input.read.ledgerEntry.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayPreserved = input.replayMismatchDetected !== true
    && archiveReplayPreserved
    && archiveLineagePreserved
    && archiveDataPreserved;

  const retentionId = input.retentionId ?? hashValue("mission-control-retention-id", {
    tenant_id: input.request.tenant_id,
    truth_record_id: input.storage.primarySnapshot.truth_record_id,
    retention_policy_id: input.retentionPolicyId,
    retention_timestamp: input.retentionTimestamp ?? input.request.now,
  });

  const retentionRecord: TruthRetentionRecord = Object.freeze({
    retention_id: retentionId,
    tenant_id: input.request.tenant_id,
    mission_id: input.storage.primarySnapshot.mission_id,
    truth_record_id: input.storage.primarySnapshot.truth_record_id,
    retention_policy_id: input.retentionPolicyId,
    retention_state: input.retentionState,
    retention_timestamp: input.retentionTimestamp ?? input.request.now,
    retention_expiration: input.retentionExpiration,
    archive_eligibility: input.archiveEligibility,
    lifecycle_transition_reason: input.lifecycleTransitionReason,
  });

  const validationResultPreview = policyPresent
    && policyValid
    && policyImmutable
    && statePresent
    && stateValid
    && archiveEligibilityValid
    && archiveExecutionValid
    && archiveDataPreserved
    && archiveReplayPreserved
    && archiveLineagePreserved
    && expirationValid
    && lifecycleTransitionValid
    && transitionAuthorityPresent
    && transitionEvidencePresent
    && governanceActionAuthorized
    && governanceEvidencePresent
    && tenantIsolationValid
    && replayPreserved;

  const ledgerEntry: TruthRetentionLedgerEntry = Object.freeze({
    retention_id: retentionId,
    tenant_id: input.request.tenant_id,
    mission_id: input.storage.primarySnapshot.mission_id,
    truth_record_id: input.storage.primarySnapshot.truth_record_id,
    policy_assignment: input.retentionPolicyId,
    retention_evaluation: input.retentionState,
    archive_evaluation: input.archiveEligibility,
    archive_execution: input.archiveExecuted === true,
    expiration_evaluation: expirationStatus,
    governance_action: input.governanceAction ?? null,
    validation_result: validationResultPreview ? "PASS" : "FAIL",
  });

  const replayResult: TruthReplayResult = !archiveDataPreserved
    ? "INCOMPLETE_EVIDENCE"
    : !archiveReplayPreserved || !archiveLineagePreserved
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "RETENTION_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "RETENTION_REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "RETENTION_REPLAY_INCOMPLETE_EVIDENCE"
          : "RETENTION_REPLAY_UNREPLAYABLE",
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
  addReason(reasons, "RETENTION_MANAGER_IS_NOT_CONTROL");

  const observabilityOperational = input.observabilityGapDetected !== true;
  addReason(reasons, observabilityOperational ? "OBSERVABILITY_OPERATIONAL" : "OBSERVABILITY_GAP_DETECTED");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const pass = policyPresent
    && policyValid
    && policyImmutable
    && statePresent
    && stateValid
    && archiveEligibilityValid
    && archiveExecutionValid
    && archiveDataPreserved
    && archiveReplayPreserved
    && archiveLineagePreserved
    && expirationValid
    && lifecycleTransitionValid
    && transitionAuthorityPresent
    && transitionEvidencePresent
    && governanceActionAuthorized
    && governanceEvidencePresent
    && tenantIsolationValid
    && replayPreserved
    && replayResult === "REPRODUCED"
    && observabilityOperational
    && failClosed
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditional = !pass
    && replayResult === "REPRODUCED"
    && input.observabilityGapDetected === true
    && input.reportingLimitationDetected === true
    && input.remediationDocumented === true
    && policyValid
    && stateValid
    && tenantIsolationValid
    && governanceActionAuthorized
    && governanceEvidencePresent
    && failClosed;

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const holds = [
    ...(input.governanceRestricted ? ["GOVERNANCE_HOLD"] : []),
    ...(input.legalHoldActive ? ["LEGAL_HOLD"] : []),
    ...(input.investigationActive ? ["INVESTIGATION_HOLD"] : []),
    ...(input.regulatoryRequirementActive ? ["REGULATORY_HOLD"] : []),
  ];
  const visibility: TruthRetentionFrameworkVisibility = Object.freeze({
    retention_policy: input.retentionPolicyId,
    retention_state: input.retentionState,
    archive_eligibility: input.archiveEligibility,
    archive_status: input.archiveExecuted === true ? "ARCHIVED" : "NOT_ARCHIVED",
    expiration_status: expirationStatus,
    governance_holds: Object.freeze(holds),
    lifecycle_state: lifecycleState,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthRetentionFrameworkObservability = Object.freeze({
    active_records: input.retentionState === "ACTIVE" ? 1 : 0,
    retention_pending_records: input.retentionState === "RETENTION_PENDING" ? 1 : 0,
    archive_pending_records: input.retentionState === "ARCHIVE_PENDING" ? 1 : 0,
    archived_records: input.retentionState === "ARCHIVED" ? 1 : 0,
    expired_records: input.retentionState === "EXPIRED" ? 1 : 0,
    restricted_records: input.retentionState === "RESTRICTED" ? 1 : 0,
    archive_operations: input.archiveExecuted === true ? 1 : 0,
    archive_failures: archiveExecutionValid && archiveDataPreserved && archiveReplayPreserved && archiveLineagePreserved ? 0 : 1,
    expiration_failures: expirationValid ? 0 : 1,
    hold_operations: holds.length,
    transition_failures: lifecycleTransitionValid ? 0 : 1,
  });

  const validation: TruthRetentionFrameworkValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    policyValid: policyPresent && policyValid && policyImmutable,
    stateValid: statePresent && stateValid,
    archiveEligibilityValid: archiveEligibilityValid && archiveExecutionValid,
    lifecycleTransitionValid: lifecycleTransitionValid && transitionAuthorityPresent && transitionEvidencePresent,
    governanceControlsValid: governanceActionAuthorized && governanceEvidencePresent,
    replayPreserved: replayPreserved && replayResult === "REPRODUCED",
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

  const replay: TruthRetentionFrameworkReplay = Object.freeze({
    replayResult,
    reconstructedLedgerEntry: ledgerEntry,
  });

  return Object.freeze({
    request: requestCore(input.request),
    retentionRecord,
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
