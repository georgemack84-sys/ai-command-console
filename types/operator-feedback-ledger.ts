import type { FeedbackEvidenceCorrelationResult } from "@/types/feedback-evidence-correlation";

export type OperatorFeedbackLedgerState = "CERTIFIED" | "FAIL_CLOSED";
export type OperatorFeedbackLedgerHistoryType = "APPROVAL" | "OVERRIDE" | "REJECTION" | "EVIDENCE";

export type OperatorFeedbackLedgerFailure =
  | "INTEGRITY_HASH_INVALID"
  | "IMMUTABLE_IDENTIFIER_DUPLICATED"
  | "TENANT_MISMATCH"
  | "REPLAY_REFERENCE_MISSING"
  | "SCHEMA_VERSION_INVALID"
  | "GOVERNANCE_METADATA_INCOMPLETE"
  | "ORDERING_VIOLATION_DETECTED"
  | "MISSING_RECORD"
  | "LEDGER_CORRUPTION_DETECTED"
  | "CROSS_TENANT_CONTAMINATION"
  | "CORRELATION_REJECTED"
  | "HISTORICAL_RECORD_MODIFICATION"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT";

export type OperatorFeedbackLedgerScenario =
  | "BASELINE"
  | "APPROVAL"
  | "OVERRIDE"
  | "REJECTION"
  | "EVIDENCE"
  | "SIMULATION_USAGE"
  | "ADAPTATION_USAGE"
  | "CERTIFICATION"
  | "INVALID_HASH"
  | "DUPLICATE_IDENTIFIER"
  | "TENANT_MISMATCH"
  | "MISSING_REPLAY_REFERENCE"
  | "INVALID_SCHEMA_VERSION"
  | "MISSING_GOVERNANCE_METADATA"
  | "ORDERING_VIOLATION"
  | "MISSING_RECORD"
  | "LEDGER_CORRUPTION"
  | "CROSS_TENANT_CONTAMINATION"
  | "CORRELATION_REJECTED"
  | "HISTORICAL_RECORD_MODIFICATION"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT";

export type OperatorFeedbackLedgerRecord = Readonly<{
  ledger_record_id: string;
  feedback_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  decision_package_id: string;
  feedback_type: string;
  original_feedback: string;
  normalized_feedback: string;
  rationale: string;
  confidence_signal: string;
  governance_metadata_hash: string;
  creation_timestamp: string;
  schema_version: "operator-feedback-ledger-record/v1";
  replay_id: string;
  parent_hash: string;
  sequence_number: number;
  append_only: true;
  immutable: true;
  deleted: false;
  record_hash: string;
  integrity_hash: string;
}>;

export type OperatorFeedbackReplayLedgerRecord = Readonly<{
  replay_ledger_id: string;
  replay_id: string;
  replay_version: "operator-feedback-replay/v1";
  replay_timestamp: string;
  replay_sequence: number;
  replay_dependencies: readonly string[];
  replay_lineage: readonly string[];
  replay_verification_results: readonly string[];
  byte_identical: boolean;
  integrity_hash: string;
}>;

export type OperatorFeedbackHistoryRecord = Readonly<{
  history_id: string;
  history_type: OperatorFeedbackLedgerHistoryType;
  feedback_id: string;
  recommendation_ref: string;
  operator_id: string;
  rationale: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  mission_context: string;
  outcome_ref: string;
  immutable: true;
  integrity_hash: string;
}>;

export type OperatorFeedbackEvidenceHistoryRecord = Readonly<{
  evidence_history_id: string;
  feedback_id: string;
  original_evidence_refs: readonly string[];
  normalized_evidence_refs: readonly string[];
  supporting_document_refs: readonly string[];
  telemetry_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  simulation_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  adaptive_evidence_usage_refs: readonly string[];
  provenance_complete: boolean;
  integrity_hash: string;
}>;

export type OperatorFeedbackAdaptationUsageRecord = Readonly<{
  adaptation_usage_id: string;
  adaptation_proposal_id: string;
  referenced_feedback: string;
  referenced_evidence: readonly string[];
  usage_timestamp: string;
  governance_review: string;
  simulation_required: boolean;
  approval_status: "PENDING_REVIEW" | "APPROVED" | "NOT_REQUESTED";
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorFeedbackSimulationUsageRecord = Readonly<{
  simulation_usage_id: string;
  simulation_id: string;
  referenced_feedback: string;
  simulation_purpose: string;
  simulation_results: string;
  replay_refs: readonly string[];
  validation_outcome: "VALIDATED" | "PENDING_REVIEW";
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationLineageRecord = Readonly<{
  certification_id: string;
  certification_phase: "OPERATOR_FEEDBACK_LEDGER";
  validation_results: readonly string[];
  evidence_package: readonly string[];
  replay_refs: readonly string[];
  governance_approval: "CERTIFIED" | "REVIEW_REQUIRED";
  certification_timestamp: string;
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type OperatorFeedbackLedgerIntegrityReport = Readonly<{
  report_id: string;
  record_hashes_verified: boolean;
  chain_integrity_verified: boolean;
  immutable_identifiers_verified: boolean;
  replay_references_verified: boolean;
  schema_versions_verified: boolean;
  ledger_ordering_verified: boolean;
  tenant_ownership_verified: boolean;
  governance_alert_required: boolean;
  certification_review_required: boolean;
  failures: readonly OperatorFeedbackLedgerFailure[];
  integrity_hash: string;
}>;

export type OperatorFeedbackLedgerAuditEvent = Readonly<{
  audit_id: string;
  ledger_id: string;
  record_id: string;
  event_timestamp: string;
  event_type: "LEDGER_APPEND" | "REPLAY_REGISTERED" | "HISTORY_REGISTERED" | "EVIDENCE_REGISTERED" | "ADAPTATION_USAGE_REGISTERED" | "SIMULATION_USAGE_REGISTERED" | "CERTIFICATION_REGISTERED" | "INTEGRITY_VERIFIED" | "REJECTION";
  replay_identifier: string;
  operator_identifier: string;
  tenant_identifier: string;
  governance_metadata_hash: string;
  schema_version: "operator-feedback-ledger-audit/v1";
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type OperatorFeedbackLedgerApiSurface = Readonly<{
  api_id: string;
  append_record: "POST /operator-feedback-ledger/append";
  retrieve_records: "POST /operator-feedback-ledger/records";
  retrieve_replay_ledger: "POST /operator-feedback-ledger/replay-ledger";
  retrieve_approval_history: "POST /operator-feedback-ledger/approval-history";
  retrieve_override_history: "POST /operator-feedback-ledger/override-history";
  retrieve_rejection_history: "POST /operator-feedback-ledger/rejection-history";
  retrieve_evidence_history: "POST /operator-feedback-ledger/evidence-history";
  retrieve_adaptation_usage: "POST /operator-feedback-ledger/adaptation-usage";
  retrieve_simulation_usage: "POST /operator-feedback-ledger/simulation-usage";
  retrieve_certification_lineage: "POST /operator-feedback-ledger/certification-lineage";
  retrieve_integrity: "POST /operator-feedback-ledger/integrity";
  replay_ledger: "POST /operator-feedback-ledger/replay";
  retrieve_audit: "POST /operator-feedback-ledger/audit";
  retrieve_contract: "GET /operator-feedback-ledger/contract";
  append_only: true;
  update_supported: false;
  delete_supported: false;
  normalization_supported: false;
  analysis_supported: false;
  adaptive_proposal_generation_supported: false;
  production_mutation_supported: false;
  governance_action_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type OperatorFeedbackLedgerInput = Readonly<{
  scenario?: OperatorFeedbackLedgerScenario;
  correlation_result?: FeedbackEvidenceCorrelationResult;
}>;

export type OperatorFeedbackLedgerResult = Readonly<{
  operator_feedback_ledger_version: "operator-feedback-ledger/v1";
  ledger_schema_version: "operator-feedback-ledger-record/v1";
  api_surface: OperatorFeedbackLedgerApiSurface;
  correlation_result: FeedbackEvidenceCorrelationResult;
  records: readonly OperatorFeedbackLedgerRecord[];
  replay_ledger: OperatorFeedbackReplayLedgerRecord;
  approval_history: readonly OperatorFeedbackHistoryRecord[];
  override_history: readonly OperatorFeedbackHistoryRecord[];
  rejection_history: readonly OperatorFeedbackHistoryRecord[];
  evidence_history: OperatorFeedbackEvidenceHistoryRecord;
  adaptation_usage: OperatorFeedbackAdaptationUsageRecord;
  simulation_usage: OperatorFeedbackSimulationUsageRecord;
  certification_lineage: OperatorFeedbackCertificationLineageRecord;
  integrity_report: OperatorFeedbackLedgerIntegrityReport;
  audit_events: readonly OperatorFeedbackLedgerAuditEvent[];
  ledger_state: OperatorFeedbackLedgerState;
  failures: readonly OperatorFeedbackLedgerFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  append_only: true;
  immutable: true;
  tenant_isolated: boolean;
  authoritative_system_of_record: true;
  history_only: true;
  modifies_recommendations: false;
  generates_adaptive_proposals: false;
  executes_governance_actions: false;
  changes_production_behavior: false;
}>;

export type OperatorFeedbackLedgerFoundation = Readonly<{
  operator_feedback_ledger_version: "operator-feedback-ledger/v1";
  api_surface: OperatorFeedbackLedgerApiSurface;
  result: OperatorFeedbackLedgerResult;
}>;
