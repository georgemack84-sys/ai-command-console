import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runReviewRequestManager } from "@/services/review-request-manager";
import type {
  EscalationAuthorityLevel,
  EscalationFailureReason,
  EscalationLedgerEntry,
  EscalationRecord,
  EscalationRequest,
  EscalationRoutingDecision,
  EscalationState,
  EscalationSuspensionRecord,
  EscalationType,
  EscalationValidationResult,
  EscalationWorkflowFoundation,
  EscalationWorkflowInput,
  EscalationWorkflowObservability,
  EscalationWorkflowReplay,
  EscalationWorkflowResult,
  EscalationResolution,
} from "@/types/escalation-workflow";
import type { ReviewRequestManagerResult } from "@/types/review-request-manager";

const ESCALATION_WORKFLOW_VERSION = "escalation-workflow/v1" as const;
const AUTHORIZED_COMPONENT = "escalation-workflow";
const NOW = "2026-07-04T02:08:00.000Z";

export const ESCALATION_TYPES: readonly EscalationType[] = Object.freeze(["GOVERNANCE_ESCALATION", "CONSTITUTIONAL_ESCALATION", "SUPERVISORY_ESCALATION", "EXECUTIVE_ESCALATION", "CERTIFICATION_ESCALATION"]);
export const ESCALATION_STATES: readonly EscalationState[] = Object.freeze(["REQUESTED", "VALIDATED", "ROUTED", "WORKFLOW_SUSPENDED", "UNDER_ESCALATION", "RESOLVED", "WORKFLOW_RESUMED"]);

const AUTHORITY_RANK: Readonly<Record<EscalationAuthorityLevel, number>> = Object.freeze({
  Observer: 0,
  Reviewer: 1,
  Operator: 2,
  Supervisor: 3,
  "Governance Authority": 4,
  "Executive Authority": 5,
  "Certification Authority": 6,
  "Constitutional Authority": 7,
});

const DESTINATION_BY_TYPE: Readonly<Record<EscalationType, EscalationAuthorityLevel>> = Object.freeze({
  GOVERNANCE_ESCALATION: "Governance Authority",
  CONSTITUTIONAL_ESCALATION: "Constitutional Authority",
  SUPERVISORY_ESCALATION: "Supervisor",
  EXECUTIVE_ESCALATION: "Executive Authority",
  CERTIFICATION_ESCALATION: "Certification Authority",
});

const OUTCOME_BY_TYPE: Readonly<Record<EscalationType, EscalationRoutingDecision["routing_outcome"]>> = Object.freeze({
  GOVERNANCE_ESCALATION: "governance_queue",
  CONSTITUTIONAL_ESCALATION: "constitutional_queue",
  SUPERVISORY_ESCALATION: "supervisory_queue",
  EXECUTIVE_ESCALATION: "executive_queue",
  CERTIFICATION_ESCALATION: "certification_queue",
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

function requestHash(record: Omit<EscalationRequest, "integrity_hash"> | EscalationRequest): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationRequestHash(record: Omit<EscalationRequest, "integrity_hash"> | EscalationRequest): string {
  return requestHash(record);
}

function routingHash(record: Omit<EscalationRoutingDecision, "integrity_hash"> | EscalationRoutingDecision): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationRoutingHash(record: Omit<EscalationRoutingDecision, "integrity_hash"> | EscalationRoutingDecision): string {
  return routingHash(record);
}

function suspensionHash(record: Omit<EscalationSuspensionRecord, "integrity_hash"> | EscalationSuspensionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationSuspensionHash(record: Omit<EscalationSuspensionRecord, "integrity_hash"> | EscalationSuspensionRecord): string {
  return suspensionHash(record);
}

function recordHash(record: Omit<EscalationRecord, "integrity_hash"> | EscalationRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationRecordHash(record: Omit<EscalationRecord, "integrity_hash"> | EscalationRecord): string {
  return recordHash(record);
}

function resolutionHash(record: Omit<EscalationResolution, "integrity_hash"> | EscalationResolution): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationResolutionHash(record: Omit<EscalationResolution, "integrity_hash"> | EscalationResolution): string {
  return resolutionHash(record);
}

function validationHash(record: Omit<EscalationValidationResult, "integrity_hash"> | EscalationValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<EscalationLedgerEntry, "ledger_integrity_hash"> | EscalationLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function isEscalationType(type: string): type is EscalationType {
  return ESCALATION_TYPES.includes(type as EscalationType);
}

function isAuthority(level: string): level is EscalationAuthorityLevel {
  return Object.hasOwn(AUTHORITY_RANK, level);
}

function authorityRank(level: string): number {
  return AUTHORITY_RANK[level as EscalationAuthorityLevel] ?? -1;
}

function defaultRoutingPath(type: EscalationType): readonly string[] {
  const destination = DESTINATION_BY_TYPE[type];
  return Object.freeze(["operator workflow", `${type.toLowerCase()} validation`, OUTCOME_BY_TYPE[type], destination]);
}

export function createEscalationRequest(reviewResult: ReviewRequestManagerResult = runReviewRequestManager()): EscalationRequest {
  const reviewRequest = reviewResult.review_request;
  const escalation_type: EscalationType = reviewRequest.request_type === "CERTIFICATION_REVIEW"
    ? "CERTIFICATION_ESCALATION"
    : reviewRequest.constitutional_validated
      ? "GOVERNANCE_ESCALATION"
      : "CONSTITUTIONAL_ESCALATION";
  const base: Omit<EscalationRequest, "integrity_hash"> = {
    escalation_request_id: `escalation_request_${reviewRequest.workflow_id}`,
    workflow_id: reviewRequest.workflow_id,
    tenant_id: reviewRequest.tenant_id,
    mission_id: reviewRequest.mission_id,
    escalation_type,
    requesting_authority: "Supervisor",
    destination_authority: DESTINATION_BY_TYPE[escalation_type],
    escalation_reason: "Current authority requires deterministic escalation before advisory workflow continuation.",
    workflow_state: reviewResult.review_ledger[0]?.review_state ?? "WORKFLOW_RESUMED",
    governance_validated: reviewResult.validation.governance_valid,
    constitutional_validated: reviewResult.validation.constitutional_valid,
    certification_required: reviewRequest.certification_required,
    created_at: NOW,
    replay_ref: reviewRequest.replay_ref,
    lineage_ref: reviewRequest.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: requestHash(base) });
}

export function createEscalationRouting(request: EscalationRequest): EscalationRoutingDecision {
  const type = isEscalationType(request.escalation_type) ? request.escalation_type : "GOVERNANCE_ESCALATION";
  const base: Omit<EscalationRoutingDecision, "integrity_hash"> = {
    routing_id: `escalation_routing_${request.escalation_request_id}`,
    workflow_id: request.workflow_id,
    escalation_type: request.escalation_type,
    routing_path: defaultRoutingPath(type),
    routing_outcome: OUTCOME_BY_TYPE[type],
    destination_authority: request.destination_authority,
    routing_status: "ROUTED",
    replay_ref: request.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: routingHash(base) });
}

export function createEscalationSuspension(reviewResult: ReviewRequestManagerResult, request: EscalationRequest): EscalationSuspensionRecord {
  const base: Omit<EscalationSuspensionRecord, "integrity_hash"> = {
    suspension_id: `escalation_suspension_${request.escalation_request_id}`,
    workflow_id: request.workflow_id,
    preserved_workflow_state: request.workflow_state,
    preserved_approvals: reviewResult.override_result.approval_result.approval_records.map((record) => record.approval_id),
    governance_status: request.governance_validated ? "VALID" : "PENDING",
    suspension_status: "SUSPENDED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: suspensionHash(base) });
}

export function createEscalationRecord(request: EscalationRequest, routing: EscalationRoutingDecision): EscalationRecord {
  const base: Omit<EscalationRecord, "integrity_hash"> = {
    escalation_id: `escalation_record_${request.escalation_request_id}`,
    workflow_id: request.workflow_id,
    escalation_type: request.escalation_type,
    routing_path: routing.routing_path,
    destination_authority: request.destination_authority,
    escalation_status: routing.routing_status === "ROUTED" ? "UNDER_ESCALATION" : "REJECTED",
    resolution_status: "RESOLVED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function createEscalationResolution(record: EscalationRecord, request: EscalationRequest): EscalationResolution {
  const base: Omit<EscalationResolution, "integrity_hash"> = {
    resolution_id: `escalation_resolution_${record.escalation_id}`,
    escalation_id: record.escalation_id,
    resolved_by: request.destination_authority,
    resolution_summary: `${request.escalation_type} resolved by ${request.destination_authority}; advisory workflow may resume.`,
    resulting_workflow_state: record.resolution_status === "RESOLVED" ? "WORKFLOW_RESUMED" : "WORKFLOW_HELD",
    resolved_at: NOW,
    replay_ref: record.replay_ref,
    lineage_ref: record.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: resolutionHash(base) });
}

function collectFailures(input: {
  reviewResult: ReviewRequestManagerResult;
  request: EscalationRequest;
  routing: EscalationRoutingDecision;
  suspension: EscalationSuspensionRecord;
  record: EscalationRecord;
  resolution: EscalationResolution;
  authorized: boolean;
}): readonly EscalationFailureReason[] {
  const failures: EscalationFailureReason[] = [];
  const reviewRequest = input.reviewResult.review_request;
  if (!input.authorized) failures.push("UNAUTHORIZED_ESCALATION_WORKFLOW_ACCESS");
  if (input.reviewResult.review_manager_status !== "PASS") failures.push("REVIEW_MANAGER_FAILED");
  if (!isEscalationType(input.request.escalation_type)) failures.push("ESCALATION_TYPE_UNKNOWN");
  if (!input.request.escalation_reason.trim()) failures.push("ESCALATION_REASON_MISSING");
  if (!isAuthority(input.request.destination_authority)) failures.push("DESTINATION_AUTHORITY_INVALID");
  if (!isAuthority(input.request.requesting_authority) || authorityRank(input.request.requesting_authority) >= authorityRank(input.request.destination_authority)) failures.push("REQUESTING_AUTHORITY_UNAUTHORIZED");
  if (input.routing.routing_status !== "ROUTED" || input.routing.routing_path.length === 0) failures.push("ROUTING_UNDETERMINED");
  if (input.routing.destination_authority !== input.request.destination_authority) failures.push("ROUTING_UNDETERMINED");
  if (input.request.workflow_id !== reviewRequest.workflow_id || input.suspension.workflow_id !== input.request.workflow_id) failures.push("WORKFLOW_INVALID");
  if (input.request.tenant_id !== reviewRequest.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.request.mission_id !== reviewRequest.mission_id) failures.push("MISSION_MISMATCH");
  if (input.suspension.suspension_status !== "SUSPENDED" || !input.suspension.preserved_workflow_state) failures.push("WORKFLOW_SUSPENSION_FAILED");
  if (input.request.escalation_type === "GOVERNANCE_ESCALATION" && input.record.resolution_status !== "RESOLVED") failures.push("GOVERNANCE_ESCALATION_INCOMPLETE");
  if (input.request.escalation_type === "CONSTITUTIONAL_ESCALATION" && (input.record.resolution_status !== "RESOLVED" || input.resolution.resulting_workflow_state !== "WORKFLOW_RESUMED")) failures.push("CONSTITUTIONAL_ESCALATION_UNRESOLVED");
  if (input.request.escalation_type === "CERTIFICATION_ESCALATION" && input.record.resolution_status !== "RESOLVED") failures.push("CERTIFICATION_ESCALATION_UNRESOLVED");
  if (!input.request.replay_ref || !input.routing.replay_ref || !input.suspension.replay_ref || !input.record.replay_ref || !input.resolution.replay_ref) failures.push("REPLAY_REFERENCE_UNAVAILABLE");
  if (!input.request.lineage_ref || !input.suspension.lineage_ref || !input.record.lineage_ref || !input.resolution.lineage_ref) failures.push("LINEAGE_INCOMPLETE");
  if (!input.request.advisory_only || !input.reviewResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    requestHash(input.request) !== input.request.integrity_hash
    || routingHash(input.routing) !== input.routing.integrity_hash
    || suspensionHash(input.suspension) !== input.suspension.integrity_hash
    || recordHash(input.record) !== input.record.integrity_hash
    || resolutionHash(input.resolution) !== input.resolution.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as EscalationFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly EscalationFailureReason[]): EscalationValidationResult {
  const has = (failure: EscalationFailureReason) => failures.includes(failure);
  const base: Omit<EscalationValidationResult, "integrity_hash"> = {
    validation_id: `escalation_validation_${workflowId}`,
    workflow_id: workflowId,
    escalation_type_valid: !has("ESCALATION_TYPE_UNKNOWN"),
    requesting_authority_valid: !has("REQUESTING_AUTHORITY_UNAUTHORIZED"),
    destination_authority_valid: !has("DESTINATION_AUTHORITY_INVALID"),
    routing_valid: !has("ROUTING_UNDETERMINED"),
    workflow_valid: !has("WORKFLOW_INVALID") && !has("REVIEW_MANAGER_FAILED"),
    workflow_suspended: !has("WORKFLOW_SUSPENSION_FAILED"),
    escalation_resolved: !has("GOVERNANCE_ESCALATION_INCOMPLETE") && !has("CONSTITUTIONAL_ESCALATION_UNRESOLVED") && !has("CERTIFICATION_ESCALATION_UNRESOLVED"),
    governance_valid: !has("GOVERNANCE_ESCALATION_INCOMPLETE"),
    constitutional_valid: !has("CONSTITUTIONAL_ESCALATION_UNRESOLVED"),
    certification_valid: !has("CERTIFICATION_ESCALATION_UNRESOLVED"),
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
  request: EscalationRequest,
  routing: EscalationRoutingDecision,
  suspension: EscalationSuspensionRecord,
  record: EscalationRecord,
  resolution: EscalationResolution,
  validation: EscalationValidationResult,
): readonly EscalationLedgerEntry[] {
  const base: Omit<EscalationLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `escalation_ledger_${record.escalation_id}`,
    workflow_id: request.workflow_id,
    escalation_request_id: request.escalation_request_id,
    escalation_id: record.escalation_id,
    routing_id: routing.routing_id,
    suspension_id: suspension.suspension_id,
    resolution_id: resolution.resolution_id,
    escalation_state: validation.validation_status === "VALID" ? "WORKFLOW_RESUMED" : "WORKFLOW_SUSPENDED",
    replay_ref: request.replay_ref,
    lineage_ref: request.lineage_ref,
    integrity_hash: record.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    review_result: result.review_result,
    escalation_request: result.escalation_request,
    routing_decision: result.routing_decision,
    suspension_record: result.suspension_record,
    escalation_record: result.escalation_record,
    escalation_resolution: result.escalation_resolution,
    validation: result.validation,
    escalation_ledger: result.escalation_ledger,
    failures: result.failures,
  });
}

export function runEscalationWorkflow(input: EscalationWorkflowInput = {}): EscalationWorkflowResult {
  const review_result = input.review_result ?? runReviewRequestManager();
  const escalation_request = input.escalation_request ?? createEscalationRequest(review_result);
  const routing_decision = input.routing_decision ?? createEscalationRouting(escalation_request);
  const suspension_record = input.suspension_record ?? createEscalationSuspension(review_result, escalation_request);
  const escalation_record = input.escalation_record ?? createEscalationRecord(escalation_request, routing_decision);
  const escalation_resolution = input.escalation_resolution ?? createEscalationResolution(escalation_record, escalation_request);
  const initialFailures = collectFailures({
    reviewResult: review_result,
    request: escalation_request,
    routing: routing_decision,
    suspension: suspension_record,
    record: escalation_record,
    resolution: escalation_resolution,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(escalation_request.workflow_id, initialFailures);
  const escalation_ledger = input.escalation_ledger ?? createLedger(escalation_request, routing_decision, suspension_record, escalation_record, escalation_resolution, validation);
  const ledgerValid = escalation_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(ledgerValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as EscalationFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(escalation_request.workflow_id, finalFailures);
  const finalLedger = finalValidation === validation ? escalation_ledger : createLedger(escalation_request, routing_decision, suspension_record, escalation_record, escalation_resolution, finalValidation);
  const base: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash"> = {
    escalation_workflow_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    review_result,
    escalation_request,
    routing_decision,
    suspension_record,
    escalation_record,
    escalation_resolution,
    validation: finalValidation,
    escalation_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly EscalationFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(escalation_request.workflow_id, replayFailures);
    const replayLedger = createLedger(escalation_request, routing_decision, suspension_record, escalation_record, escalation_resolution, replayValidation);
    const replayBase: Omit<EscalationWorkflowResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      escalation_workflow_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      escalation_ledger: replayLedger,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayEscalationWorkflow(result: EscalationWorkflowResult): EscalationWorkflowReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && requestHash(result.escalation_request) === result.escalation_request.integrity_hash
    && routingHash(result.routing_decision) === result.routing_decision.integrity_hash
    && suspensionHash(result.suspension_record) === result.suspension_record.integrity_hash
    && recordHash(result.escalation_record) === result.escalation_record.integrity_hash
    && resolutionHash(result.escalation_resolution) === result.escalation_resolution.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.escalation_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: EscalationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<EscalationWorkflowReplay, "integrity_hash"> = {
    replay_id: "replay_escalation_workflow",
    replay_valid,
    workflow_id: result.escalation_request.workflow_id,
    escalation_request_id: result.escalation_request.escalation_request_id,
    escalation_type: result.escalation_request.escalation_type,
    routing_path: result.routing_decision.routing_path,
    destination_authority: result.escalation_request.destination_authority,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildEscalationWorkflowObservability(result: EscalationWorkflowResult): EscalationWorkflowObservability {
  return Object.freeze({
    escalations_processed: 1,
    escalations_routed: result.validation.routing_valid ? 1 : 0,
    workflows_suspended: result.validation.workflow_suspended ? 1 : 0,
    escalations_resolved: result.validation.escalation_resolved ? 1 : 0,
    workflows_resumed: result.escalation_resolution.resulting_workflow_state === "WORKFLOW_RESUMED" ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayEscalationWorkflow(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getEscalationWorkflowFoundation(): EscalationWorkflowFoundation {
  const result = runEscalationWorkflow();
  const replay = replayEscalationWorkflow(result);
  return Object.freeze({
    escalation_workflow_version: ESCALATION_WORKFLOW_VERSION,
    escalation_types: ESCALATION_TYPES,
    escalation_states: ESCALATION_STATES,
    result,
    replay,
    observability: buildEscalationWorkflowObservability(result),
  });
}

export const EscalationWorkflow = Object.freeze({
  run: runEscalationWorkflow,
  replay: replayEscalationWorkflow,
});
