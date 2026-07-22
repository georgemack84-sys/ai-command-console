import type { EscalationWorkflowResult } from "@/types/decision-conflict-escalation-workflow";

export type ConflictLedgerEventType =
  | "CONFLICT_CREATED"
  | "CONFLICT_DETECTED"
  | "CONFLICT_CLASSIFIED"
  | "EVIDENCE_REGISTERED"
  | "ARBITRATION_STARTED"
  | "ARBITRATION_COMPLETED"
  | "TRADEOFF_GENERATED"
  | "ESCALATION_CREATED"
  | "REPLAY_REGISTERED"
  | "CERTIFICATION_REGISTERED"
  | "LEDGER_VALIDATED";

export type ConflictLedgerLifecycleState =
  | "CONFLICT_RECORDED"
  | "CLASSIFICATION_RECORDED"
  | "EVIDENCE_RECORDED"
  | "ARBITRATION_RECORDED"
  | "TRADEOFF_RECORDED"
  | "ESCALATION_RECORDED"
  | "REPLAY_RECORDED"
  | "CERTIFICATION_RECORDED"
  | "ARCHIVED_IMMUTABLE";

export type ConflictLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  conflict_id: string;
  event_type: ConflictLedgerEventType;
  lifecycle_state: ConflictLedgerLifecycleState;
  source_component: string;
  source_record_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  previous_hash: string;
  ledger_sequence: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type ConflictAuditEvent = Readonly<{
  audit_event_id: string;
  ledger_entry_id: string;
  event_type: ConflictLedgerEventType;
  initiating_component: string;
  lifecycle_state: ConflictLedgerLifecycleState;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ConflictReplayReference = Readonly<{
  replay_ref: string;
  conflict_id: string;
  sequence_number: number;
  dependency_refs: readonly string[];
  reconstruction_order: number;
  validation_status: "VALID" | "REJECTED";
  integrity_hash: string;
}>;

export type ConflictCertificationEvidence = Readonly<{
  certification_id: string;
  conflict_id: string;
  ledger_entry_id: string;
  prerequisites: readonly string[];
  outcomes: readonly string[];
  reports: readonly string[];
  replay_validation: "VALID" | "REJECTED";
  integrity_validation: "VALID" | "REJECTED";
  governance_validation: "VALID" | "REJECTED";
  constitutional_validation: "VALID" | "REJECTED";
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConflictLedgerFailureReason =
  | "DUPLICATE_LEDGER_ENTRY"
  | "SEQUENCE_VIOLATION"
  | "HASH_MISMATCH"
  | "REPLAY_REFERENCE_OMITTED"
  | "MISSING_GOVERNANCE_METADATA"
  | "MISSING_CONSTITUTIONAL_METADATA"
  | "UNAUTHORIZED_WRITE"
  | "CROSS_TENANT_RECORD_ACCESS"
  | "INVALID_LINEAGE_REFERENCE"
  | "APPEND_FAILURE"
  | "UNSUPPORTED_EVENT_TYPE";

export type ConflictLedgerValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ConflictLedgerFailureReason[];
  checks: Readonly<{
    schema_valid: boolean;
    sequence_valid: boolean;
    lineage_valid: boolean;
    replay_valid: boolean;
    hash_valid: boolean;
    tenant_isolated: boolean;
    governance_present: boolean;
    constitutional_present: boolean;
  }>;
}>;

export type ConflictLedgerInput = Readonly<{
  escalation_result?: EscalationWorkflowResult;
  entries?: readonly ConflictLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ConflictLedgerResult = Readonly<{
  ledger_status: "PASS" | "FAIL";
  fail_closed: boolean;
  entries: readonly ConflictLedgerEntry[];
  audit_events: readonly ConflictAuditEvent[];
  replay_references: readonly ConflictReplayReference[];
  certification_evidence: readonly ConflictCertificationEvidence[];
  validations: readonly ConflictLedgerValidation[];
  replay_hash: string;
  failures: readonly ConflictLedgerFailureReason[];
  append_only: true;
  deterministic: true;
  integrity_hash: string;
}>;

export type ConflictLedgerReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  ledger_entry_refs: readonly string[];
  audit_event_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ConflictLedgerFailureReason[];
  integrity_hash: string;
}>;

export type ConflictLedgerObservability = Readonly<{
  ledger_entries_written: number;
  audit_events_recorded: number;
  replay_references_created: number;
  certification_records_stored: number;
  sequence_validation_failures: number;
  integrity_validation_failures: number;
  replay_validation_failures: number;
  append_latency: number;
  storage_utilization: number;
  tenant_distribution: Readonly<Record<string, number>>;
}>;

export type ConflictLedgerFoundation = Readonly<{
  ledger_version: "conflict-ledger/v1";
  supported_event_types: readonly ConflictLedgerEventType[];
  result: ConflictLedgerResult;
  replay: ConflictLedgerReplay;
  observability: ConflictLedgerObservability;
}>;
