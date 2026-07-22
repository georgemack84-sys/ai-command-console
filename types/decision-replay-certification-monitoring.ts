import type { GovernanceAuthorityVisibilityResult } from "@/types/decision-governance-authority-visibility";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type ReplayMonitoringState = "NOT_AVAILABLE" | "REGISTERED" | "READY" | "EXECUTING" | "VALIDATING" | "VERIFIED" | "FAILED" | "ARCHIVED";
export type ReplayIntegrityState = "UNKNOWN" | "PENDING" | "VERIFIED" | "FAILED" | "DIVERGED";
export type CertificationMonitoringState = "NOT_STARTED" | "IN_PROGRESS" | "VALIDATING" | "CONDITIONAL_PASS" | "PASS" | "FAIL" | "ARCHIVED";
export type DivergenceState = "NONE" | "DETECTED" | "INVESTIGATING" | "CONFIRMED" | "RESOLVED" | "ARCHIVED";
export type DivergenceSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type DivergenceType = "REPLAY_MISMATCH" | "TIMELINE_DIVERGENCE" | "DEPENDENCY_DIVERGENCE" | "GOVERNANCE_DIVERGENCE" | "AUTHORITY_DIVERGENCE" | "RECOMMENDATION_DIVERGENCE" | "INTEGRITY_FAILURE" | "CERTIFICATION_DIVERGENCE";

export type ReplayCertificationMonitoringFailure =
  | "REPLAY_READINESS_INACCURATE"
  | "REPLAY_EXECUTION_STATUS_HIDDEN"
  | "REPLAY_INTEGRITY_RESULTS_INCOMPLETE"
  | "CERTIFICATION_PROGRESS_OMITTED"
  | "DIVERGENCE_EVENTS_SUPPRESSED"
  | "REPLAY_MONITORING_NONDETERMINISTIC"
  | "CERTIFICATION_ENGINE_MISMATCH"
  | "REPLAY_EVIDENCE_MUTABLE"
  | "CERTIFICATION_EVIDENCE_MUTABLE"
  | "REPLAY_REFERENCES_MISSING"
  | "CROSS_TENANT_REPLAY_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_MONITORING_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type ReplayDashboard = Readonly<{
  replay_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  replay_state: ReplayMonitoringState;
  replay_progress: number;
  replay_history: readonly string[];
  replay_health: "HEALTHY" | "DEGRADED" | "FAILED";
  replay_dependencies: readonly string[];
  integrity_status: ReplayIntegrityState;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayStatusMonitor = Readonly<{
  monitor_id: string;
  tenant_id: string;
  mission_id: string;
  replay_queue: readonly string[];
  replay_execution: readonly string[];
  replay_latency: Readonly<{ average_ms: number; p95_ms: number; max_ms: number }>;
  replay_failures: readonly string[];
  replay_success_rate: number;
  backlog_size: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayIntegrityDashboard = Readonly<{
  integrity_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  integrity_state: ReplayIntegrityState;
  validation_results: readonly string[];
  hash_results: readonly string[];
  lineage_results: readonly string[];
  reconstruction_results: readonly string[];
  audit_complete: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type CertificationDashboard = Readonly<{
  certification_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  certification_state: CertificationMonitoringState;
  completed_tests: readonly string[];
  pending_tests: readonly string[];
  failed_tests: readonly string[];
  production_readiness: "READY" | "CONDITIONAL" | "BLOCKED";
  certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayDivergence = Readonly<{
  divergence_id: string;
  tenant_id: string;
  mission_id: string;
  divergence_type: DivergenceType;
  divergence_state: DivergenceState;
  severity: DivergenceSeverity;
  original_reference: string;
  replay_reference: string;
  comparison_results: readonly string[];
  governance_impact: "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  certification_impact: "NONE" | "CONDITIONAL" | "BLOCKING";
  integrity_hash: string;
}>;

export type ReplayMonitoringLedgerEntry = Readonly<{
  replay_monitoring_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  event_type:
    | "REPLAY_REGISTERED"
    | "REPLAY_STARTED"
    | "REPLAY_COMPLETED"
    | "REPLAY_VERIFIED"
    | "REPLAY_FAILED"
    | "INTEGRITY_VERIFIED"
    | "DIVERGENCE_DETECTED"
    | "DIVERGENCE_RESOLVED"
    | "CERTIFICATION_STARTED"
    | "CERTIFICATION_COMPLETED"
    | "CERTIFICATION_FAILED"
    | "PRODUCTION_READINESS_VERIFIED";
  replay_state: ReplayMonitoringState;
  integrity_state: ReplayIntegrityState;
  certification_state: CertificationMonitoringState;
  divergence_state: DivergenceState;
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayHealthRecord = Readonly<{
  replay_health_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id: string;
  replay_state: ReplayMonitoringState;
  integrity_state: ReplayIntegrityState;
  divergence_state: DivergenceState;
  certification_state: CertificationMonitoringState;
  latency: number;
  completion_percentage: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayMonitoringRecord = Readonly<{
  monitoring_id: string;
  tenant_id: string;
  mission_id: string;
  replay_dashboard_ref: string;
  replay_status_monitor_ref: string;
  integrity_dashboard_ref: string;
  certification_dashboard_ref: string;
  divergence_monitor_refs: readonly string[];
  replay_ledger_refs: readonly string[];
  health_record_refs: readonly string[];
  replay_ref: string;
  certification_ref: string;
  integrity_hash: string;
}>;

export type ReplayCertificationMonitoringValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  replay_readiness_accurate: boolean;
  replay_execution_visible: boolean;
  replay_integrity_complete: boolean;
  certification_progress_visible: boolean;
  divergence_events_visible: boolean;
  deterministic_monitoring: boolean;
  certification_engine_consistent: boolean;
  replay_evidence_immutable: boolean;
  certification_evidence_immutable: boolean;
  replay_refs_present: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly ReplayCertificationMonitoringFailure[];
  integrity_hash: string;
}>;

export type ReplayCertificationMonitoringInput = Readonly<{
  governance_visibility?: GovernanceAuthorityVisibilityResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "BAD_REPLAY_READINESS"
    | "HIDE_REPLAY_EXECUTION"
    | "INCOMPLETE_INTEGRITY_RESULTS"
    | "OMIT_CERTIFICATION_PROGRESS"
    | "SUPPRESS_DIVERGENCE"
    | "NONDETERMINISTIC_MONITORING"
    | "CERTIFICATION_ENGINE_MISMATCH"
    | "MUTABLE_REPLAY_EVIDENCE"
    | "MUTABLE_CERTIFICATION_EVIDENCE"
    | "MISSING_REPLAY_REFS"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ReplayCertificationMonitoringResult = Readonly<{
  monitoring_version: "decision-replay-certification-monitoring/v1";
  governance_visibility: GovernanceAuthorityVisibilityResult;
  replay_dashboard: ReplayDashboard;
  replay_status_monitor: ReplayStatusMonitor;
  replay_integrity_dashboard: ReplayIntegrityDashboard;
  certification_dashboard: CertificationDashboard;
  divergence_monitor: readonly ReplayDivergence[];
  replay_monitoring_ledger: readonly ReplayMonitoringLedgerEntry[];
  health_records: readonly ReplayHealthRecord[];
  monitoring_record: ReplayMonitoringRecord;
  validation: ReplayCertificationMonitoringValidation;
  deterministic: true;
  advisory_only: true;
  mutates_replay_or_certification: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReplayCertificationMonitoringFoundation = Readonly<{
  monitoring_version: "decision-replay-certification-monitoring/v1";
  replay_states: readonly ReplayMonitoringState[];
  integrity_states: readonly ReplayIntegrityState[];
  certification_states: readonly CertificationMonitoringState[];
  divergence_states: readonly DivergenceState[];
  divergence_severities: readonly DivergenceSeverity[];
  result: ReplayCertificationMonitoringResult;
}>;
