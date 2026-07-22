import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runWorkflowStateMachine } from "@/services/workflow-state-machine";
import type {
  OperatorActionAuthorityLevel,
  OperatorActionEngineAction,
  OperatorActionEngineFoundation,
  OperatorActionEngineInput,
  OperatorActionEngineResult,
  OperatorActionFailureReason,
  OperatorActionLedgerEntry,
  OperatorActionObservability,
  OperatorActionRecord,
  OperatorActionReplay,
  OperatorActionRequest,
  OperatorActionResult,
  OperatorActionValidationResult,
} from "@/types/operator-action-engine";
import type { WorkflowStateMachineResult, WorkflowStateMachineState } from "@/types/workflow-state-machine";

const ACTION_ENGINE_VERSION = "operator-action-engine/v1" as const;
const AUTHORIZED_COMPONENT = "operator-action-engine";
const NOW = "2026-07-04T01:36:00.000Z";

export const SUPPORTED_OPERATOR_ENGINE_ACTIONS: readonly OperatorActionEngineAction[] = Object.freeze([
  "APPROVE",
  "REJECT",
  "DEFER",
  "REQUEST_MORE_EVIDENCE",
  "REQUEST_SIMULATION",
  "REQUEST_GOVERNANCE_REVIEW",
  "REQUEST_RECOVERY_PLAN",
  "OVERRIDE_RECOMMENDATION",
  "ESCALATE",
  "ARCHIVE",
]);

export const OPERATOR_ACTION_AUTHORITY_LEVELS: readonly OperatorActionAuthorityLevel[] = Object.freeze([
  "Observer",
  "Reviewer",
  "Operator",
  "Supervisor",
  "Governance Authority",
  "Executive Authority",
  "Certification Authority",
]);

function actions(values: readonly OperatorActionEngineAction[]): readonly OperatorActionEngineAction[] {
  return Object.freeze(values);
}

const PERMITTED_ACTIONS_BY_STATE: Readonly<Record<WorkflowStateMachineState, readonly OperatorActionEngineAction[]>> = Object.freeze({
  CREATED: actions([]),
  CONTEXTUALIZED: actions([]),
  PRIORITIZED: actions([]),
  GOVERNANCE_REVIEWED: actions([]),
  PACKAGED: actions([]),
  PRESENTED: SUPPORTED_OPERATOR_ENGINE_ACTIONS,
  APPROVED: actions(["ARCHIVE"]),
  REJECTED: actions(["ARCHIVE"]),
  DEFERRED: actions(["APPROVE", "REJECT", "REQUEST_MORE_EVIDENCE", "REQUEST_SIMULATION", "ESCALATE", "ARCHIVE"]),
  ESCALATED: actions(["ARCHIVE"]),
  SUPERSEDED: actions(["ARCHIVE"]),
  ARCHIVED: actions([]),
});

const RESULTING_STATE_BY_ACTION: Readonly<Record<OperatorActionEngineAction, WorkflowStateMachineState>> = Object.freeze({
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  DEFER: "DEFERRED",
  REQUEST_MORE_EVIDENCE: "DEFERRED",
  REQUEST_SIMULATION: "DEFERRED",
  REQUEST_GOVERNANCE_REVIEW: "ESCALATED",
  REQUEST_RECOVERY_PLAN: "DEFERRED",
  OVERRIDE_RECOMMENDATION: "SUPERSEDED",
  ESCALATE: "ESCALATED",
  ARCHIVE: "ARCHIVED",
});

const REQUIRED_AUTHORITY_BY_ACTION: Readonly<Record<OperatorActionEngineAction, OperatorActionAuthorityLevel>> = Object.freeze({
  APPROVE: "Operator",
  REJECT: "Operator",
  DEFER: "Reviewer",
  REQUEST_MORE_EVIDENCE: "Reviewer",
  REQUEST_SIMULATION: "Reviewer",
  REQUEST_GOVERNANCE_REVIEW: "Governance Authority",
  REQUEST_RECOVERY_PLAN: "Reviewer",
  OVERRIDE_RECOMMENDATION: "Executive Authority",
  ESCALATE: "Supervisor",
  ARCHIVE: "Supervisor",
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

function requestHash(record: Omit<OperatorActionRequest, "integrity_hash"> | OperatorActionRequest): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActionRequestHash(record: Omit<OperatorActionRequest, "integrity_hash"> | OperatorActionRequest): string {
  return requestHash(record);
}

function resultHash(record: Omit<OperatorActionResult, "integrity_hash"> | OperatorActionResult): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActionResultHash(record: Omit<OperatorActionResult, "integrity_hash"> | OperatorActionResult): string {
  return resultHash(record);
}

function actionRecordHash(record: Omit<OperatorActionRecord, "integrity_hash"> | OperatorActionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActionRecordHash(record: Omit<OperatorActionRecord, "integrity_hash"> | OperatorActionRecord): string {
  return actionRecordHash(record);
}

function validationHash(record: Omit<OperatorActionValidationResult, "integrity_hash"> | OperatorActionValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<OperatorActionLedgerEntry, "ledger_integrity_hash"> | OperatorActionLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function isSupportedAction(action: string): action is OperatorActionEngineAction {
  return SUPPORTED_OPERATOR_ENGINE_ACTIONS.includes(action as OperatorActionEngineAction);
}

function authorityRank(level: string): number {
  return OPERATOR_ACTION_AUTHORITY_LEVELS.indexOf(level as OperatorActionAuthorityLevel);
}

function authorityValid(request: OperatorActionRequest): boolean {
  if (!isSupportedAction(request.requested_action)) return false;
  const actual = authorityRank(request.authority_level);
  const required = authorityRank(REQUIRED_AUTHORITY_BY_ACTION[request.requested_action]);
  return actual >= required || request.delegated_by === "governance-delegation";
}

function resultingState(request: OperatorActionRequest): WorkflowStateMachineState {
  return isSupportedAction(request.requested_action) ? RESULTING_STATE_BY_ACTION[request.requested_action] : request.workflow_state;
}

export function createOperatorActionRequest(workflowResult: WorkflowStateMachineResult = runWorkflowStateMachine()): OperatorActionRequest {
  const workflow = workflowResult.contract_result.workflow;
  const base: Omit<OperatorActionRequest, "integrity_hash"> = {
    action_request_id: `operator_action_request_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    operator_id: workflow.operator_id,
    tenant_id: workflow.tenant_id,
    mission_id: workflow.mission_id,
    requested_action: "APPROVE",
    action_parameters: Object.freeze({ target: "recommendation" }),
    workflow_state: workflowResult.history.current_state,
    authority_level: "Operator",
    justification: "Operator accepts the replayable recommendation package for downstream processing.",
    operator_authenticated: true,
    governance_authorized: workflowResult.contract_result.authority.governance_compliant,
    constitutional_authorized: workflowResult.contract_result.authority.constitutional_compliant,
    request_timestamp: NOW,
    replay_ref: workflow.replay_ref,
    lineage_ref: workflow.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: requestHash(base) });
}

function collectFailures(input: {
  workflowResult: WorkflowStateMachineResult;
  request: OperatorActionRequest;
  authorized: boolean;
}): readonly OperatorActionFailureReason[] {
  const failures: OperatorActionFailureReason[] = [];
  const action = input.request.requested_action;
  const supported = isSupportedAction(action);
  const permitted = supported && PERMITTED_ACTIONS_BY_STATE[input.request.workflow_state].includes(action);
  if (!input.authorized) failures.push("UNAUTHORIZED_ACTION_ENGINE_ACCESS");
  if (!supported) failures.push("UNKNOWN_ACTION");
  if (!input.request.operator_authenticated || input.request.operator_id.length === 0) failures.push("OPERATOR_AUTHENTICATION_FAILED");
  if (!authorityValid(input.request)) failures.push("AUTHORITY_INSUFFICIENT");
  if (!PERMITTED_ACTIONS_BY_STATE[input.request.workflow_state]) failures.push("WORKFLOW_STATE_INVALID");
  if (input.request.workflow_state === "ARCHIVED") failures.push("WORKFLOW_ARCHIVED");
  if (!permitted) failures.push("ACTION_NOT_PERMITTED_IN_STATE");
  if (!input.request.justification.trim()) failures.push("JUSTIFICATION_MISSING");
  if (!input.request.governance_authorized) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (!input.request.constitutional_authorized) failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (input.workflowResult.state_machine_status !== "PASS") failures.push("WORKFLOW_ENGINE_FAILED");
  if (input.request.tenant_id !== input.workflowResult.contract_result.workflow.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.request.mission_id !== input.workflowResult.contract_result.workflow.mission_id) failures.push("MISSION_MISMATCH");
  if (!input.request.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.request.lineage_ref) failures.push("LINEAGE_INCOMPLETE");
  if (!input.request.advisory_only || !input.workflowResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (requestHash(input.request) !== input.request.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as OperatorActionFailureReason[]);
}

function createValidation(workflowId: string, request: OperatorActionRequest, failures: readonly OperatorActionFailureReason[]): OperatorActionValidationResult {
  const has = (failure: OperatorActionFailureReason) => failures.includes(failure);
  const supported = isSupportedAction(request.requested_action);
  const base: Omit<OperatorActionValidationResult, "integrity_hash"> = {
    validation_id: `operator_action_validation_${request.action_request_id}`,
    workflow_id: workflowId,
    action_supported: supported,
    action_parameters_valid: Object.keys(request.action_parameters).length > 0 && !has("JUSTIFICATION_MISSING"),
    workflow_active: request.workflow_state !== "ARCHIVED" && !has("WORKFLOW_ENGINE_FAILED"),
    workflow_state_valid: !has("WORKFLOW_STATE_INVALID") && !has("WORKFLOW_ARCHIVED"),
    action_permitted: supported && !has("ACTION_NOT_PERMITTED_IN_STATE"),
    authority_valid: !has("OPERATOR_AUTHENTICATION_FAILED") && !has("AUTHORITY_INSUFFICIENT"),
    tenant_valid: !has("TENANT_MISMATCH"),
    mission_valid: !has("MISSION_MISMATCH"),
    governance_valid: !has("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_valid: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    lineage_valid: !has("LINEAGE_INCOMPLETE"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function createOperatorActionResult(request: OperatorActionRequest, validation: OperatorActionValidationResult): OperatorActionResult {
  const executed = validation.validation_status === "VALID";
  const base: Omit<OperatorActionResult, "integrity_hash"> = {
    action_result_id: `operator_action_result_${request.action_request_id}`,
    action_request_id: request.action_request_id,
    workflow_id: request.workflow_id,
    previous_state: request.workflow_state,
    resulting_state: executed ? resultingState(request) : request.workflow_state,
    action_status: executed ? "EXECUTED" : "REJECTED",
    outcome_summary: executed
      ? `${request.requested_action} accepted from ${request.workflow_state} to ${resultingState(request)}.`
      : `${request.requested_action} rejected fail-closed from ${request.workflow_state}.`,
    lineage_ref: request.lineage_ref,
    replay_ref: request.replay_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function createOperatorActionRecord(request: OperatorActionRequest, validation: OperatorActionValidationResult): OperatorActionRecord {
  const executed = validation.validation_status === "VALID";
  const base: Omit<OperatorActionRecord, "integrity_hash"> = {
    action_record_id: `operator_action_record_${request.action_request_id}`,
    workflow_id: request.workflow_id,
    operator_id: request.operator_id,
    action_type: request.requested_action,
    authority_level: request.authority_level,
    workflow_state: request.workflow_state,
    execution_status: executed ? "EXECUTED" : "REJECTED",
    governance_status: validation.governance_valid ? "VALID" : "REJECTED",
    constitutional_status: validation.constitutional_valid ? "VALID" : "REJECTED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: actionRecordHash(base) });
}

function createActionLedger(result: OperatorActionResult, record: OperatorActionRecord): readonly OperatorActionLedgerEntry[] {
  const base: Omit<OperatorActionLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `operator_action_ledger_${record.action_record_id}`,
    workflow_id: record.workflow_id,
    action_request_id: result.action_request_id,
    action_result_id: result.action_result_id,
    action_record_id: record.action_record_id,
    action_type: record.action_type,
    previous_state: result.previous_state,
    resulting_state: result.resulting_state,
    execution_status: result.action_status,
    replay_ref: result.replay_ref,
    lineage_ref: result.lineage_ref,
    integrity_hash: record.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<OperatorActionEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    workflow_result: result.workflow_result,
    action_request: result.action_request,
    validation: result.validation,
    action_result: result.action_result,
    action_record: result.action_record,
    action_ledger: result.action_ledger,
    failures: result.failures,
  });
}

export function processOperatorAction(input: OperatorActionEngineInput = {}): OperatorActionEngineResult {
  const workflow_result = input.workflow_result ?? runWorkflowStateMachine();
  const action_request = input.action_request ?? createOperatorActionRequest(workflow_result);
  const initialFailures = collectFailures({
    workflowResult: workflow_result,
    request: action_request,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(action_request.workflow_id, action_request, initialFailures);
  const action_result = input.action_result ?? createOperatorActionResult(action_request, validation);
  const action_record = input.action_record ?? createOperatorActionRecord(action_request, validation);
  const action_ledger = input.action_ledger ?? createActionLedger(action_result, action_record);
  const generatedHashesValid = resultHash(action_result) === action_result.integrity_hash
    && actionRecordHash(action_record) === action_record.integrity_hash
    && action_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(generatedHashesValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as OperatorActionFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(action_request.workflow_id, action_request, finalFailures);
  const finalResult = finalValidation === validation ? action_result : createOperatorActionResult(action_request, finalValidation);
  const finalRecord = finalValidation === validation ? action_record : createOperatorActionRecord(action_request, finalValidation);
  const finalLedger = finalValidation === validation ? action_ledger : createActionLedger(finalResult, finalRecord);
  const base: Omit<OperatorActionEngineResult, "integrity_hash" | "replay_hash"> = {
    action_engine_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    workflow_result,
    action_request,
    validation: finalValidation,
    action_result: finalResult,
    action_record: finalRecord,
    action_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OperatorActionFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(action_request.workflow_id, action_request, replayFailures);
    const replayResult = createOperatorActionResult(action_request, replayValidation);
    const replayRecord = createOperatorActionRecord(action_request, replayValidation);
    const replayLedger = createActionLedger(replayResult, replayRecord);
    const replayBase: Omit<OperatorActionEngineResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      action_engine_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      action_result: replayResult,
      action_record: replayRecord,
      action_ledger: replayLedger,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorAction(result: OperatorActionEngineResult): OperatorActionReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && requestHash(result.action_request) === result.action_request.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && resultHash(result.action_result) === result.action_result.integrity_hash
    && actionRecordHash(result.action_record) === result.action_record.integrity_hash
    && result.action_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash)
    && result.action_result.resulting_state === result.action_ledger[0]?.resulting_state;
  const failures: OperatorActionFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OperatorActionReplay, "integrity_hash"> = {
    replay_id: "replay_operator_action_engine",
    replay_valid,
    workflow_id: result.action_request.workflow_id,
    action_request_id: result.action_request.action_request_id,
    action_type: result.action_request.requested_action,
    previous_state: result.action_result.previous_state,
    resulting_state: result.action_result.resulting_state,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOperatorActionObservability(result: OperatorActionEngineResult): OperatorActionObservability {
  return Object.freeze({
    actions_processed: 1,
    actions_executed: result.action_result.action_status === "EXECUTED" ? 1 : 0,
    actions_rejected: result.action_result.action_status === "REJECTED" ? 1 : 0,
    authority_validation_failures: result.failures.includes("AUTHORITY_INSUFFICIENT") || result.failures.includes("OPERATOR_AUTHENTICATION_FAILED") ? 1 : 0,
    workflow_validation_failures: result.failures.includes("WORKFLOW_STATE_INVALID") || result.failures.includes("ACTION_NOT_PERMITTED_IN_STATE") || result.failures.includes("WORKFLOW_ARCHIVED") ? 1 : 0,
    governance_validation_failures: result.failures.includes("GOVERNANCE_VALIDATION_FAILED") ? 1 : 0,
    constitutional_validation_failures: result.failures.includes("CONSTITUTIONAL_VALIDATION_FAILED") ? 1 : 0,
    replay_reproducibility: replayOperatorAction(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOperatorActionEngineFoundation(): OperatorActionEngineFoundation {
  const result = processOperatorAction();
  const replay = replayOperatorAction(result);
  return Object.freeze({
    action_engine_version: ACTION_ENGINE_VERSION,
    supported_actions: SUPPORTED_OPERATOR_ENGINE_ACTIONS,
    authority_levels: OPERATOR_ACTION_AUTHORITY_LEVELS,
    result,
    replay,
    observability: buildOperatorActionObservability(result),
  });
}

export const OperatorActionEngine = Object.freeze({
  process: processOperatorAction,
  replay: replayOperatorAction,
});
