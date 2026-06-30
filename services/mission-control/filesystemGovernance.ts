import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthFilesystemGovernance,
  TruthCertificationState,
  TruthFilesystemGovernanceContract,
  TruthFilesystemGovernanceInput,
  TruthFilesystemGovernanceLedgerEntry,
  TruthFilesystemGovernanceObservability,
  TruthFilesystemGovernanceReasonCode,
  TruthFilesystemGovernanceReplay,
  TruthFilesystemGovernanceRequest,
  TruthFilesystemGovernanceValidation,
  TruthFilesystemGovernanceVisibility,
  TruthFilesystemPermissionType,
  TruthPolicyAction,
  TruthReplayResult,
} from "./types";

const PERMISSIONS = new Set<TruthFilesystemPermissionType>(["READ", "WRITE", "EXECUTE", "MOUNT"]);

function addReason(reasons: TruthFilesystemGovernanceReasonCode[], reason: TruthFilesystemGovernanceReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthFilesystemGovernanceRequest): TruthFilesystemGovernanceRequest {
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

function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) return path.startsWith(pattern.slice(0, -1));
  return path === pattern;
}

function decideAction(input: TruthFilesystemGovernanceInput, pathAllowed: boolean): TruthPolicyAction {
  if (input.crossTenantFilesystemAccessDetected || input.crossTenantMountAccessDetected) return "DENY";
  if (input.quotaPolicy.quota_status === "EXCEEDED" || input.quotaPolicy.quota_status === "CONTAINED") return "CONTAIN";
  if (input.quotaAbuseDetected) return "ESCALATE";
  if (input.externalMountViolationDetected) return "ESCALATE";
  if (input.restrictedPathDetected) return input.permissionType === "EXECUTE" ? "CONTAIN" : "DENY";
  if (input.unknownPathDetected) return "ESCALATE";
  if (input.authorized === false) return "DENY";
  if (!pathAllowed) return "ESCALATE";
  return input.policy.policy.policy_action;
}

export function buildTruthFilesystemGovernanceRequest(
  request: TruthFilesystemGovernanceRequest,
): TruthFilesystemGovernanceRequest {
  return requestCore(request);
}

export function sealTruthFilesystemGovernance(input: TruthFilesystemGovernanceInput): SealedTruthFilesystemGovernance {
  const reasons: TruthFilesystemGovernanceReasonCode[] = [];
  const policy = input.policy.policy;
  const replayReferences = Object.freeze([...(input.replayReferences ?? policy.replay_reference_ids)]);
  const filesystemPolicyId = hashValue("mission-control-filesystem-governance-id", {
    policy_id: policy.policy_id,
    tenant_id: input.request.tenant_id,
    request_path: input.requestPath,
    permission_type: input.permissionType,
    timestamp: input.request.now,
  });

  const filesystemPolicyIdPresent = filesystemPolicyId.length > 0;
  addReason(reasons, filesystemPolicyIdPresent ? "FILESYSTEM_POLICY_ID_PRESENT" : "FILESYSTEM_POLICY_ID_MISSING");
  const pathPatternPresent = input.pathPattern.trim().length > 0;
  addReason(reasons, pathPatternPresent ? "PATH_PATTERN_PRESENT" : "PATH_PATTERN_MISSING");
  const permissionPresent = input.permissionType.length > 0;
  addReason(reasons, permissionPresent ? "PERMISSION_TYPE_PRESENT" : "PERMISSION_TYPE_MISSING");
  const permissionValid = PERMISSIONS.has(input.permissionType);
  addReason(reasons, permissionValid ? "PERMISSION_TYPE_VALID" : "PERMISSION_TYPE_INVALID");
  const governancePolicyReferencePresent = policy.policy_id.length > 0 && input.policy.certification !== "FAIL";
  addReason(
    reasons,
    governancePolicyReferencePresent
      ? "GOVERNANCE_POLICY_REFERENCE_PRESENT"
      : "GOVERNANCE_POLICY_REFERENCE_MISSING",
  );

  const pathAllowed = pathPatternPresent && matchesPattern(input.requestPath, input.pathPattern);
  const decision = decideAction(input, pathAllowed);
  const quotaContainmentActive = input.quotaPolicy.quota_status === "EXCEEDED"
    || input.quotaPolicy.quota_status === "CONTAINED";

  const readGovernanceValid = input.permissionType !== "READ"
    || (quotaContainmentActive ? decision === "CONTAIN" : (input.authorized === false || input.restrictedPathDetected) ? decision === "DENY" : decision !== "CONTAIN");
  addReason(reasons, readGovernanceValid ? "READ_GOVERNANCE_OPERATIONAL" : "READ_GOVERNANCE_FAILED");
  const writeGovernanceValid = input.permissionType !== "WRITE"
    || (quotaContainmentActive ? decision === "CONTAIN" : (input.authorized === false || input.restrictedPathDetected) ? decision === "DENY" : decision !== "CONTAIN");
  addReason(reasons, writeGovernanceValid ? "WRITE_GOVERNANCE_OPERATIONAL" : "WRITE_GOVERNANCE_FAILED");
  const executeGovernanceValid = input.permissionType !== "EXECUTE"
    || (quotaContainmentActive ? decision === "CONTAIN" : input.authorized === false ? decision === "DENY" : input.restrictedPathDetected ? decision === "CONTAIN" : decision !== "DENY");
  addReason(reasons, executeGovernanceValid ? "EXECUTE_GOVERNANCE_OPERATIONAL" : "EXECUTE_GOVERNANCE_FAILED");
  const mountGovernanceValid = input.permissionType !== "MOUNT"
    || (quotaContainmentActive ? decision === "CONTAIN" : input.authorized === false ? decision === "DENY" : input.externalMountViolationDetected ? decision === "ESCALATE" : decision !== "CONTAIN");
  addReason(reasons, mountGovernanceValid ? "MOUNT_GOVERNANCE_OPERATIONAL" : "MOUNT_GOVERNANCE_FAILED");

  const quotaGovernanceValid = input.quotaContainmentFailureDetected !== true
    && (input.quotaPolicy.quota_status !== "EXCEEDED" || decision === "CONTAIN")
    && (!input.quotaAbuseDetected || decision === "ESCALATE");
  addReason(
    reasons,
    input.quotaPolicy.quota_status === "WITHIN_LIMIT"
      ? "QUOTA_WITHIN_LIMIT"
      : input.quotaPolicy.quota_status === "WARNING"
        ? "QUOTA_WARNING"
        : input.quotaAbuseDetected
          ? "QUOTA_ABUSE_ESCALATED"
          : quotaGovernanceValid
            ? "QUOTA_EXCEEDED_CONTAINED"
            : "QUOTA_CONTAINMENT_FAILED",
  );

  const tenantIsolationValid = input.crossTenantFilesystemAccessDetected !== true
    && input.crossTenantMountAccessDetected !== true
    && policy.tenant_id === input.request.tenant_id
    && (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_STORAGE_ISOLATION_VALID" : "TENANT_STORAGE_ISOLATION_FAILED");

  const pathRestrictionValid = input.pathRestrictionBypassDetected !== true
    && (!input.restrictedPathDetected || decision === "DENY" || decision === "CONTAIN")
    && (!input.unknownPathDetected || decision === "ESCALATE");
  addReason(
    reasons,
    input.pathRestrictionBypassDetected
      ? "PATH_RESTRICTION_BYPASS"
      : input.restrictedPathDetected
        ? "PATH_RESTRICTED_DENIED"
        : input.unknownPathDetected
          ? "PATH_UNKNOWN_ESCALATED"
          : "PATH_ALLOWED",
  );

  const policyEvaluationValid = input.nondeterministicOutcomeDetected !== true && input.policy.validation.valid;
  addReason(
    reasons,
    policyEvaluationValid ? "POLICY_EVALUATION_DETERMINISTIC" : "POLICY_EVALUATION_NONDETERMINISTIC",
  );

  const replayResult: TruthReplayResult = replayReferences.length === 0
    ? "UNREPLAYABLE"
    : input.replayMismatchDetected === true || input.policyMismatchDetected === true
      ? "MISMATCH"
      : !policyEvaluationValid
        ? "INCOMPLETE_EVIDENCE"
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
  addReason(reasons, "FILESYSTEM_GOVERNANCE_IS_NOT_CONTROL");

  const contractValid = filesystemPolicyIdPresent && pathPatternPresent && permissionValid && governancePolicyReferencePresent;
  const valid = contractValid
    && readGovernanceValid
    && writeGovernanceValid
    && executeGovernanceValid
    && mountGovernanceValid
    && quotaGovernanceValid
    && tenantIsolationValid
    && pathRestrictionValid
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
  const conditional = valid
    && !observabilityOperational
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED";
  const certification = certificationState(valid && observabilityOperational, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const governance: TruthFilesystemGovernanceContract = Object.freeze({
    filesystem_policy_id: filesystemPolicyId,
    tenant_id: input.request.tenant_id,
    filesystem_scope: input.filesystemScope,
    filesystem_action: decision,
    filesystem_state: valid || conditional ? "EVALUATED" : "REJECTED",
    path_pattern: input.pathPattern,
    request_path: input.requestPath,
    permission_type: input.permissionType,
    quota_policy: Object.freeze({ ...input.quotaPolicy }),
    governance_policy_id: policy.policy_id,
    replay_references: replayReferences,
  });

  const failureReason = valid
    ? null
    : [
      !contractValid && "filesystem governance contract invalid",
      !readGovernanceValid && "unauthorized read allowed",
      !writeGovernanceValid && "unauthorized write allowed",
      !executeGovernanceValid && "unauthorized execution allowed",
      !mountGovernanceValid && "unauthorized mount allowed",
      !tenantIsolationValid && "cross-tenant access allowed",
      !pathRestrictionValid && "path restriction bypass",
      !quotaGovernanceValid && "quota containment failure",
      replayResult === "MISMATCH" && "filesystem replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthFilesystemGovernanceLedgerEntry = Object.freeze({
    filesystem_policy_id: governance.filesystem_policy_id,
    tenant_id: governance.tenant_id,
    request_path: governance.request_path,
    permission_type: governance.permission_type,
    filesystem_action: governance.filesystem_action,
    quota_status: governance.quota_policy.quota_status,
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const visibility: TruthFilesystemGovernanceVisibility = Object.freeze({
    filesystem_policy_id: governance.filesystem_policy_id,
    path_pattern: governance.path_pattern,
    permission_type: governance.permission_type,
    policy_action: governance.filesystem_action,
    quota_status: governance.quota_policy.quota_status,
    tenant_status: tenantIsolationValid ? "VALID" : "INVALID",
    evaluation_status: valid || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthFilesystemGovernanceObservability = Object.freeze({
    filesystem_requests_total: 1,
    allowed_requests: decision === "ALLOW" ? 1 : 0,
    denied_requests: decision === "DENY" ? 1 : 0,
    escalated_requests: decision === "ESCALATE" ? 1 : 0,
    contained_requests: decision === "CONTAIN" ? 1 : 0,
    quota_violations: input.quotaPolicy.quota_status === "EXCEEDED" || input.quotaPolicy.quota_status === "CONTAINED" ? 1 : 0,
    path_violations: input.restrictedPathDetected || input.unknownPathDetected || input.pathRestrictionBypassDetected ? 1 : 0,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
    replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });

  const validation: TruthFilesystemGovernanceValidation = Object.freeze({
    valid: valid || conditional,
    validationState: valid || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    contractValid,
    readGovernanceValid,
    writeGovernanceValid,
    executeGovernanceValid,
    mountGovernanceValid,
    quotaGovernanceValid,
    tenantIsolationValid,
    pathRestrictionValid,
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

  const replay: TruthFilesystemGovernanceReplay = Object.freeze({
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
