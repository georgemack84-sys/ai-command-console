import type { DriftDefenseArchitectureResult, DriftSeverity } from "@/types/drift-defense-architecture";
import type { DriftResponseResult } from "@/types/drift-response-containment-engine";

export type DriftLedgerStatus = "COMMITTED" | "REJECTED" | "FAIL_CLOSED";

export type DriftLedgerFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "INCOMPLETE_RECORD"
  | "INVALID_EVIDENCE_LINEAGE"
  | "MISSING_EVIDENCE"
  | "INVALID_REPLAY_REFERENCES"
  | "TENANT_OWNERSHIP_VIOLATION"
  | "INTEGRITY_FAILURE"
  | "LEDGER_TAMPERING"
  | "RECORD_CORRUPTION"
  | "MISSING_LINEAGE"
  | "REPLAY_INCONSISTENCY"
  | "UNAUTHORIZED_MODIFICATION"
  | "NONDETERMINISTIC_LEDGER_RECORDING"
  | "NONREPLAYABLE_LEDGER_EVIDENCE"
  | "UNKNOWN_LEDGER_BEHAVIOR";

export type DriftLedgerScenario =
  | "BASELINE"
  | "INCOMPLETE_RECORD"
  | "INVALID_LINEAGE"
  | "MISSING_EVIDENCE"
  | "INVALID_REPLAY_REFERENCES"
  | "TENANT_VIOLATION"
  | "INTEGRITY_FAILURE"
  | "LEDGER_TAMPERING"
  | "RECORD_CORRUPTION"
  | "MISSING_LINEAGE"
  | "REPLAY_INCONSISTENCY"
  | "UNAUTHORIZED_MODIFICATION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "UNKNOWN_BEHAVIOR";

export type AdaptiveDriftType =
  | "STRATEGIC_DRIFT"
  | "CONFIDENCE_DRIFT"
  | "RISK_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "AUTHORITY_DRIFT"
  | "OPERATOR_FEEDBACK_DRIFT"
  | "EVIDENCE_DRIFT"
  | "TENANT_ISOLATION_DRIFT"
  | "OPTIMIZATION_DRIFT"
  | "REPLAY_DRIFT";

export type DriftLedgerSchema = Readonly<{
  schema_id: string;
  schema_version: string;
  supported_drift_types: readonly AdaptiveDriftType[];
  required_fields: readonly string[];
  validation_rules: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  replay_requirements: readonly string[];
  certification_requirements: readonly string[];
  approval_reference: string;
  integrity_hash: string;
}>;

export type AdaptiveDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  mission_scope: string;
  drift_type: AdaptiveDriftType;
  detected_source: string;
  affected_adaptation_refs: readonly string[];
  affected_decision_refs: readonly string[];
  severity: DriftSeverity;
  confidence_score: number;
  governance_impact: string;
  constitutional_impact: string;
  recommended_response: string;
  containment_required: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DriftRecordValidationReport = Readonly<{
  report_id: string;
  valid: boolean;
  rejected: boolean;
  required_fields_complete: boolean;
  field_consistency_valid: boolean;
  tenant_ownership_valid: boolean;
  evidence_complete: boolean;
  replay_references_valid: boolean;
  governance_references_valid: boolean;
  certification_references_valid: boolean;
  integrity_hashes_valid: boolean;
  rejection_reasons: readonly DriftLedgerFailure[];
  record_integrity_assessment: string;
  integrity_hash: string;
}>;

export type EvidenceLineageRecord = Readonly<{
  lineage_id: string;
  originating_evidence: readonly string[];
  supporting_evidence: readonly string[];
  evidence_relationships: readonly string[];
  evidence_versions: readonly string[];
  evidence_validation: readonly string[];
  evidence_provenance: readonly string[];
  evidence_history: readonly string[];
  lineage_complete: boolean;
  integrity_hash: string;
}>;

export type ReplayReferenceRecord = Readonly<{
  replay_reference_id: string;
  replay_identifiers: readonly string[];
  replay_timelines: readonly string[];
  replay_snapshots: readonly string[];
  replay_artifacts: readonly string[];
  replay_validations: readonly string[];
  replay_dependencies: readonly string[];
  replay_certifications: readonly string[];
  deterministic_reconstruction_supported: boolean;
  integrity_hash: string;
}>;

export type GovernanceDecisionHistory = Readonly<{
  governance_history_id: string;
  governance_reviews: readonly string[];
  constitutional_reviews: readonly string[];
  approval_decisions: readonly string[];
  escalation_decisions: readonly string[];
  containment_approvals: readonly string[];
  policy_evaluations: readonly string[];
  authority_validations: readonly string[];
  governance_rationale: readonly string[];
  integrity_hash: string;
}>;

export type CertificationHistory = Readonly<{
  certification_history_id: string;
  certification_requests: readonly string[];
  certification_outcomes: readonly string[];
  certification_evidence: readonly string[];
  certification_reviewers: readonly string[];
  certification_timelines: readonly string[];
  certification_dependencies: readonly string[];
  certification_recommendations: readonly string[];
  integrity_hash: string;
}>;

export type RollbackHistory = Readonly<{
  rollback_history_id: string;
  rollback_requests: readonly string[];
  rollback_approvals: readonly string[];
  rollback_execution: readonly string[];
  rollback_verification: readonly string[];
  restored_baseline: string;
  replay_validation: readonly string[];
  operator_approvals: readonly string[];
  recovery_completion: readonly string[];
  integrity_hash: string;
}>;

export type DriftTimeline = Readonly<{
  timeline_id: string;
  drift_detection: readonly string[];
  evidence_collection: readonly string[];
  replay_validation: readonly string[];
  simulations_performed: readonly string[];
  containment_actions: readonly string[];
  operator_reviews: readonly string[];
  governance_reviews: readonly string[];
  certification_decisions: readonly string[];
  rollback_actions: readonly string[];
  final_disposition: string;
  integrity_hash: string;
}>;

export type LedgerIntegrityReport = Readonly<{
  report_id: string;
  hash_integrity_valid: boolean;
  append_only_valid: boolean;
  replay_consistency_valid: boolean;
  lineage_complete: boolean;
  tenant_isolation_valid: boolean;
  governance_references_valid: boolean;
  certification_references_valid: boolean;
  rollback_references_valid: boolean;
  detected_integrity_failures: readonly DriftLedgerFailure[];
  ledger_health_assessment: string;
  integrity_hash: string;
}>;

export type DriftDefenseLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence_number: number;
  previous_entry_hash: string;
  adaptive_drift_record_hash: string;
  evidence_lineage_hash: string;
  replay_reference_hash: string;
  governance_history_hash: string;
  certification_history_hash: string;
  rollback_history_hash: string;
  timeline_hash: string;
  integrity_report_hash: string;
  committed: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type DriftDefenseLedgerMetrics = Readonly<{
  committed: boolean;
  append_only: boolean;
  immutable: boolean;
  deterministic_recording: boolean;
  replayable_recording: boolean;
  tenant_isolated: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  failures: readonly DriftLedgerFailure[];
  integrity_hash: string;
}>;

export type DriftDefenseLedgerApiSurface = Readonly<{
  api_id: string;
  record_drift_event: "POST /drift-defense-ledger/record";
  retrieve_schema: "POST /drift-defense-ledger/schema";
  retrieve_validation: "POST /drift-defense-ledger/validation";
  retrieve_adaptive_record: "POST /drift-defense-ledger/adaptive-record";
  retrieve_evidence_lineage: "POST /drift-defense-ledger/evidence-lineage";
  retrieve_replay_refs: "POST /drift-defense-ledger/replay-refs";
  retrieve_governance_history: "POST /drift-defense-ledger/governance";
  retrieve_certification_history: "POST /drift-defense-ledger/certification";
  retrieve_rollback_history: "POST /drift-defense-ledger/rollback";
  retrieve_timeline: "POST /drift-defense-ledger/timeline";
  retrieve_integrity: "POST /drift-defense-ledger/integrity";
  retrieve_ledger_entry: "POST /drift-defense-ledger/ledger";
  retrieve_metrics: "POST /drift-defense-ledger/metrics";
  replay_ledger: "POST /drift-defense-ledger/replay";
  inspect_ledger: "POST /drift-defense-ledger/inspect";
  retrieve_contract: "GET /drift-defense-ledger/contract";
  mutation_supported: false;
  deletion_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type DriftDefenseLedgerInput = Readonly<{
  scenario?: DriftLedgerScenario;
  tenant_id?: string;
  drift_type?: AdaptiveDriftType;
  architecture_result?: DriftDefenseArchitectureResult;
  response_result?: DriftResponseResult;
}>;

export type DriftDefenseLedgerResult = Readonly<{
  drift_defense_ledger_version: "drift-defense-ledger/v1";
  ledger_identifier: "DriftDefenseLedger";
  status: DriftLedgerStatus;
  api_surface: DriftDefenseLedgerApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  response_result: DriftResponseResult;
  schema: DriftLedgerSchema;
  adaptive_drift_record: AdaptiveDriftRecord;
  validation_report: DriftRecordValidationReport;
  evidence_lineage: EvidenceLineageRecord;
  replay_references: ReplayReferenceRecord;
  governance_history: GovernanceDecisionHistory;
  certification_history: CertificationHistory;
  rollback_history: RollbackHistory;
  timeline: DriftTimeline;
  integrity_report: LedgerIntegrityReport;
  ledger_entry: DriftDefenseLedgerEntry;
  metrics: DriftDefenseLedgerMetrics;
  failures: readonly DriftLedgerFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  append_only: true;
  immutable: true;
  mutates_existing_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DriftDefenseLedgerFoundation = Readonly<{
  drift_defense_ledger_version: "drift-defense-ledger/v1";
  api_surface: DriftDefenseLedgerApiSurface;
  result: DriftDefenseLedgerResult;
}>;
