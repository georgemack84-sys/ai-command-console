import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";

export type RuntimeAssuranceState =
  | "INITIALIZING"
  | "COLLECTING_RUNTIME_DATA"
  | "VERIFYING_PROGRESS"
  | "VALIDATING_DEPENDENCIES"
  | "VERIFYING_CHECKPOINTS"
  | "VALIDATING_RUNTIME_STATE"
  | "MONITORING_EXECUTION"
  | "ASSESSING_HEALTH"
  | "GENERATING_EVIDENCE"
  | "ACTIVE"
  | "WARNING"
  | "DEGRADED"
  | "RECOVERY_RECOMMENDED"
  | "ESCALATION_RECOMMENDED"
  | "TERMINATION_RECOMMENDED"
  | "COMPLETED"
  | "FAILED";

export type RuntimeHealthLevel = "EXCELLENT" | "HEALTHY" | "STABLE" | "WATCH" | "DEGRADED" | "HIGH_RISK" | "CRITICAL";

export type RuntimeRecommendedAction =
  | "CONTINUE"
  | "INTENSIFY_MONITORING"
  | "RECOMMEND_RECOVERY"
  | "RECOMMEND_ESCALATION"
  | "RECOMMEND_TERMINATION"
  | "FAIL_CLOSED";

export type RuntimeAssuranceFailureReason =
  | "EXECUTION_PLAN_INVALID"
  | "PROGRESS_DIVERGENCE"
  | "SKIPPED_TASK"
  | "DUPLICATE_EXECUTION"
  | "STALLED_EXECUTION"
  | "UNRESOLVED_DEPENDENCY"
  | "INVALID_DEPENDENCY_ORDERING"
  | "CIRCULAR_DEPENDENCY"
  | "CHECKPOINT_CORRUPTION"
  | "MISSING_CHECKPOINT"
  | "REPLAY_MISMATCH"
  | "INVALID_RUNTIME_STATE"
  | "UNAUTHORIZED_STATE_MUTATION"
  | "POLICY_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "HIDDEN_EXECUTION"
  | "LINEAGE_CORRUPTION"
  | "TENANT_ISOLATION_VIOLATION"
  | "EVIDENCE_INCOMPLETE"
  | "NONDETERMINISTIC_EVALUATION"
  | "ASSURANCE_NOT_ADVISORY"
  | "INTEGRITY_HASH_MISMATCH";

export type RuntimeAssuranceScenario =
  | "BASELINE"
  | "PROGRESS_DIVERGENCE"
  | "SKIPPED_TASK"
  | "DUPLICATE_EXECUTION"
  | "STALLED_EXECUTION"
  | "UNRESOLVED_DEPENDENCY"
  | "INVALID_DEPENDENCY_ORDERING"
  | "CIRCULAR_DEPENDENCY"
  | "CHECKPOINT_CORRUPTION"
  | "MISSING_CHECKPOINT"
  | "REPLAY_MISMATCH"
  | "INVALID_RUNTIME_STATE"
  | "UNAUTHORIZED_STATE_MUTATION"
  | "POLICY_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "HIDDEN_EXECUTION"
  | "LINEAGE_CORRUPTION"
  | "TENANT_VIOLATION"
  | "EVIDENCE_INCOMPLETE"
  | "NONDETERMINISTIC_EVALUATION"
  | "NOT_ADVISORY"
  | "HASH_MISMATCH";

export type RuntimeVerificationResult = Readonly<{
  verification_id: string;
  domain: "PROGRESS" | "DEPENDENCY" | "CHECKPOINT" | "STATE" | "MONITORING" | "CONSISTENCY" | "GOVERNANCE";
  passed: boolean;
  score: number;
  findings: readonly RuntimeAssuranceFailureReason[];
  evidence_reference: string;
  verification_hash: string;
}>;

export type RuntimeHealthReport = Readonly<{
  health_report_id: string;
  execution_score: number;
  dependency_score: number;
  checkpoint_score: number;
  state_score: number;
  governance_score: number;
  replay_score: number;
  overall_score: number;
  overall_runtime_health: RuntimeHealthLevel;
  recommended_action: RuntimeRecommendedAction;
  report_hash: string;
}>;

export type ExecutionValidationReport = Readonly<{
  validation_report_id: string;
  execution_status: "VALID" | "INVALID";
  validation_outcome: "PASS" | "FAIL";
  detected_anomalies: readonly RuntimeAssuranceFailureReason[];
  dependency_verification: "PASS" | "FAIL";
  state_verification: "PASS" | "FAIL";
  integrity_verification: "PASS" | "FAIL";
  report_hash: string;
}>;

export type RuntimeAssuranceEvidence = Readonly<{
  assurance_event_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  runtime_state: RuntimeAssuranceState;
  health_score: number;
  execution_score: number;
  dependency_score: number;
  checkpoint_score: number;
  governance_score: number;
  replay_score: number;
  validation_results: readonly string[];
  detected_issues: readonly RuntimeAssuranceFailureReason[];
  recommended_action: RuntimeRecommendedAction;
  operator_required: boolean;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type RuntimeAssuranceValidationResult = Readonly<{
  validation_id: string;
  runtime_package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly RuntimeAssuranceFailureReason[];
  progress_valid: boolean;
  dependencies_valid: boolean;
  checkpoints_valid: boolean;
  runtime_state_valid: boolean;
  execution_monitoring_valid: boolean;
  consistency_valid: boolean;
  governance_valid: boolean;
  replay_ready: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  ready_for_governance_assurance: boolean;
  validation_hash: string;
}>;

export type RuntimeAssuranceReplayResult = Readonly<{
  replay_id: string;
  runtime_package_id: string;
  reconstructed_pipeline: readonly RuntimeAssuranceState[];
  reconstructed_health: RuntimeHealthLevel;
  reconstructed_action: RuntimeRecommendedAction;
  reconstructed_failures: readonly RuntimeAssuranceFailureReason[];
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: RuntimeAssuranceFailureReason | null;
  replay_hash: string;
}>;

export type RuntimeAssurancePackage = Readonly<{
  package_id: string;
  engine_version: "runtime-assurance-engine/v8E.2";
  source_assurance_record: ExecutionAssuranceRecord;
  pipeline_state: RuntimeAssuranceState;
  verification_results: readonly RuntimeVerificationResult[];
  health_report: RuntimeHealthReport;
  execution_validation_report: ExecutionValidationReport;
  assurance_evidence: RuntimeAssuranceEvidence;
  validation: RuntimeAssuranceValidationResult;
  replay: RuntimeAssuranceReplayResult;
  advisory_only: true;
  execution_modified: false;
  workflow_modified: false;
  governance_modified: false;
  authority_modified: false;
  package_hash: string;
}>;

export type RuntimeAssuranceDashboardSurface = Readonly<{
  package_id: string;
  execution_id: string;
  workflow_id: string;
  runtime_state: RuntimeAssuranceState;
  overall_runtime_health: RuntimeHealthLevel;
  recommended_action: RuntimeRecommendedAction;
  validation_state: "PASS" | "FAIL";
  detected_issues: readonly RuntimeAssuranceFailureReason[];
  operator_required: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type RuntimeAssuranceFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "runtime-assurance-engine/v8E.2";
    states: readonly RuntimeAssuranceState[];
    health_levels: readonly RuntimeHealthLevel[];
  }>;
  package: RuntimeAssurancePackage;
  dashboard: RuntimeAssuranceDashboardSurface;
}>;
