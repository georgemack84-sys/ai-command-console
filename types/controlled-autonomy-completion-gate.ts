import type { FinalAutonomyCertificationReport } from "@/types/final-autonomy-certification-gate";

export type ControlledAutonomyCompletionDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CompletionValidationStatus = "PASS" | "FAIL";
export type CompletionSeverity = "NONE" | "LOW" | "HIGH" | "CRITICAL";

export type CompletionMatrixCategory =
  | "Controlled Autonomy"
  | "Planning Engine"
  | "Execution Orchestration"
  | "Delegation Intelligence"
  | "Runtime Supervision"
  | "Boundary Enforcement"
  | "Governance Integration"
  | "Constitutional Compliance"
  | "Authority Enforcement"
  | "Replay Determinism"
  | "Replay Reproducibility"
  | "Integrity Verification"
  | "Visibility"
  | "Query Services"
  | "Replay Viewer"
  | "Planning Graph"
  | "Delegation Graph"
  | "Supervision Timeline"
  | "Tamper Detection"
  | "Certification Suite"
  | "Tenant Isolation";

export type ControlledAutonomyCompletionScenario =
  | "BASELINE"
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_UI_IMPROVEMENT"
  | "PERFORMANCE_OPTIMIZATION"
  | "GOVERNANCE_BYPASS"
  | "GOVERNANCE_POLICY_IGNORED"
  | "UNAUTHORIZED_GOVERNANCE_MODIFICATION"
  | "GOVERNANCE_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_VIOLATION"
  | "CONSTITUTIONAL_CONSTRAINT_IGNORED"
  | "CONSTITUTIONAL_OVERRIDE_ATTEMPTED"
  | "CONSTITUTIONAL_REPLAY_MISMATCH"
  | "AUTHORITY_ESCALATION"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_DELEGATION"
  | "UNAUTHORIZED_EXECUTION"
  | "NONDETERMINISTIC_PLANNING"
  | "INCONSISTENT_PLANNING_RESULTS"
  | "PLANNING_REPLAY_MISMATCH"
  | "PLANNING_GRAPH_CORRUPTION"
  | "HIDDEN_EXECUTION"
  | "EXECUTION_OUTSIDE_GOVERNANCE"
  | "UNAUTHORIZED_WORKFLOW_EXECUTION"
  | "ROLLBACK_FAILURE"
  | "RUNTIME_SUPERVISION_FAILURE"
  | "DRIFT_UNDETECTED"
  | "POLICY_VIOLATION_UNDETECTED"
  | "INTERVENTION_UNAVAILABLE"
  | "REPLAY_MISMATCH"
  | "INCOMPLETE_REPLAY"
  | "REPLAY_CORRUPTION"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "TAMPERING_DETECTED"
  | "HASH_MISMATCH"
  | "CORRUPTED_AUTONOMY_HISTORY"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "HIDDEN_PLANNING"
  | "HIDDEN_DELEGATION"
  | "HIDDEN_SUPERVISION"
  | "HIDDEN_GOVERNANCE_DECISIONS"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_EXECUTION"
  | "CROSS_TENANT_REPLAY"
  | "CROSS_TENANT_VISIBILITY"
  | "CERTIFICATION_SUITE_FAILS"
  | "DETERMINISTIC_CERTIFICATION_FAILS"
  | "GOVERNANCE_CERTIFICATION_FAILS"
  | "REPLAY_CERTIFICATION_FAILS"
  | "INTEGRITY_CERTIFICATION_FAILS";

export type ControlledAutonomyCompletionFailure =
  | "MINOR_DOCUMENTATION_GAP"
  | "MINOR_UI_IMPROVEMENT"
  | "PERFORMANCE_OPTIMIZATION_REMAINING"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "GOVERNANCE_POLICIES_IGNORED"
  | "UNAUTHORIZED_GOVERNANCE_MODIFICATION"
  | "GOVERNANCE_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "CONSTITUTIONAL_CONSTRAINT_IGNORED"
  | "CONSTITUTIONAL_OVERRIDE_ATTEMPTED"
  | "CONSTITUTIONAL_REPLAY_MISMATCH"
  | "AUTHORITY_ESCALATION_OCCURRED"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "UNAUTHORIZED_DELEGATION"
  | "UNAUTHORIZED_EXECUTION"
  | "NONDETERMINISTIC_PLANNING_DETECTED"
  | "INCONSISTENT_PLANNING_RESULTS"
  | "PLANNING_REPLAY_MISMATCH"
  | "PLANNING_GRAPH_CORRUPTION"
  | "HIDDEN_EXECUTION_DISCOVERED"
  | "EXECUTION_OUTSIDE_GOVERNANCE"
  | "UNAUTHORIZED_WORKFLOW_EXECUTION"
  | "ROLLBACK_FAILURE"
  | "RUNTIME_SUPERVISION_FAILURE"
  | "DRIFT_UNDETECTED"
  | "POLICY_VIOLATION_UNDETECTED"
  | "INTERVENTION_UNAVAILABLE"
  | "REPLAY_MISMATCH_EXISTS"
  | "INCOMPLETE_REPLAY"
  | "REPLAY_CORRUPTION"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TAMPERING_DETECTED"
  | "HASH_MISMATCH"
  | "CORRUPTED_AUTONOMY_HISTORY"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "HIDDEN_PLANNING"
  | "HIDDEN_DELEGATION"
  | "HIDDEN_SUPERVISION"
  | "HIDDEN_GOVERNANCE_DECISIONS"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_EXECUTION"
  | "CROSS_TENANT_REPLAY"
  | "CROSS_TENANT_VISIBILITY"
  | "CERTIFICATION_SUITE_FAILED"
  | "DETERMINISTIC_CERTIFICATION_FAILED"
  | "GOVERNANCE_CERTIFICATION_FAILED"
  | "REPLAY_CERTIFICATION_FAILED"
  | "INTEGRITY_CERTIFICATION_FAILED";

export type CompletionMatrixRecord = Readonly<{
  matrix_id: string;
  category: CompletionMatrixCategory;
  validation: CompletionValidationStatus;
  score: number;
  failure_reason: ControlledAutonomyCompletionFailure | null;
  evidence_refs: readonly string[];
  matrix_hash: string;
}>;

export type CompletionEvidenceRecord = Readonly<{
  evidence_id: string;
  source: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  immutable: boolean;
  evidence_hash: string;
}>;

export type CompletionReadinessAssessment = Readonly<{
  assessment_id: string;
  production_ready: boolean;
  phase_9_authorized: boolean;
  allowed_operations: readonly string[];
  prohibited_operations: readonly string[];
  assessment_hash: string;
}>;

export type ControlledAutonomyCompletionReport = Readonly<{
  completion_id: string;
  phase: "8L";
  completion_version: "controlled-autonomy-completion-gate/v8L";
  tenant_id: string;
  mission_id: string;
  completion_state: ControlledAutonomyCompletionDecision;
  production_ready: boolean;
  phase_9_authorized: boolean;
  final_autonomy_certification: FinalAutonomyCertificationReport;
  validation_matrix: readonly CompletionMatrixRecord[];
  completion_score: number;
  detected_failures: readonly ControlledAutonomyCompletionFailure[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  operator_required: boolean;
  production_readiness_assessment: CompletionReadinessAssessment;
  completion_evidence: readonly CompletionEvidenceRecord[];
  deliverables: readonly string[];
  completion_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  report_hash: string;
}>;

export type ControlledAutonomyCompletionInput = Readonly<{
  scenario?: ControlledAutonomyCompletionScenario;
}>;

export type ControlledAutonomyCompletionValidationResult = Readonly<{
  completion_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  evidence_complete: boolean;
  phase_9_authorized: boolean;
  failures: readonly ControlledAutonomyCompletionFailure[];
  validation_hash: string;
}>;

export type ControlledAutonomyCompletionObservabilitySurface = Readonly<{
  completion_id: string;
  completion_state: ControlledAutonomyCompletionDecision;
  completion_score: number;
  matrix_items: number;
  failed_items: number;
  failures: readonly ControlledAutonomyCompletionFailure[];
  risks: readonly string[];
  production_ready: boolean;
  phase_9_authorized: boolean;
  operator_required: boolean;
  report_hash: string;
}>;
