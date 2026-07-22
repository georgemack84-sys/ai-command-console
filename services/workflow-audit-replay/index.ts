import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEscalationWorkflow } from "@/services/escalation-workflow";
import type { EscalationWorkflowResult } from "@/types/escalation-workflow";
import type {
  WorkflowAuditEvent,
  WorkflowAuditEventType,
  WorkflowAuditFailureReason,
  WorkflowAuditLedgerEntry,
  WorkflowAuditObservability,
  WorkflowAuditReplay,
  WorkflowAuditReplayFoundation,
  WorkflowAuditReplayInput,
  WorkflowAuditReplayResult,
  WorkflowAuditValidationResult,
  WorkflowReplayRecord,
  WorkflowReplayState,
  WorkflowTimelineRecord,
} from "@/types/workflow-audit-replay";

const AUDIT_REPLAY_VERSION = "workflow-audit-replay/v1" as const;
const AUTHORIZED_COMPONENT = "workflow-audit-replay";
const NOW = "2026-07-05T00:12:00.000Z";

export const WORKFLOW_REPLAY_STATES: readonly WorkflowReplayState[] = Object.freeze(["EVENT_CAPTURED", "LEDGER_RECORDED", "TIMELINE_UPDATED", "REPLAY_REGISTERED", "REPLAY_RECONSTRUCTED", "REPLAY_VALIDATED", "CERTIFIED"]);

export const REQUIRED_WORKFLOW_AUDIT_EVENTS: readonly WorkflowAuditEventType[] = Object.freeze([
  "WORKFLOW_CREATION",
  "PACKAGE_PRESENTATION",
  "OPERATOR_APPROVAL",
  "OPERATOR_OVERRIDE",
  "REVIEW_REQUEST",
  "ESCALATION",
  "WORKFLOW_SUSPENSION",
  "WORKFLOW_RESUMPTION",
  "GOVERNANCE_VALIDATION",
  "CONSTITUTIONAL_VALIDATION",
  "AUTHORITY_VALIDATION",
  "REPLAY_VALIDATION",
  "INTEGRITY_VERIFICATION",
  "ARCHIVE_ACTION",
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

function eventHash(record: Omit<WorkflowAuditEvent, "integrity_hash"> | WorkflowAuditEvent): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowAuditEventHash(record: Omit<WorkflowAuditEvent, "integrity_hash"> | WorkflowAuditEvent): string {
  return eventHash(record);
}

function timelineHash(record: Omit<WorkflowTimelineRecord, "integrity_hash"> | WorkflowTimelineRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowTimelineHash(record: Omit<WorkflowTimelineRecord, "integrity_hash"> | WorkflowTimelineRecord): string {
  return timelineHash(record);
}

function replayRecordHash(record: Omit<WorkflowReplayRecord, "integrity_hash"> | WorkflowReplayRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowReplayRecordHash(record: Omit<WorkflowReplayRecord, "integrity_hash"> | WorkflowReplayRecord): string {
  return replayRecordHash(record);
}

function validationHash(record: Omit<WorkflowAuditValidationResult, "integrity_hash"> | WorkflowAuditValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<WorkflowAuditLedgerEntry, "ledger_integrity_hash"> | WorkflowAuditLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function categoryFor(type: WorkflowAuditEventType): WorkflowAuditEvent["event_category"] {
  if (type.includes("GOVERNANCE")) return "governance";
  if (type.includes("CONSTITUTIONAL")) return "constitutional";
  if (type.includes("APPROVAL")) return "approval";
  if (type.includes("REVIEW")) return "review";
  if (type.includes("ESCALATION")) return "escalation";
  if (type.includes("ARCHIVE")) return "archival";
  if (type.includes("OPERATOR")) return "operator";
  return "lifecycle";
}

function workflowId(result: EscalationWorkflowResult): string {
  return result.escalation_request.workflow_id;
}

export function createWorkflowAuditEvents(escalationResult: EscalationWorkflowResult = runEscalationWorkflow()): readonly WorkflowAuditEvent[] {
  const request = escalationResult.escalation_request;
  const eventData: readonly Readonly<{ type: WorkflowAuditEventType; state: string; authority: string; summary: string }>[] = Object.freeze([
    { type: "WORKFLOW_CREATION", state: "CREATED", authority: "workflow-state-machine", summary: "Operator workflow created." },
    { type: "PACKAGE_PRESENTATION", state: "PRESENTED", authority: "decision-package-certification-gate", summary: "Decision package presented to operator workflow." },
    { type: "OPERATOR_APPROVAL", state: "APPROVED", authority: escalationResult.review_result.override_result.approval_result.action_result.action_request.operator_id, summary: "Operator action accepted for advisory progression." },
    { type: "OPERATOR_OVERRIDE", state: "OVERRIDE_RECORDED", authority: escalationResult.review_result.override_result.override_request.operator_id, summary: "Operator override recorded while preserving original recommendation." },
    { type: "REVIEW_REQUEST", state: escalationResult.review_result.review_request.request_status, authority: escalationResult.review_result.review_request.requested_by, summary: "Review request registered and completed." },
    { type: "ESCALATION", state: escalationResult.escalation_ledger[0]?.escalation_state ?? "WORKFLOW_RESUMED", authority: request.destination_authority, summary: "Escalation routed and resolved." },
    { type: "WORKFLOW_SUSPENSION", state: escalationResult.suspension_record.suspension_status, authority: request.requesting_authority, summary: "Workflow suspended during escalation." },
    { type: "WORKFLOW_RESUMPTION", state: escalationResult.escalation_resolution.resulting_workflow_state, authority: request.destination_authority, summary: "Workflow resumed after escalation resolution." },
    { type: "GOVERNANCE_VALIDATION", state: escalationResult.validation.governance_valid ? "VALID" : "REJECTED", authority: "Governance Authority", summary: "Governance history retained in replay." },
    { type: "CONSTITUTIONAL_VALIDATION", state: escalationResult.validation.constitutional_valid ? "VALID" : "REJECTED", authority: "Constitutional Authority", summary: "Constitutional validation retained in replay." },
    { type: "AUTHORITY_VALIDATION", state: escalationResult.validation.requesting_authority_valid ? "VALID" : "REJECTED", authority: request.destination_authority, summary: "Authority decision retained in replay." },
    { type: "REPLAY_VALIDATION", state: escalationResult.validation.replay_valid ? "VALID" : "REJECTED", authority: "workflow-audit-replay", summary: "Replay references validated." },
    { type: "INTEGRITY_VERIFICATION", state: escalationResult.validation.integrity_valid ? "VALID" : "REJECTED", authority: "workflow-audit-replay", summary: "Integrity references validated." },
    { type: "ARCHIVE_ACTION", state: "ARCHIVED", authority: request.destination_authority, summary: "Archive marker recorded for complete workflow replay." },
  ]);
  const events = eventData.map((data, index) => {
    const base: Omit<WorkflowAuditEvent, "integrity_hash"> = {
      event_id: `workflow_audit_event_${String(index + 1).padStart(2, "0")}_${data.type}_${request.workflow_id}`,
      workflow_id: request.workflow_id,
      tenant_id: request.tenant_id,
      event_sequence: index + 1,
      event_type: data.type,
      event_category: categoryFor(data.type),
      workflow_state: data.state,
      triggering_authority: data.authority,
      event_summary: data.summary,
      timestamp: NOW,
      replay_ref: request.replay_ref,
      lineage_ref: request.lineage_ref,
      advisory_only: true,
    };
    return Object.freeze({ ...base, integrity_hash: eventHash(base) });
  });
  return Object.freeze(events);
}

export function createWorkflowTimelineRecord(events: readonly WorkflowAuditEvent[] = createWorkflowAuditEvents()): WorkflowTimelineRecord {
  const ordered = [...events].sort((left, right) => left.event_sequence - right.event_sequence);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const base: Omit<WorkflowTimelineRecord, "integrity_hash"> = {
    timeline_id: `workflow_timeline_${first?.workflow_id ?? "unknown"}`,
    workflow_id: first?.workflow_id ?? "",
    ordered_events: Object.freeze(ordered.map((event) => event.event_id)),
    first_event: first?.event_id ?? "",
    last_event: last?.event_id ?? "",
    event_count: ordered.length,
    replay_ref: first?.replay_ref ?? "",
  };
  return Object.freeze({ ...base, integrity_hash: timelineHash(base) });
}

export function createWorkflowReplayRecord(events: readonly WorkflowAuditEvent[] = createWorkflowAuditEvents(), timeline: WorkflowTimelineRecord = createWorkflowTimelineRecord(events)): WorkflowReplayRecord {
  const lastEvent = events.find((event) => event.event_id === timeline.last_event);
  const base: Omit<WorkflowReplayRecord, "integrity_hash"> = {
    replay_id: `workflow_replay_${timeline.workflow_id}`,
    workflow_id: timeline.workflow_id,
    replay_version: AUDIT_REPLAY_VERSION,
    replay_status: "CERTIFIED",
    reconstructed_state: lastEvent?.workflow_state ?? "UNKNOWN",
    replay_timestamp: NOW,
    replay_ref: timeline.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: replayRecordHash(base) });
}

function collectFailures(input: {
  escalationResult: EscalationWorkflowResult;
  events: readonly WorkflowAuditEvent[];
  timeline: WorkflowTimelineRecord;
  replay: WorkflowReplayRecord;
  authorized: boolean;
}): readonly WorkflowAuditFailureReason[] {
  const failures: WorkflowAuditFailureReason[] = [];
  const eventTypes = input.events.map((event) => event.event_type);
  const eventIds = input.events.map((event) => event.event_id);
  const sequences = input.events.map((event) => event.event_sequence);
  const sortedSequences = [...sequences].sort((left, right) => left - right);
  const expectedSequences = input.events.map((_event, index) => index + 1);
  if (!input.authorized) failures.push("UNAUTHORIZED_AUDIT_ACCESS");
  if (input.escalationResult.escalation_workflow_status !== "PASS") failures.push("ESCALATION_WORKFLOW_FAILED");
  if (input.events.length === 0 || REQUIRED_WORKFLOW_AUDIT_EVENTS.some((eventType) => !eventTypes.includes(eventType))) failures.push("WORKFLOW_EVENT_MISSING");
  if (sortedSequences.join(">") !== expectedSequences.join(">")) failures.push("EVENT_SEQUENCE_INVALID");
  if (new Set(eventIds).size !== eventIds.length || new Set(sequences).size !== sequences.length) failures.push("DUPLICATE_EVENT_DETECTED");
  if (input.timeline.event_count !== input.events.length || input.timeline.ordered_events.length !== input.events.length || !input.timeline.first_event || !input.timeline.last_event) failures.push("TIMELINE_INCOMPLETE");
  if (input.replay.reconstructed_state !== "ARCHIVED" || input.replay.replay_status !== "CERTIFIED") failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (!eventTypes.includes("GOVERNANCE_VALIDATION")) failures.push("GOVERNANCE_HISTORY_MISSING");
  if (!eventTypes.includes("CONSTITUTIONAL_VALIDATION")) failures.push("CONSTITUTIONAL_HISTORY_MISSING");
  if (!eventTypes.includes("ARCHIVE_ACTION")) failures.push("ARCHIVE_EVENT_MISSING");
  if (input.events.some((event) => event.tenant_id !== input.escalationResult.escalation_request.tenant_id)) failures.push("TENANT_MISMATCH");
  if (input.events.some((event) => !event.replay_ref) || !input.timeline.replay_ref || !input.replay.replay_ref) failures.push("REPLAY_REFERENCE_UNAVAILABLE");
  if (input.events.some((event) => !event.lineage_ref)) failures.push("LINEAGE_INCOMPLETE");
  if (input.events.some((event) => !event.advisory_only) || !input.escalationResult.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    input.events.some((event) => eventHash(event) !== event.integrity_hash)
    || timelineHash(input.timeline) !== input.timeline.integrity_hash
    || replayRecordHash(input.replay) !== input.replay.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as WorkflowAuditFailureReason[]);
}

function createValidation(workflowIdValue: string, failures: readonly WorkflowAuditFailureReason[]): WorkflowAuditValidationResult {
  const has = (failure: WorkflowAuditFailureReason) => failures.includes(failure);
  const base: Omit<WorkflowAuditValidationResult, "integrity_hash"> = {
    validation_id: `workflow_audit_validation_${workflowIdValue}`,
    workflow_id: workflowIdValue,
    events_complete: !has("WORKFLOW_EVENT_MISSING"),
    sequence_valid: !has("EVENT_SEQUENCE_INVALID"),
    duplicates_absent: !has("DUPLICATE_EVENT_DETECTED"),
    timeline_complete: !has("TIMELINE_INCOMPLETE"),
    replay_reconstructed: !has("REPLAY_RECONSTRUCTION_FAILED"),
    replay_valid: !has("REPLAY_DIVERGENCE_DETECTED") && !has("REPLAY_DIVERGENCE") && !has("REPLAY_RECONSTRUCTION_FAILED"),
    governance_history_present: !has("GOVERNANCE_HISTORY_MISSING"),
    constitutional_history_present: !has("CONSTITUTIONAL_HISTORY_MISSING"),
    archive_event_present: !has("ARCHIVE_EVENT_MISSING"),
    tenant_valid: !has("TENANT_MISMATCH"),
    lineage_valid: !has("LINEAGE_INCOMPLETE"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function createLedger(events: readonly WorkflowAuditEvent[], timeline: WorkflowTimelineRecord, replay: WorkflowReplayRecord, validation: WorkflowAuditValidationResult): readonly WorkflowAuditLedgerEntry[] {
  const first = events[0];
  const last = events[events.length - 1];
  const base: Omit<WorkflowAuditLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `workflow_audit_ledger_${timeline.workflow_id}`,
    workflow_id: timeline.workflow_id,
    event_count: events.length,
    timeline_id: timeline.timeline_id,
    replay_id: replay.replay_id,
    first_event: first?.event_id ?? "",
    last_event: last?.event_id ?? "",
    replay_ref: replay.replay_ref,
    lineage_ref: first?.lineage_ref ?? "",
    integrity_hash: validation.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<WorkflowAuditReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    escalation_result: result.escalation_result,
    audit_events: result.audit_events,
    timeline_record: result.timeline_record,
    replay_record: result.replay_record,
    validation: result.validation,
    audit_ledger: result.audit_ledger,
    failures: result.failures,
  });
}

export function runWorkflowAuditReplay(input: WorkflowAuditReplayInput = {}): WorkflowAuditReplayResult {
  const escalation_result = input.escalation_result ?? runEscalationWorkflow();
  const audit_events = input.audit_events ?? createWorkflowAuditEvents(escalation_result);
  const timeline_record = input.timeline_record ?? createWorkflowTimelineRecord(audit_events);
  const replay_record = input.replay_record ?? createWorkflowReplayRecord(audit_events, timeline_record);
  const initialFailures = collectFailures({
    escalationResult: escalation_result,
    events: audit_events,
    timeline: timeline_record,
    replay: replay_record,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = createValidation(workflowId(escalation_result), initialFailures);
  const audit_ledger = input.audit_ledger ?? createLedger(audit_events, timeline_record, replay_record, validation);
  const ledgerValid = audit_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted);
  const finalFailures = Object.freeze([...new Set([
    ...initialFailures,
    ...(ledgerValid ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
  ])] as WorkflowAuditFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : createValidation(workflowId(escalation_result), finalFailures);
  const finalLedger = finalValidation === validation ? audit_ledger : createLedger(audit_events, timeline_record, replay_record, finalValidation);
  const base: Omit<WorkflowAuditReplayResult, "integrity_hash" | "replay_hash"> = {
    audit_replay_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.validation_status !== "VALID",
    escalation_result,
    audit_events,
    timeline_record,
    replay_record,
    validation: finalValidation,
    audit_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly WorkflowAuditFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(workflowId(escalation_result), replayFailures);
    const replayLedger = createLedger(audit_events, timeline_record, replay_record, replayValidation);
    const replayBase: Omit<WorkflowAuditReplayResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      audit_replay_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      audit_ledger: replayLedger,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayWorkflowAudit(result: WorkflowAuditReplayResult): WorkflowAuditReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.audit_events.every((event) => eventHash(event) === event.integrity_hash)
    && timelineHash(result.timeline_record) === result.timeline_record.integrity_hash
    && replayRecordHash(result.replay_record) === result.replay_record.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.audit_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: WorkflowAuditFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<WorkflowAuditReplay, "integrity_hash"> = {
    replay_id: "replay_workflow_audit",
    replay_valid,
    workflow_id: result.timeline_record.workflow_id,
    reconstructed_events: result.timeline_record.ordered_events,
    reconstructed_state: result.replay_record.reconstructed_state,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildWorkflowAuditObservability(result: WorkflowAuditReplayResult): WorkflowAuditObservability {
  return Object.freeze({
    audit_events_recorded: result.audit_events.length,
    timelines_generated: result.timeline_record.event_count > 0 ? 1 : 0,
    replay_records_generated: result.replay_record.replay_status === "CERTIFIED" ? 1 : 0,
    sequence_failures: result.failures.includes("EVENT_SEQUENCE_INVALID") ? 1 : 0,
    duplicate_events_detected: result.failures.includes("DUPLICATE_EVENT_DETECTED") ? 1 : 0,
    replay_reproducibility: replayWorkflowAudit(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getWorkflowAuditReplayFoundation(): WorkflowAuditReplayFoundation {
  const result = runWorkflowAuditReplay();
  const replay = replayWorkflowAudit(result);
  return Object.freeze({
    audit_replay_version: AUDIT_REPLAY_VERSION,
    replay_states: WORKFLOW_REPLAY_STATES,
    required_event_types: REQUIRED_WORKFLOW_AUDIT_EVENTS,
    result,
    replay,
    observability: buildWorkflowAuditObservability(result),
  });
}

export const WorkflowAuditReplayService = Object.freeze({
  run: runWorkflowAuditReplay,
  replay: replayWorkflowAudit,
});
