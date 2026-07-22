import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { processOperatorAction } from "@/services/operator-action-engine";
import type { OperatorActionAuthorityLevel, OperatorActionEngineResult } from "@/types/operator-action-engine";
import type {
  ApprovalCompletion,
  ApprovalDependency,
  ApprovalLedgerEntry,
  ApprovalManagementFailureReason,
  ApprovalManagementFoundation,
  ApprovalManagementInput,
  ApprovalManagementObservability,
  ApprovalManagementReplay,
  ApprovalManagementResult,
  ApprovalManagementValidationResult,
  ApprovalRecord,
  ApprovalRequest,
  ApprovalState,
  ApprovalType,
} from "@/types/approval-management-engine";

const APPROVAL_MANAGEMENT_VERSION = "approval-management-engine/v1" as const;
const AUTHORIZED_COMPONENT = "approval-management-engine";
const NOW = "2026-07-04T01:44:00.000Z";

export const APPROVAL_TYPES: readonly ApprovalType[] = Object.freeze([
  "GOVERNANCE_APPROVAL",
  "SUPERVISORY_APPROVAL",
  "OPERATOR_APPROVAL",
  "CERTIFICATION_APPROVAL",
]);

export const APPROVAL_STATES: readonly ApprovalState[] = Object.freeze(["PENDING", "ASSIGNED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"]);

const REQUIRED_AUTHORITY: Readonly<Record<ApprovalType, OperatorActionAuthorityLevel>> = Object.freeze({
  GOVERNANCE_APPROVAL: "Governance Authority",
  SUPERVISORY_APPROVAL: "Supervisor",
  OPERATOR_APPROVAL: "Operator",
  CERTIFICATION_APPROVAL: "Certification Authority",
});

const APPROVAL_SEQUENCE: readonly ApprovalType[] = Object.freeze(["GOVERNANCE_APPROVAL", "SUPERVISORY_APPROVAL", "OPERATOR_APPROVAL", "CERTIFICATION_APPROVAL"]);

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

function requestHash(record: Omit<ApprovalRequest, "integrity_hash"> | ApprovalRequest): string {
  return hashWithoutIntegrity(record);
}

export function computeApprovalRequestHash(record: Omit<ApprovalRequest, "integrity_hash"> | ApprovalRequest): string {
  return requestHash(record);
}

function recordHash(record: Omit<ApprovalRecord, "integrity_hash"> | ApprovalRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeApprovalRecordHash(record: Omit<ApprovalRecord, "integrity_hash"> | ApprovalRecord): string {
  return recordHash(record);
}

function dependencyHash(record: Omit<ApprovalDependency, "integrity_hash"> | ApprovalDependency): string {
  return hashWithoutIntegrity(record);
}

export function computeApprovalDependencyHash(record: Omit<ApprovalDependency, "integrity_hash"> | ApprovalDependency): string {
  return dependencyHash(record);
}

function completionHash(record: Omit<ApprovalCompletion, "integrity_hash"> | ApprovalCompletion): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<ApprovalManagementValidationResult, "integrity_hash"> | ApprovalManagementValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ApprovalLedgerEntry, "ledger_integrity_hash"> | ApprovalLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function isApprovalType(value: string): value is ApprovalType {
  return APPROVAL_TYPES.includes(value as ApprovalType);
}

function authorityMeets(actual: string, required: string): boolean {
  const actualRank = AUTHORITY_RANK[actual as OperatorActionAuthorityLevel] ?? -1;
  const requiredRank = AUTHORITY_RANK[required as OperatorActionAuthorityLevel] ?? Number.POSITIVE_INFINITY;
  return actualRank >= requiredRank;
}

export function createApprovalRequests(actionResult: OperatorActionEngineResult = processOperatorAction()): readonly ApprovalRequest[] {
  const actionRequest = actionResult.action_request;
  const requests = APPROVAL_SEQUENCE.map((approvalType, index) => {
    const dependencies = index === 0 ? [] : [`approval_dependency_${APPROVAL_SEQUENCE[index - 1]}_${approvalType}_${actionRequest.workflow_id}`];
    const base: Omit<ApprovalRequest, "integrity_hash"> = {
      approval_request_id: `approval_request_${approvalType}_${actionRequest.workflow_id}`,
      workflow_id: actionRequest.workflow_id,
      tenant_id: actionRequest.tenant_id,
      mission_id: actionRequest.mission_id,
      approval_type: approvalType,
      required_authority: REQUIRED_AUTHORITY[approvalType],
      assigned_approver: `${approvalType.toLowerCase()}_approver`,
      dependency_refs: Object.freeze(dependencies),
      approval_status: "COMPLETED",
      requested_at: NOW,
      replay_ref: actionRequest.replay_ref,
      lineage_ref: actionRequest.lineage_ref,
      advisory_only: true,
    };
    return Object.freeze({ ...base, integrity_hash: requestHash(base) });
  });
  return Object.freeze(requests);
}

export function createApprovalDependencies(actionResult: OperatorActionEngineResult = processOperatorAction()): readonly ApprovalDependency[] {
  const workflowId = actionResult.action_request.workflow_id;
  const dependencies = APPROVAL_SEQUENCE.slice(1).map((approvalType, index) => {
    const parent = APPROVAL_SEQUENCE[index]!;
    const base: Omit<ApprovalDependency, "integrity_hash"> = {
      dependency_id: `approval_dependency_${parent}_${approvalType}_${workflowId}`,
      workflow_id: workflowId,
      parent_approval: parent,
      child_approval: approvalType,
      dependency_type: "SEQUENTIAL",
      dependency_status: "SATISFIED",
      replay_ref: actionResult.action_request.replay_ref,
    };
    return Object.freeze({ ...base, integrity_hash: dependencyHash(base) });
  });
  return Object.freeze(dependencies);
}

export function createApprovalRecords(
  actionResult: OperatorActionEngineResult = processOperatorAction(),
  requests: readonly ApprovalRequest[] = createApprovalRequests(actionResult),
): readonly ApprovalRecord[] {
  const records = requests.map((request) => {
    const approvalType = isApprovalType(request.approval_type) ? request.approval_type : "OPERATOR_APPROVAL";
    const base: Omit<ApprovalRecord, "integrity_hash"> = {
      approval_id: `approval_record_${request.approval_type}_${request.workflow_id}`,
      workflow_id: request.workflow_id,
      approval_type: request.approval_type,
      approver_id: request.assigned_approver,
      authority_level: REQUIRED_AUTHORITY[approvalType],
      approval_result: "APPROVED",
      approval_reason: `${request.approval_type} completed for advisory workflow progression.`,
      dependency_status: "SATISFIED",
      replay_ref: actionResult.action_request.replay_ref,
      lineage_ref: actionResult.action_request.lineage_ref,
      timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  });
  return Object.freeze(records);
}

function collectFailures(input: {
  actionResult: OperatorActionEngineResult;
  requests: readonly ApprovalRequest[];
  dependencies: readonly ApprovalDependency[];
  records: readonly ApprovalRecord[];
  authorized: boolean;
}): readonly ApprovalManagementFailureReason[] {
  const failures: ApprovalManagementFailureReason[] = [];
  const actionRequest = input.actionResult.action_request;
  const requestTypes = input.requests.map((request) => request.approval_type);
  const recordTypes = input.records.map((record) => record.approval_type);
  const dependencyIds = new Set(input.dependencies.map((dependency) => dependency.dependency_id));
  if (!input.authorized) failures.push("UNAUTHORIZED_APPROVAL_ENGINE_ACCESS");
  if (input.actionResult.action_engine_status !== "PASS") failures.push("ACTION_ENGINE_FAILED");
  if (input.actionResult.action_result.action_status !== "EXECUTED") failures.push("WORKFLOW_STATE_INVALID");
  if (APPROVAL_TYPES.some((type) => !requestTypes.includes(type) || !recordTypes.includes(type))) failures.push("REQUIRED_APPROVAL_MISSING");
  if (!requestTypes.includes("GOVERNANCE_APPROVAL") || !recordTypes.includes("GOVERNANCE_APPROVAL")) failures.push("GOVERNANCE_APPROVAL_MISSING");
  if (!requestTypes.includes("CERTIFICATION_APPROVAL") || !recordTypes.includes("CERTIFICATION_APPROVAL")) failures.push("CERTIFICATION_APPROVAL_MISSING");
  if (new Set(requestTypes).size !== requestTypes.length || new Set(recordTypes).size !== recordTypes.length) failures.push("DUPLICATE_APPROVAL_DETECTED");
  if (input.requests.some((request) => !isApprovalType(request.approval_type)) || input.records.some((record) => !isApprovalType(record.approval_type))) failures.push("APPROVAL_TYPE_INVALID");
  if (input.requests.some((request) => request.tenant_id !== actionRequest.tenant_id)) failures.push("TENANT_MISMATCH");
  if (input.requests.some((request) => request.mission_id !== actionRequest.mission_id)) failures.push("MISSION_MISMATCH");
  if (input.requests.some((request) => !request.replay_ref) || input.records.some((record) => !record.replay_ref) || input.dependencies.some((dependency) => !dependency.replay_ref)) failures.push("REPLAY_REFERENCE_UNAVAILABLE");
  if (input.requests.some((request) => !request.lineage_ref) || input.records.some((record) => !record.lineage_ref)) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.requests.some((request) => !request.advisory_only) || !input.actionResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (input.requests.some((request) => request.dependency_refs.some((dependencyRef) => !dependencyIds.has(dependencyRef)))) failures.push("APPROVAL_DEPENDENCY_INCOMPLETE");
  if (input.dependencies.some((dependency) => dependency.dependency_status !== "SATISFIED") || input.records.some((record) => record.dependency_status !== "SATISFIED")) failures.push("APPROVAL_DEPENDENCY_INCOMPLETE");
  if (input.records.some((record) => record.approval_result !== "APPROVED")) failures.push("CONSTITUTIONAL_APPROVAL_FAILED");
  if (input.records.some((record) => !isApprovalType(record.approval_type) || !authorityMeets(record.authority_level, REQUIRED_AUTHORITY[record.approval_type as ApprovalType]))) failures.push("APPROVER_UNAUTHORIZED");
  if (
    input.requests.some((request) => requestHash(request) !== request.integrity_hash)
    || input.dependencies.some((dependency) => dependencyHash(dependency) !== dependency.integrity_hash)
    || input.records.some((record) => recordHash(record) !== record.integrity_hash)
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as ApprovalManagementFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly ApprovalManagementFailureReason[]): ApprovalManagementValidationResult {
  const has = (failure: ApprovalManagementFailureReason) => failures.includes(failure);
  const base: Omit<ApprovalManagementValidationResult, "integrity_hash"> = {
    validation_id: `approval_management_validation_${workflowId}`,
    workflow_id: workflowId,
    required_approvals_present: !has("REQUIRED_APPROVAL_MISSING") && !has("GOVERNANCE_APPROVAL_MISSING") && !has("CERTIFICATION_APPROVAL_MISSING"),
    approvers_authorized: !has("APPROVER_UNAUTHORIZED"),
    dependencies_satisfied: !has("APPROVAL_DEPENDENCY_INCOMPLETE"),
    workflow_eligible: !has("WORKFLOW_STATE_INVALID") && !has("ACTION_ENGINE_FAILED"),
    governance_valid: !has("GOVERNANCE_APPROVAL_MISSING"),
    constitutional_valid: !has("CONSTITUTIONAL_APPROVAL_FAILED"),
    certification_valid: !has("CERTIFICATION_APPROVAL_MISSING"),
    tenant_valid: !has("TENANT_MISMATCH"),
    mission_valid: !has("MISSION_MISMATCH"),
    replay_valid: !has("REPLAY_REFERENCE_UNAVAILABLE") && !has("REPLAY_DIVERGENCE"),
    lineage_valid: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    approval_completion_valid: failures.length === 0,
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function createCompletion(actionResult: OperatorActionEngineResult, records: readonly ApprovalRecord[], validation: ApprovalManagementValidationResult): ApprovalCompletion {
  const completed = APPROVAL_SEQUENCE.filter((type) => records.some((record) => record.approval_type === type && record.approval_result === "APPROVED"));
  const base: Omit<ApprovalCompletion, "integrity_hash"> = {
    completion_id: `approval_completion_${actionResult.action_request.workflow_id}`,
    workflow_id: actionResult.action_request.workflow_id,
    required_approvals: APPROVAL_SEQUENCE,
    completed_approvals: Object.freeze(completed),
    workflow_progression_authorized: validation.validation_status === "VALID",
    completion_status: validation.validation_status === "VALID" ? "COMPLETE" : "BLOCKED",
    completion_summary: validation.validation_status === "VALID"
      ? "All mandatory approvals are complete and workflow progression is authorized."
      : "Workflow progression is blocked until mandatory approvals are valid and complete.",
    replay_ref: actionResult.action_request.replay_ref,
    lineage_ref: actionResult.action_request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: completionHash(base) });
}

function createApprovalLedger(
  requests: readonly ApprovalRequest[],
  records: readonly ApprovalRecord[],
): readonly ApprovalLedgerEntry[] {
  const entries = records.map((record) => {
    const request = requests.find((candidate) => candidate.approval_type === record.approval_type);
    const base: Omit<ApprovalLedgerEntry, "ledger_integrity_hash"> = {
      ledger_id: `approval_ledger_${record.approval_id}`,
      workflow_id: record.workflow_id,
      approval_type: record.approval_type,
      approval_request_id: request?.approval_request_id ?? "",
      approval_id: record.approval_id,
      approval_status: request?.approval_status ?? "PENDING",
      approval_result: record.approval_result,
      dependency_status: record.dependency_status,
      replay_ref: record.replay_ref,
      lineage_ref: record.lineage_ref,
      integrity_hash: record.integrity_hash,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) });
  });
  return Object.freeze(entries);
}

function resultReplayHash(result: Omit<ApprovalManagementResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    action_result: result.action_result,
    approval_requests: result.approval_requests,
    approval_dependencies: result.approval_dependencies,
    approval_records: result.approval_records,
    validation: result.validation,
    completion: result.completion,
    approval_ledger: result.approval_ledger,
    failures: result.failures,
  });
}

export function runApprovalManagement(input: ApprovalManagementInput = {}): ApprovalManagementResult {
  const action_result = input.action_result ?? processOperatorAction();
  const approval_requests = input.approval_requests ?? createApprovalRequests(action_result);
  const approval_dependencies = input.approval_dependencies ?? createApprovalDependencies(action_result);
  const approval_records = input.approval_records ?? createApprovalRecords(action_result, approval_requests);
  const initialFailures = collectFailures({
    actionResult: action_result,
    requests: approval_requests,
    dependencies: approval_dependencies,
    records: approval_records,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(action_result.action_request.workflow_id, initialFailures);
  const completion = createCompletion(action_result, approval_records, validation);
  const approval_ledger = input.approval_ledger ?? createApprovalLedger(approval_requests, approval_records);
  const generatedHashesValid = completionHash(completion) === completion.integrity_hash
    && approval_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(generatedHashesValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as ApprovalManagementFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(action_result.action_request.workflow_id, finalFailures);
  const finalCompletion = finalValidation === validation ? completion : createCompletion(action_result, approval_records, finalValidation);
  const finalLedger = finalValidation === validation ? approval_ledger : createApprovalLedger(approval_requests, approval_records);
  const base: Omit<ApprovalManagementResult, "integrity_hash" | "replay_hash"> = {
    approval_management_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    action_result,
    approval_requests,
    approval_dependencies,
    approval_records,
    validation: finalValidation,
    completion: finalCompletion,
    approval_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly ApprovalManagementFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(action_result.action_request.workflow_id, replayFailures);
    const replayCompletion = createCompletion(action_result, approval_records, replayValidation);
    const replayBase: Omit<ApprovalManagementResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      approval_management_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      completion: replayCompletion,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayApprovalManagement(result: ApprovalManagementResult): ApprovalManagementReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.approval_requests.every((request) => requestHash(request) === request.integrity_hash)
    && result.approval_dependencies.every((dependency) => dependencyHash(dependency) === dependency.integrity_hash)
    && result.approval_records.every((record) => recordHash(record) === record.integrity_hash)
    && validationHash(result.validation) === result.validation.integrity_hash
    && completionHash(result.completion) === result.completion.integrity_hash
    && result.approval_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: ApprovalManagementFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<ApprovalManagementReplay, "integrity_hash"> = {
    replay_id: "replay_approval_management_engine",
    replay_valid,
    workflow_id: result.action_result.action_request.workflow_id,
    approval_sequence: APPROVAL_SEQUENCE,
    completed_approvals: result.completion.completed_approvals,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildApprovalManagementObservability(result: ApprovalManagementResult): ApprovalManagementObservability {
  return Object.freeze({
    approval_workflows_generated: 1,
    required_approvals_discovered: result.approval_requests.length,
    approvals_completed: result.completion.completed_approvals.length,
    dependency_edges_validated: result.approval_dependencies.filter((dependency) => dependency.dependency_status === "SATISFIED").length,
    workflow_progression_authorizations: result.completion.workflow_progression_authorized ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayApprovalManagement(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getApprovalManagementFoundation(): ApprovalManagementFoundation {
  const result = runApprovalManagement();
  const replay = replayApprovalManagement(result);
  return Object.freeze({
    approval_management_version: APPROVAL_MANAGEMENT_VERSION,
    approval_types: APPROVAL_TYPES,
    approval_states: APPROVAL_STATES,
    result,
    replay,
    observability: buildApprovalManagementObservability(result),
  });
}

export const ApprovalManagementEngine = Object.freeze({
  run: runApprovalManagement,
  replay: replayApprovalManagement,
});
