import { runApprovalManagement } from "@/services/approval-management-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { ApprovalManagementResult } from "@/types/approval-management-engine";
import type { OperatorActionAuthorityLevel } from "@/types/operator-action-engine";
import type {
  OverrideExplanationReport,
  OverrideLedgerEntry,
  OverrideLineageRecord,
  OverrideManagementFailureReason,
  OverrideManagementFoundation,
  OverrideManagementInput,
  OverrideManagementObservability,
  OverrideManagementReplay,
  OverrideManagementResult,
  OverrideNotificationRecord,
  OverrideRecord,
  OverrideRequest,
  OverrideSensitivity,
  OverrideState,
  OverrideValidationResult,
} from "@/types/override-management";

const OVERRIDE_MANAGEMENT_VERSION = "override-management/v1" as const;
const AUTHORIZED_COMPONENT = "override-management";
const NOW = "2026-07-04T01:52:00.000Z";

export const OVERRIDE_STATES: readonly OverrideState[] = Object.freeze(["REQUESTED", "VALIDATED", "AUTHORIZED", "RECORDED", "GOVERNANCE_NOTIFIED", "FINALIZED"]);

const AUTHORITY_RANK: Readonly<Record<OperatorActionAuthorityLevel, number>> = Object.freeze({
  Observer: 0,
  Reviewer: 1,
  Operator: 2,
  Supervisor: 3,
  "Governance Authority": 4,
  "Executive Authority": 5,
  "Certification Authority": 6,
});

const GOVERNANCE_SENSITIVITIES: readonly OverrideSensitivity[] = Object.freeze([
  "POLICY_DEVIATION",
  "CERTIFICATION_IMPACT",
  "AUTHORITY_ESCALATION",
  "HIGH_RISK",
  "REGULATORY_EXPOSURE",
  "CONSTITUTIONAL_IMPLICATION",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function requestHash(record: Omit<OverrideRequest, "integrity_hash"> | OverrideRequest): string {
  return hashWithoutIntegrity(record);
}

export function computeOverrideRequestHash(record: Omit<OverrideRequest, "integrity_hash"> | OverrideRequest): string {
  return requestHash(record);
}

function overrideHash(record: Omit<OverrideRecord, "integrity_hash"> | OverrideRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeOverrideRecordHash(record: Omit<OverrideRecord, "integrity_hash"> | OverrideRecord): string {
  return overrideHash(record);
}

function lineageHash(record: Omit<OverrideLineageRecord, "integrity_hash"> | OverrideLineageRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeOverrideLineageHash(record: Omit<OverrideLineageRecord, "integrity_hash"> | OverrideLineageRecord): string {
  return lineageHash(record);
}

function notificationHash(record: Omit<OverrideNotificationRecord, "integrity_hash"> | OverrideNotificationRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeOverrideNotificationHash(record: Omit<OverrideNotificationRecord, "integrity_hash"> | OverrideNotificationRecord): string {
  return notificationHash(record);
}

function reportHash(record: Omit<OverrideExplanationReport, "integrity_hash"> | OverrideExplanationReport): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<OverrideValidationResult, "integrity_hash"> | OverrideValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<OverrideLedgerEntry, "ledger_integrity_hash"> | OverrideLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function authorityValid(level: string): boolean {
  return (AUTHORITY_RANK[level as OperatorActionAuthorityLevel] ?? -1) >= AUTHORITY_RANK["Executive Authority"];
}

function originalRecommendation(approvalResult: ApprovalManagementResult): string {
  return approvalResult.action_result.action_result.outcome_summary;
}

function governanceRequired(request: OverrideRequest): boolean {
  return GOVERNANCE_SENSITIVITIES.includes(request.sensitivity);
}

export function createOverrideRequest(approvalResult: ApprovalManagementResult = runApprovalManagement()): OverrideRequest {
  const actionRequest = approvalResult.action_result.action_request;
  const base: Omit<OverrideRequest, "integrity_hash"> = {
    override_request_id: `override_request_${actionRequest.workflow_id}`,
    workflow_id: actionRequest.workflow_id,
    tenant_id: actionRequest.tenant_id,
    mission_id: actionRequest.mission_id,
    operator_id: actionRequest.operator_id,
    operator_authenticated: true,
    authority_level: "Executive Authority",
    original_recommendation_ref: approvalResult.action_result.action_result.action_result_id,
    operator_action: "OVERRIDE_RECOMMENDATION",
    override_reason: "Mission constraints require a supervised operator-directed alternative.",
    business_justification: "The operator override preserves mission continuity while retaining the original recommendation for audit.",
    mission_impact: "Override changes the advisory workflow outcome without authorizing autonomous execution.",
    supporting_evidence_refs: Object.freeze([approvalResult.completion.completion_id]),
    sensitivity: "POLICY_DEVIATION",
    governance_authorized: approvalResult.validation.governance_valid,
    constitutional_authorized: approvalResult.validation.constitutional_valid,
    requested_at: NOW,
    replay_ref: actionRequest.replay_ref,
    lineage_ref: actionRequest.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: requestHash(base) });
}

export function createOverrideRecord(approvalResult: ApprovalManagementResult, request: OverrideRequest): OverrideRecord {
  const base: Omit<OverrideRecord, "integrity_hash"> = {
    override_id: `override_record_${request.override_request_id}`,
    workflow_id: request.workflow_id,
    original_recommendation: originalRecommendation(approvalResult),
    operator_action: request.operator_action,
    override_reason: request.override_reason,
    justification: `${request.business_justification} ${request.mission_impact}`,
    authority_level: request.authority_level,
    governance_required: governanceRequired(request),
    timestamp: NOW,
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: overrideHash(base) });
}

export function createOverrideNotification(record: OverrideRecord, request: OverrideRequest): OverrideNotificationRecord {
  const required = record.governance_required;
  const notification_type = request.sensitivity === "CONSTITUTIONAL_IMPLICATION"
    ? "CONSTITUTIONAL_REVIEW"
    : request.sensitivity === "CERTIFICATION_IMPACT"
      ? "CERTIFICATION_REVIEW"
      : required
        ? "GOVERNANCE_REVIEW"
        : "NO_NOTIFICATION_REQUIRED";
  const base: Omit<OverrideNotificationRecord, "integrity_hash"> = {
    notification_id: `override_notification_${record.override_id}`,
    override_id: record.override_id,
    governance_required: required,
    notification_type,
    notification_status: required ? "REGISTERED" : "NOT_REQUIRED",
    replay_ref: request.replay_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: notificationHash(base) });
}

export function createOverrideLineage(
  approvalResult: ApprovalManagementResult,
  record: OverrideRecord,
  notification: OverrideNotificationRecord,
  request: OverrideRequest,
): OverrideLineageRecord {
  const base: Omit<OverrideLineageRecord, "integrity_hash"> = {
    lineage_id: `override_lineage_${record.override_id}`,
    override_id: record.override_id,
    recommendation_ref: request.original_recommendation_ref,
    workflow_ref: request.workflow_id,
    governance_ref: notification.notification_id,
    replay_ref: request.replay_ref,
    parent_lineage: approvalResult.action_result.action_request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: lineageHash(base) });
}

function collectFailures(input: {
  approvalResult: ApprovalManagementResult;
  request: OverrideRequest;
  record: OverrideRecord;
  notification: OverrideNotificationRecord;
  lineage: OverrideLineageRecord;
  authorized: boolean;
}): readonly OverrideManagementFailureReason[] {
  const failures: OverrideManagementFailureReason[] = [];
  const actionRequest = input.approvalResult.action_result.action_request;
  if (!input.authorized) failures.push("UNAUTHORIZED_OVERRIDE_ENGINE_ACCESS");
  if (input.approvalResult.approval_management_status !== "PASS") failures.push("APPROVAL_MANAGEMENT_FAILED");
  if (input.approvalResult.completion.completion_status !== "COMPLETE") failures.push("WORKFLOW_INVALID");
  if (!input.request.override_reason.trim() || !input.record.override_reason.trim()) failures.push("OVERRIDE_REASON_MISSING");
  if (!input.request.business_justification.trim() || !input.record.justification.trim()) failures.push("JUSTIFICATION_MISSING");
  if (!input.request.mission_impact.trim()) failures.push("MISSION_IMPACT_MISSING");
  if (input.request.supporting_evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (!input.request.operator_authenticated || !authorityValid(input.request.authority_level)) failures.push("OPERATOR_UNAUTHORIZED");
  if (!input.request.original_recommendation_ref || !input.record.original_recommendation.trim()) failures.push("ORIGINAL_RECOMMENDATION_UNAVAILABLE");
  if (!input.request.governance_authorized) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (!input.request.constitutional_authorized) failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (input.request.tenant_id !== actionRequest.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.request.mission_id !== actionRequest.mission_id) failures.push("MISSION_MISMATCH");
  if (!input.request.replay_ref || !input.record.replay_ref || !input.notification.replay_ref || !input.lineage.replay_ref) failures.push("REPLAY_REFERENCE_UNAVAILABLE");
  if (!input.request.lineage_ref || !input.record.lineage_ref || !input.lineage.parent_lineage) failures.push("LINEAGE_INCOMPLETE");
  if (!input.request.advisory_only || !input.approvalResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    requestHash(input.request) !== input.request.integrity_hash
    || overrideHash(input.record) !== input.record.integrity_hash
    || notificationHash(input.notification) !== input.notification.integrity_hash
    || lineageHash(input.lineage) !== input.lineage.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as OverrideManagementFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly OverrideManagementFailureReason[]): OverrideValidationResult {
  const has = (failure: OverrideManagementFailureReason) => failures.includes(failure);
  const base: Omit<OverrideValidationResult, "integrity_hash"> = {
    validation_id: `override_validation_${workflowId}`,
    workflow_id: workflowId,
    override_reason_valid: !has("OVERRIDE_REASON_MISSING"),
    justification_valid: !has("JUSTIFICATION_MISSING") && !has("MISSION_IMPACT_MISSING") && !has("SUPPORTING_EVIDENCE_MISSING"),
    authority_valid: !has("OPERATOR_UNAUTHORIZED"),
    workflow_valid: !has("WORKFLOW_INVALID") && !has("APPROVAL_MANAGEMENT_FAILED"),
    original_recommendation_preserved: !has("ORIGINAL_RECOMMENDATION_UNAVAILABLE"),
    governance_valid: !has("GOVERNANCE_VALIDATION_FAILED"),
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

function createExplanation(record: OverrideRecord, notification: OverrideNotificationRecord, validation: OverrideValidationResult): OverrideExplanationReport {
  const base: Omit<OverrideExplanationReport, "integrity_hash"> = {
    report_id: `override_explanation_${record.override_id}`,
    override_id: record.override_id,
    original_recommendation: record.original_recommendation,
    operator_action: record.operator_action,
    rationale_summary: `${record.override_reason} ${record.justification}`,
    authority_summary: `${record.authority_level} validation ${validation.authority_valid ? "accepted" : "rejected"}.`,
    governance_summary: notification.governance_required ? `${notification.notification_type} ${notification.notification_status}.` : "No governance notification required.",
    recommendation_preserved: true,
    replay_ref: record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function createLedger(record: OverrideRecord, lineage: OverrideLineageRecord, notification: OverrideNotificationRecord, validation: OverrideValidationResult): readonly OverrideLedgerEntry[] {
  const base: Omit<OverrideLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `override_ledger_${record.override_id}`,
    workflow_id: record.workflow_id,
    override_id: record.override_id,
    override_state: validation.validation_status === "VALID" ? "FINALIZED" : "REQUESTED",
    recommendation_ref: lineage.recommendation_ref,
    notification_id: notification.notification_id,
    replay_ref: record.replay_ref,
    lineage_ref: record.lineage_ref,
    integrity_hash: record.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<OverrideManagementResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    approval_result: result.approval_result,
    override_request: result.override_request,
    validation: result.validation,
    override_record: result.override_record,
    lineage_record: result.lineage_record,
    notification_record: result.notification_record,
    explanation_report: result.explanation_report,
    override_ledger: result.override_ledger,
    failures: result.failures,
  });
}

export function runOverrideManagement(input: OverrideManagementInput = {}): OverrideManagementResult {
  const approval_result = input.approval_result ?? runApprovalManagement();
  const override_request = input.override_request ?? createOverrideRequest(approval_result);
  const override_record = input.override_record ?? createOverrideRecord(approval_result, override_request);
  const notification_record = input.notification_record ?? createOverrideNotification(override_record, override_request);
  const lineage_record = input.lineage_record ?? createOverrideLineage(approval_result, override_record, notification_record, override_request);
  const initialFailures = collectFailures({
    approvalResult: approval_result,
    request: override_request,
    record: override_record,
    notification: notification_record,
    lineage: lineage_record,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(override_request.workflow_id, initialFailures);
  const explanation_report = input.explanation_report ?? createExplanation(override_record, notification_record, validation);
  const override_ledger = input.override_ledger ?? createLedger(override_record, lineage_record, notification_record, validation);
  const generatedHashesValid = reportHash(explanation_report) === explanation_report.integrity_hash
    && override_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(generatedHashesValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as OverrideManagementFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(override_request.workflow_id, finalFailures);
  const finalExplanation = finalValidation === validation ? explanation_report : createExplanation(override_record, notification_record, finalValidation);
  const finalLedger = finalValidation === validation ? override_ledger : createLedger(override_record, lineage_record, notification_record, finalValidation);
  const base: Omit<OverrideManagementResult, "integrity_hash" | "replay_hash"> = {
    override_management_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    approval_result,
    override_request,
    validation: finalValidation,
    override_record,
    lineage_record,
    notification_record,
    explanation_report: finalExplanation,
    override_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OverrideManagementFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(override_request.workflow_id, replayFailures);
    const replayExplanation = createExplanation(override_record, notification_record, replayValidation);
    const replayLedger = createLedger(override_record, lineage_record, notification_record, replayValidation);
    const replayBase: Omit<OverrideManagementResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      override_management_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      explanation_report: replayExplanation,
      override_ledger: replayLedger,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOverrideManagement(result: OverrideManagementResult): OverrideManagementReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && requestHash(result.override_request) === result.override_request.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && overrideHash(result.override_record) === result.override_record.integrity_hash
    && notificationHash(result.notification_record) === result.notification_record.integrity_hash
    && lineageHash(result.lineage_record) === result.lineage_record.integrity_hash
    && reportHash(result.explanation_report) === result.explanation_report.integrity_hash
    && result.override_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: OverrideManagementFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OverrideManagementReplay, "integrity_hash"> = {
    replay_id: "replay_override_management",
    replay_valid,
    workflow_id: result.override_request.workflow_id,
    override_id: result.override_record.override_id,
    original_recommendation: result.override_record.original_recommendation,
    operator_action: result.override_record.operator_action,
    governance_notification: result.notification_record.notification_id,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOverrideManagementObservability(result: OverrideManagementResult): OverrideManagementObservability {
  return Object.freeze({
    overrides_processed: 1,
    overrides_recorded: result.override_management_status === "PASS" ? 1 : 0,
    governance_notifications_registered: result.notification_record.notification_status === "REGISTERED" ? 1 : 0,
    recommendation_preservation_success: result.validation.original_recommendation_preserved ? 1 : 0,
    lineage_records_generated: result.validation.lineage_valid ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayOverrideManagement(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOverrideManagementFoundation(): OverrideManagementFoundation {
  const result = runOverrideManagement();
  const replay = replayOverrideManagement(result);
  return Object.freeze({
    override_management_version: OVERRIDE_MANAGEMENT_VERSION,
    override_states: OVERRIDE_STATES,
    result,
    replay,
    observability: buildOverrideManagementObservability(result),
  });
}

export const OverrideManagement = Object.freeze({
  run: runOverrideManagement,
  replay: replayOverrideManagement,
});
