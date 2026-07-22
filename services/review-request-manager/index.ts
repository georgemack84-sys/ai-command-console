import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOverrideManagement } from "@/services/override-management";
import type { OperatorActionAuthorityLevel } from "@/types/operator-action-engine";
import type { OverrideManagementResult } from "@/types/override-management";
import type {
  ReviewCompletionRecord,
  ReviewDependency,
  ReviewDependencyType,
  ReviewLedgerEntry,
  ReviewRequest,
  ReviewRequestFailureReason,
  ReviewRequestManagerFoundation,
  ReviewRequestManagerInput,
  ReviewRequestManagerResult,
  ReviewRequestObservability,
  ReviewRequestReplay,
  ReviewRequestState,
  ReviewRequestType,
  ReviewValidationResult,
  WorkflowResumptionRecord,
  WorkflowSuspensionRecord,
} from "@/types/review-request-manager";

const REVIEW_MANAGER_VERSION = "review-request-manager/v1" as const;
const AUTHORIZED_COMPONENT = "review-request-manager";
const NOW = "2026-07-04T02:00:00.000Z";

export const REVIEW_REQUEST_TYPES: readonly ReviewRequestType[] = Object.freeze(["MORE_EVIDENCE", "SIMULATION", "GOVERNANCE_REVIEW", "RECOVERY_PLAN", "CERTIFICATION_REVIEW"]);
export const REVIEW_REQUEST_STATES: readonly ReviewRequestState[] = Object.freeze(["REQUESTED", "VALIDATED", "REGISTERED", "DEPENDENCY_CREATED", "WORKFLOW_SUSPENDED", "UNDER_REVIEW", "COMPLETED", "DEPENDENCY_RESOLVED", "WORKFLOW_RESUMED"]);

const DEPENDENCY_BY_REVIEW: Readonly<Record<ReviewRequestType, ReviewDependencyType>> = Object.freeze({
  MORE_EVIDENCE: "EVIDENCE_DEPENDENCY",
  SIMULATION: "SIMULATION_DEPENDENCY",
  GOVERNANCE_REVIEW: "GOVERNANCE_DEPENDENCY",
  RECOVERY_PLAN: "RECOVERY_DEPENDENCY",
  CERTIFICATION_REVIEW: "CERTIFICATION_DEPENDENCY",
});

const AUTHORITY_RANK: Readonly<Record<OperatorActionAuthorityLevel, number>> = Object.freeze({
  Observer: 0,
  Reviewer: 1,
  Operator: 2,
  Supervisor: 3,
  "Governance Authority": 4,
  "Executive Authority": 5,
  "Certification Authority": 6,
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function requestHash(record: Omit<ReviewRequest, "integrity_hash"> | ReviewRequest): string {
  return hashWithoutIntegrity(record);
}

export function computeReviewRequestHash(record: Omit<ReviewRequest, "integrity_hash"> | ReviewRequest): string {
  return requestHash(record);
}

function dependencyHash(record: Omit<ReviewDependency, "integrity_hash"> | ReviewDependency): string {
  return hashWithoutIntegrity(record);
}

export function computeReviewDependencyHash(record: Omit<ReviewDependency, "integrity_hash"> | ReviewDependency): string {
  return dependencyHash(record);
}

function suspensionHash(record: Omit<WorkflowSuspensionRecord, "integrity_hash"> | WorkflowSuspensionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowSuspensionHash(record: Omit<WorkflowSuspensionRecord, "integrity_hash"> | WorkflowSuspensionRecord): string {
  return suspensionHash(record);
}

function completionHash(record: Omit<ReviewCompletionRecord, "integrity_hash"> | ReviewCompletionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeReviewCompletionHash(record: Omit<ReviewCompletionRecord, "integrity_hash"> | ReviewCompletionRecord): string {
  return completionHash(record);
}

function resumptionHash(record: Omit<WorkflowResumptionRecord, "integrity_hash"> | WorkflowResumptionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowResumptionHash(record: Omit<WorkflowResumptionRecord, "integrity_hash"> | WorkflowResumptionRecord): string {
  return resumptionHash(record);
}

function validationHash(record: Omit<ReviewValidationResult, "integrity_hash"> | ReviewValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ReviewLedgerEntry, "ledger_integrity_hash"> | ReviewLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function isReviewType(type: string): type is ReviewRequestType {
  return REVIEW_REQUEST_TYPES.includes(type as ReviewRequestType);
}

function authorityValid(level: string, type: string): boolean {
  const actual = AUTHORITY_RANK[level as OperatorActionAuthorityLevel] ?? -1;
  const required = type === "GOVERNANCE_REVIEW"
    ? AUTHORITY_RANK["Governance Authority"]
    : type === "CERTIFICATION_REVIEW"
      ? AUTHORITY_RANK["Certification Authority"]
      : AUTHORITY_RANK.Reviewer;
  return actual >= required;
}

export function createReviewRequest(overrideResult: OverrideManagementResult = runOverrideManagement()): ReviewRequest {
  const overrideRequest = overrideResult.override_request;
  const base: Omit<ReviewRequest, "integrity_hash"> = {
    review_request_id: `review_request_${overrideRequest.workflow_id}`,
    workflow_id: overrideRequest.workflow_id,
    tenant_id: overrideRequest.tenant_id,
    mission_id: overrideRequest.mission_id,
    request_type: "GOVERNANCE_REVIEW",
    requested_by: overrideRequest.operator_id,
    authority_level: "Governance Authority",
    justification: "Governance review is required before resuming the advisory decision workflow.",
    request_status: "WORKFLOW_RESUMED",
    governance_required: true,
    certification_required: false,
    constitutional_validated: overrideResult.validation.constitutional_valid,
    created_at: NOW,
    replay_ref: overrideRequest.replay_ref,
    lineage_ref: overrideRequest.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: requestHash(base) });
}

export function createReviewDependency(request: ReviewRequest): ReviewDependency {
  const dependencyType = isReviewType(request.request_type) ? DEPENDENCY_BY_REVIEW[request.request_type] : "GOVERNANCE_DEPENDENCY";
  const base: Omit<ReviewDependency, "integrity_hash"> = {
    dependency_id: `review_dependency_${request.request_type}_${request.workflow_id}`,
    workflow_id: request.workflow_id,
    dependency_type: dependencyType,
    dependent_component: `${String(request.request_type).toLowerCase()}_component`,
    dependency_status: "SATISFIED",
    completion_ref: `review_completion_${request.review_request_id}`,
    replay_ref: request.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: dependencyHash(base) });
}

export function createWorkflowSuspension(overrideResult: OverrideManagementResult, request: ReviewRequest): WorkflowSuspensionRecord {
  const base: Omit<WorkflowSuspensionRecord, "integrity_hash"> = {
    suspension_id: `workflow_suspension_${request.review_request_id}`,
    workflow_id: request.workflow_id,
    preserved_state: overrideResult.override_ledger[0]?.override_state ?? "FINALIZED",
    active_approvals: overrideResult.approval_result.approval_records.map((record) => record.approval_id),
    operator_owner: request.requested_by,
    governance_status: request.governance_required ? "PENDING" : "VALID",
    suspension_status: "SUSPENDED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: suspensionHash(base) });
}

export function createReviewCompletion(request: ReviewRequest, dependency: ReviewDependency): ReviewCompletionRecord {
  const base: Omit<ReviewCompletionRecord, "integrity_hash"> = {
    completion_id: dependency.completion_ref,
    review_request_id: request.review_request_id,
    workflow_id: request.workflow_id,
    completion_status: "COMPLETED",
    completion_summary: `${request.request_type} completed and recorded for workflow resumption.`,
    completed_by: request.requested_by,
    completed_at: NOW,
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: completionHash(base) });
}

export function createWorkflowResumption(request: ReviewRequest, dependency: ReviewDependency, completion: ReviewCompletionRecord): WorkflowResumptionRecord {
  const resolved = dependency.dependency_status === "SATISFIED" && completion.completion_status === "COMPLETED";
  const base: Omit<WorkflowResumptionRecord, "integrity_hash"> = {
    resumption_id: `workflow_resumption_${request.review_request_id}`,
    workflow_id: request.workflow_id,
    restored_state: "WORKFLOW_RESUMED",
    dependencies_resolved: resolved,
    workflow_resumed: resolved,
    resumption_summary: resolved ? "Workflow resumption authorized after all review dependencies were resolved." : "Workflow remains suspended until review dependencies are resolved.",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: resumptionHash(base) });
}

function collectFailures(input: {
  overrideResult: OverrideManagementResult;
  request: ReviewRequest;
  dependency: ReviewDependency;
  suspension: WorkflowSuspensionRecord;
  completion: ReviewCompletionRecord;
  resumption: WorkflowResumptionRecord;
  authorized: boolean;
}): readonly ReviewRequestFailureReason[] {
  const failures: ReviewRequestFailureReason[] = [];
  const overrideRequest = input.overrideResult.override_request;
  if (!input.authorized) failures.push("UNAUTHORIZED_REVIEW_MANAGER_ACCESS");
  if (input.overrideResult.override_management_status !== "PASS") failures.push("OVERRIDE_MANAGEMENT_FAILED");
  if (!isReviewType(input.request.request_type)) failures.push("REQUEST_TYPE_UNKNOWN");
  if (!authorityValid(input.request.authority_level, input.request.request_type)) failures.push("REQUESTER_UNAUTHORIZED");
  if (!input.request.justification.trim()) failures.push("JUSTIFICATION_MISSING");
  if (input.request.tenant_id !== overrideRequest.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.request.mission_id !== overrideRequest.mission_id) failures.push("MISSION_MISMATCH");
  if (input.request.workflow_id !== overrideRequest.workflow_id || input.suspension.workflow_id !== input.request.workflow_id) failures.push("WORKFLOW_INVALID");
  if (!input.request.constitutional_validated) failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (!input.dependency.dependency_id || input.dependency.workflow_id !== input.request.workflow_id) failures.push("DEPENDENCY_CREATION_FAILED");
  if (input.suspension.suspension_status !== "SUSPENDED" || !input.suspension.preserved_state) failures.push("WORKFLOW_SUSPENSION_FAILED");
  if (input.completion.completion_status !== "COMPLETED") failures.push("REQUIRED_REVIEW_INCOMPLETE");
  if (input.request.request_type === "GOVERNANCE_REVIEW" && input.completion.completion_status !== "COMPLETED") failures.push("GOVERNANCE_REVIEW_INCOMPLETE");
  if (input.request.request_type === "CERTIFICATION_REVIEW" && input.completion.completion_status !== "COMPLETED") failures.push("CERTIFICATION_REVIEW_INCOMPLETE");
  if (input.dependency.dependency_status !== "SATISFIED" || !input.resumption.dependencies_resolved || !input.resumption.workflow_resumed) failures.push("REQUIRED_REVIEW_INCOMPLETE");
  if (!input.request.replay_ref || !input.dependency.replay_ref || !input.suspension.replay_ref || !input.completion.replay_ref || !input.resumption.replay_ref) failures.push("REPLAY_REFERENCE_UNAVAILABLE");
  if (!input.request.lineage_ref || !input.suspension.lineage_ref || !input.completion.lineage_ref || !input.resumption.lineage_ref) failures.push("LINEAGE_INCOMPLETE");
  if (!input.request.advisory_only || !input.overrideResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    requestHash(input.request) !== input.request.integrity_hash
    || dependencyHash(input.dependency) !== input.dependency.integrity_hash
    || suspensionHash(input.suspension) !== input.suspension.integrity_hash
    || completionHash(input.completion) !== input.completion.integrity_hash
    || resumptionHash(input.resumption) !== input.resumption.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as ReviewRequestFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly ReviewRequestFailureReason[]): ReviewValidationResult {
  const has = (failure: ReviewRequestFailureReason) => failures.includes(failure);
  const base: Omit<ReviewValidationResult, "integrity_hash"> = {
    validation_id: `review_validation_${workflowId}`,
    workflow_id: workflowId,
    request_type_valid: !has("REQUEST_TYPE_UNKNOWN"),
    requester_authorized: !has("REQUESTER_UNAUTHORIZED"),
    workflow_valid: !has("WORKFLOW_INVALID") && !has("OVERRIDE_MANAGEMENT_FAILED"),
    dependency_created: !has("DEPENDENCY_CREATION_FAILED"),
    workflow_suspended: !has("WORKFLOW_SUSPENSION_FAILED"),
    review_complete: !has("REQUIRED_REVIEW_INCOMPLETE") && !has("GOVERNANCE_REVIEW_INCOMPLETE") && !has("CERTIFICATION_REVIEW_INCOMPLETE"),
    dependency_resolved: !has("REQUIRED_REVIEW_INCOMPLETE"),
    workflow_resumable: failures.length === 0,
    governance_valid: !has("GOVERNANCE_REVIEW_INCOMPLETE"),
    certification_valid: !has("CERTIFICATION_REVIEW_INCOMPLETE"),
    constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    tenant_valid: !has("TENANT_MISMATCH"),
    mission_valid: !has("MISSION_MISMATCH"),
    replay_valid: !has("REPLAY_REFERENCE_UNAVAILABLE") && !has("REPLAY_DIVERGENCE"),
    lineage_valid: !has("LINEAGE_INCOMPLETE"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function createLedger(
  request: ReviewRequest,
  dependency: ReviewDependency,
  suspension: WorkflowSuspensionRecord,
  completion: ReviewCompletionRecord,
  resumption: WorkflowResumptionRecord,
  validation: ReviewValidationResult,
): readonly ReviewLedgerEntry[] {
  const base: Omit<ReviewLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `review_ledger_${request.review_request_id}`,
    workflow_id: request.workflow_id,
    review_request_id: request.review_request_id,
    dependency_id: dependency.dependency_id,
    suspension_id: suspension.suspension_id,
    completion_id: completion.completion_id,
    resumption_id: resumption.resumption_id,
    review_state: validation.validation_status === "VALID" ? "WORKFLOW_RESUMED" : "WORKFLOW_SUSPENDED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
    integrity_hash: completion.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<ReviewRequestManagerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    override_result: result.override_result,
    review_request: result.review_request,
    review_dependency: result.review_dependency,
    suspension_record: result.suspension_record,
    completion_record: result.completion_record,
    resumption_record: result.resumption_record,
    validation: result.validation,
    review_ledger: result.review_ledger,
    failures: result.failures,
  });
}

export function runReviewRequestManager(input: ReviewRequestManagerInput = {}): ReviewRequestManagerResult {
  const override_result = input.override_result ?? runOverrideManagement();
  const review_request = input.review_request ?? createReviewRequest(override_result);
  const review_dependency = input.review_dependency ?? createReviewDependency(review_request);
  const suspension_record = input.suspension_record ?? createWorkflowSuspension(override_result, review_request);
  const completion_record = input.completion_record ?? createReviewCompletion(review_request, review_dependency);
  const resumption_record = input.resumption_record ?? createWorkflowResumption(review_request, review_dependency, completion_record);
  const initialFailures = collectFailures({
    overrideResult: override_result,
    request: review_request,
    dependency: review_dependency,
    suspension: suspension_record,
    completion: completion_record,
    resumption: resumption_record,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(review_request.workflow_id, initialFailures);
  const review_ledger = input.review_ledger ?? createLedger(review_request, review_dependency, suspension_record, completion_record, resumption_record, validation);
  const ledgerValid = review_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(ledgerValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as ReviewRequestFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(review_request.workflow_id, finalFailures);
  const finalLedger = finalValidation === validation ? review_ledger : createLedger(review_request, review_dependency, suspension_record, completion_record, resumption_record, finalValidation);
  const base: Omit<ReviewRequestManagerResult, "integrity_hash" | "replay_hash"> = {
    review_manager_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    override_result,
    review_request,
    review_dependency,
    suspension_record,
    completion_record,
    resumption_record,
    validation: finalValidation,
    review_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly ReviewRequestFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(review_request.workflow_id, replayFailures);
    const replayLedger = createLedger(review_request, review_dependency, suspension_record, completion_record, resumption_record, replayValidation);
    const replayBase: Omit<ReviewRequestManagerResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      review_manager_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      review_ledger: replayLedger,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayReviewRequestManager(result: ReviewRequestManagerResult): ReviewRequestReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && requestHash(result.review_request) === result.review_request.integrity_hash
    && dependencyHash(result.review_dependency) === result.review_dependency.integrity_hash
    && suspensionHash(result.suspension_record) === result.suspension_record.integrity_hash
    && completionHash(result.completion_record) === result.completion_record.integrity_hash
    && resumptionHash(result.resumption_record) === result.resumption_record.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.review_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: ReviewRequestFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<ReviewRequestReplay, "integrity_hash"> = {
    replay_id: "replay_review_request_manager",
    replay_valid,
    workflow_id: result.review_request.workflow_id,
    review_request_id: result.review_request.review_request_id,
    request_type: result.review_request.request_type,
    dependency_id: result.review_dependency.dependency_id,
    workflow_resumed: result.resumption_record.workflow_resumed,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildReviewRequestObservability(result: ReviewRequestManagerResult): ReviewRequestObservability {
  return Object.freeze({
    review_requests_processed: 1,
    dependencies_created: result.validation.dependency_created ? 1 : 0,
    workflows_suspended: result.validation.workflow_suspended ? 1 : 0,
    reviews_completed: result.validation.review_complete ? 1 : 0,
    workflows_resumed: result.resumption_record.workflow_resumed ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayReviewRequestManager(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getReviewRequestManagerFoundation(): ReviewRequestManagerFoundation {
  const result = runReviewRequestManager();
  const replay = replayReviewRequestManager(result);
  return Object.freeze({
    review_manager_version: REVIEW_MANAGER_VERSION,
    review_request_types: REVIEW_REQUEST_TYPES,
    review_states: REVIEW_REQUEST_STATES,
    result,
    replay,
    observability: buildReviewRequestObservability(result),
  });
}

export const ReviewRequestManager = Object.freeze({
  run: runReviewRequestManager,
  replay: replayReviewRequestManager,
});
