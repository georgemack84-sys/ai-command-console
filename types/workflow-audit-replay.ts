import type { EscalationWorkflowResult } from "@/types/escalation-workflow";

export type WorkflowAuditEventType =
  | "WORKFLOW_CREATION"
  | "PACKAGE_PRESENTATION"
  | "OPERATOR_APPROVAL"
  | "OPERATOR_REJECTION"
  | "OPERATOR_OVERRIDE"
  | "REVIEW_REQUEST"
  | "ESCALATION"
  | "WORKFLOW_SUSPENSION"
  | "WORKFLOW_RESUMPTION"
  | "GOVERNANCE_VALIDATION"
  | "CONSTITUTIONAL_VALIDATION"
  | "AUTHORITY_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VERIFICATION"
  | "ARCHIVE_ACTION";

export type WorkflowReplayState =
  | "EVENT_CAPTURED"
  | "LEDGER_RECORDED"
  | "TIMELINE_UPDATED"
  | "REPLAY_REGISTERED"
  | "REPLAY_RECONSTRUCTED"
  | "REPLAY_VALIDATED"
  | "CERTIFIED";

export type WorkflowAuditEvent = Readonly<{
  event_id: string;
  workflow_id: string;
  tenant_id: string;
  event_sequence: number;
  event_type: WorkflowAuditEventType | string;
  event_category: "lifecycle" | "operator" | "governance" | "constitutional" | "approval" | "review" | "escalation" | "archival";
  workflow_state: string;
  triggering_authority: string;
  event_summary: string;
  timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type WorkflowReplayRecord = Readonly<{
  replay_id: string;
  workflow_id: string;
  replay_version: "workflow-audit-replay/v1";
  replay_status: "CERTIFIED" | "REJECTED";
  reconstructed_state: string;
  replay_timestamp: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type WorkflowTimelineRecord = Readonly<{
  timeline_id: string;
  workflow_id: string;
  ordered_events: readonly string[];
  first_event: string;
  last_event: string;
  event_count: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type WorkflowAuditLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  event_count: number;
  timeline_id: string;
  replay_id: string;
  first_event: string;
  last_event: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type WorkflowAuditFailureReason =
  | "WORKFLOW_EVENT_MISSING"
  | "EVENT_SEQUENCE_INVALID"
  | "DUPLICATE_EVENT_DETECTED"
  | "TIMELINE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "REPLAY_REFERENCE_UNAVAILABLE"
  | "LINEAGE_INCOMPLETE"
  | "GOVERNANCE_HISTORY_MISSING"
  | "CONSTITUTIONAL_HISTORY_MISSING"
  | "ARCHIVE_EVENT_MISSING"
  | "TENANT_MISMATCH"
  | "ESCALATION_WORKFLOW_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_AUDIT_ACCESS"
  | "REPLAY_DIVERGENCE";

export type WorkflowAuditValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  events_complete: boolean;
  sequence_valid: boolean;
  duplicates_absent: boolean;
  timeline_complete: boolean;
  replay_reconstructed: boolean;
  replay_valid: boolean;
  governance_history_present: boolean;
  constitutional_history_present: boolean;
  archive_event_present: boolean;
  tenant_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly WorkflowAuditFailureReason[];
  integrity_hash: string;
}>;

export type WorkflowAuditReplayInput = Readonly<{
  escalation_result?: EscalationWorkflowResult;
  audit_events?: readonly WorkflowAuditEvent[];
  timeline_record?: WorkflowTimelineRecord;
  replay_record?: WorkflowReplayRecord;
  audit_ledger?: readonly WorkflowAuditLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type WorkflowAuditReplayResult = Readonly<{
  audit_replay_status: "PASS" | "FAIL";
  fail_closed: boolean;
  escalation_result: EscalationWorkflowResult;
  audit_events: readonly WorkflowAuditEvent[];
  timeline_record: WorkflowTimelineRecord;
  replay_record: WorkflowReplayRecord;
  validation: WorkflowAuditValidationResult;
  audit_ledger: readonly WorkflowAuditLedgerEntry[];
  replay_hash: string;
  failures: readonly WorkflowAuditFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type WorkflowAuditReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  reconstructed_events: readonly string[];
  reconstructed_state: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly WorkflowAuditFailureReason[];
  integrity_hash: string;
}>;

export type WorkflowAuditObservability = Readonly<{
  audit_events_recorded: number;
  timelines_generated: number;
  replay_records_generated: number;
  sequence_failures: number;
  duplicate_events_detected: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type WorkflowAuditReplayFoundation = Readonly<{
  audit_replay_version: "workflow-audit-replay/v1";
  replay_states: readonly WorkflowReplayState[];
  required_event_types: readonly WorkflowAuditEventType[];
  result: WorkflowAuditReplayResult;
  replay: WorkflowAuditReplay;
  observability: WorkflowAuditObservability;
}>;
