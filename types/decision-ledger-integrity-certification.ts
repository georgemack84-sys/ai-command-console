import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OperatorWorkflowCertificationResult } from "@/types/decision-operator-workflow-certification";

export type LedgerIntegrityScope =
  | "IMMUTABLE_LEDGER"
  | "INTEGRITY_HASHES"
  | "EVIDENCE_LINEAGE"
  | "AUDIT_COMPLETENESS"
  | "TRACEABILITY"
  | "REPLAY_INTEGRITY"
  | "CERTIFICATION_LINEAGE";

export type LedgerIntegrityCheck =
  | "APPEND_ONLY_BEHAVIOR"
  | "RECORD_IMMUTABILITY"
  | "WRITE_ORDERING"
  | "HASH_REPRODUCIBILITY"
  | "TAMPER_DETECTION"
  | "LINEAGE_COMPLETENESS"
  | "AUDIT_COMPLETENESS"
  | "END_TO_END_TRACEABILITY"
  | "REPLAY_REPRODUCIBILITY";

export type LedgerIntegrityCertificationState = "PASS" | "FAIL";

export type LedgerIntegrityCertificationFailure =
  | "OPERATOR_WORKFLOW_CERTIFICATION_INVALID"
  | "LEDGER_MUTATION"
  | "RECORD_DELETION"
  | "RECORD_MODIFICATION"
  | "APPEND_ONLY_VIOLATION"
  | "HASH_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "TAMPERING_UNDETECTED"
  | "MISSING_EVIDENCE_LINEAGE"
  | "BROKEN_LINEAGE_CHAIN"
  | "MISSING_AUDIT_RECORDS"
  | "INCOMPLETE_CHRONOLOGY"
  | "MISSING_TRACEABILITY"
  | "REPLAY_LINEAGE_CORRUPTION"
  | "CERTIFICATION_LINEAGE_CORRUPTION"
  | "CROSS_TENANT_LEDGER_CONTAMINATION"
  | "HIDDEN_RECORDS"
  | "UNTRACEABLE_DECISION"
  | "REPLAY_INCONSISTENCY"
  | "INTEGRITY_REPLAY_MISMATCH"
  | "FAIL_OPEN_LEDGER_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type LedgerRecordSnapshot = Readonly<{
  record_id: string;
  tenant_id: string;
  mission_id: string;
  record_type: "ORCHESTRATION" | "DECISION" | "GOVERNANCE" | "OPERATOR" | "REPLAY" | "CERTIFICATION";
  source_ref: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  replay_ref: string;
  evidence_refs: readonly string[];
  parent_refs: readonly string[];
  child_refs: readonly string[];
  integrity_hash: string;
}>;

export type LedgerImmutabilityReport = Readonly<{
  immutability_report_id: string;
  tenant_id: string;
  mission_id: string;
  ledger_records: readonly LedgerRecordSnapshot[];
  append_only_enforced: boolean;
  records_immutable: boolean;
  write_ordering_deterministic: boolean;
  commit_integrity_verified: boolean;
  historical_records_preserved: boolean;
  version_permanence_verified: boolean;
  ledger_replay_consistent: boolean;
  validation_state: LedgerIntegrityCertificationState;
  integrity_hash: string;
}>;

export type IntegrityVerificationReport = Readonly<{
  integrity_report_id: string;
  tenant_id: string;
  mission_id: string;
  record_hashes_verified: boolean;
  ledger_hashes_verified: boolean;
  replay_hashes_verified: boolean;
  certification_hashes_verified: boolean;
  evidence_hashes_verified: boolean;
  hash_reproducible: boolean;
  tampering_detected: boolean;
  tampering_detection_operational: boolean;
  validation_state: LedgerIntegrityCertificationState;
  integrity_hash: string;
}>;

export type EvidenceLineageReport = Readonly<{
  lineage_report_id: string;
  tenant_id: string;
  mission_id: string;
  evidence_origins_complete: boolean;
  parent_child_relationships_valid: boolean;
  dependency_lineage_complete: boolean;
  decision_lineage_complete: boolean;
  governance_lineage_complete: boolean;
  replay_lineage_complete: boolean;
  certification_lineage_complete: boolean;
  lineage_refs: readonly string[];
  validation_state: LedgerIntegrityCertificationState;
  integrity_hash: string;
}>;

export type AuditCompletenessReport = Readonly<{
  audit_report_id: string;
  tenant_id: string;
  mission_id: string;
  decision_history_complete: boolean;
  operator_history_complete: boolean;
  governance_history_complete: boolean;
  replay_history_complete: boolean;
  certification_history_complete: boolean;
  state_transitions_complete: boolean;
  event_chronology_complete: boolean;
  audit_timeline_refs: readonly string[];
  validation_state: LedgerIntegrityCertificationState;
  integrity_hash: string;
}>;

export type TraceabilityVerificationReport = Readonly<{
  traceability_report_id: string;
  tenant_id: string;
  mission_id: string;
  decision_traceability_complete: boolean;
  evidence_traceability_complete: boolean;
  dependency_traceability_complete: boolean;
  governance_traceability_complete: boolean;
  authority_traceability_complete: boolean;
  operator_traceability_complete: boolean;
  replay_traceability_complete: boolean;
  cross_reference_integrity_valid: boolean;
  trace_graph_refs: readonly string[];
  validation_state: LedgerIntegrityCertificationState;
  integrity_hash: string;
}>;

export type LedgerCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  ledger_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  lineage_evidence_refs: readonly string[];
  audit_evidence_refs: readonly string[];
  traceability_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type LedgerCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly LedgerIntegrityScope[];
  certified_checks: readonly LedgerIntegrityCheck[];
  ledger_immutability_assessment: LedgerIntegrityCertificationState;
  integrity_verification_results: LedgerIntegrityCertificationState;
  evidence_lineage_assessment: LedgerIntegrityCertificationState;
  audit_completeness_assessment: LedgerIntegrityCertificationState;
  traceability_assessment: LedgerIntegrityCertificationState;
  replay_integrity_results: LedgerIntegrityCertificationState;
  failure_analysis: readonly LedgerIntegrityCertificationFailure[];
  certification_decision: LedgerIntegrityCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type LedgerCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "LEDGER_VALIDATED" | "INTEGRITY_VALIDATED" | "LINEAGE_VALIDATED" | "AUDIT_VALIDATED" | "TRACEABILITY_VALIDATED" | "LEDGER_CERTIFIED" | "LEDGER_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: LedgerIntegrityCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type LedgerIntegrityCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  operator_workflow_certification_valid: boolean;
  ledger_unmodified: boolean;
  records_not_deleted: boolean;
  records_not_modified: boolean;
  append_only_enforced: boolean;
  hashes_match: boolean;
  integrity_verified: boolean;
  tampering_detected: boolean;
  evidence_lineage_complete: boolean;
  lineage_chain_valid: boolean;
  audit_records_complete: boolean;
  chronology_complete: boolean;
  traceability_complete: boolean;
  replay_lineage_complete: boolean;
  certification_lineage_complete: boolean;
  tenant_isolated: boolean;
  hidden_records_absent: boolean;
  decisions_traceable: boolean;
  replay_consistent: boolean;
  integrity_replay_consistent: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly LedgerIntegrityCertificationFailure[];
  integrity_hash: string;
}>;

export type LedgerIntegrityCertificationInput = Readonly<{
  operator_workflow_certification?: OperatorWorkflowCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "OPERATOR_INVALID"
    | "LEDGER_MUTATION"
    | "RECORD_DELETION"
    | "RECORD_MODIFICATION"
    | "APPEND_ONLY_VIOLATION"
    | "HASH_MISMATCH"
    | "INTEGRITY_FAILURE"
    | "TAMPERING_UNDETECTED"
    | "MISSING_EVIDENCE_LINEAGE"
    | "BROKEN_LINEAGE"
    | "MISSING_AUDIT_RECORDS"
    | "INCOMPLETE_CHRONOLOGY"
    | "MISSING_TRACEABILITY"
    | "REPLAY_LINEAGE_CORRUPTION"
    | "CERTIFICATION_LINEAGE_CORRUPTION"
    | "CROSS_TENANT"
    | "HIDDEN_RECORDS"
    | "UNTRACEABLE_DECISION"
    | "REPLAY_INCONSISTENCY"
    | "INTEGRITY_REPLAY_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type LedgerIntegrityCertificationResult = Readonly<{
  certification_version: "decision-ledger-integrity-certification/v1";
  operator_workflow_certification: OperatorWorkflowCertificationResult;
  immutability_report: LedgerImmutabilityReport;
  integrity_report: IntegrityVerificationReport;
  lineage_report: EvidenceLineageReport;
  audit_report: AuditCompletenessReport;
  traceability_report: TraceabilityVerificationReport;
  evidence_package: LedgerCertificationEvidencePackage;
  ledger_report: LedgerCertificationReport;
  ledger_certification_ledger: readonly LedgerCertificationLedgerEntry[];
  validation: LedgerIntegrityCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_ledger_records: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type LedgerIntegrityCertificationFoundation = Readonly<{
  certification_version: "decision-ledger-integrity-certification/v1";
  scopes: readonly LedgerIntegrityScope[];
  checks: readonly LedgerIntegrityCheck[];
  result: LedgerIntegrityCertificationResult;
}>;
