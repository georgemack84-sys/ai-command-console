import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ProductionReadinessResult } from "@/types/decision-production-readiness-assessment";

export type FinalCertificationScope =
  | "FOUNDATION_SCHEMA"
  | "DETERMINISTIC_ORCHESTRATION"
  | "REPLAY_RECONSTRUCTION"
  | "GOVERNANCE_CONSTITUTIONAL"
  | "DECISION_INTELLIGENCE"
  | "OPERATOR_WORKFLOW"
  | "LEDGER_INTEGRITY"
  | "OBSERVABILITY_DASHBOARD"
  | "SECURITY_ISOLATION_BOUNDARY"
  | "PRODUCTION_READINESS";

export type FinalCertificationCheck =
  | "COMPLETE_CERTIFICATION_SUITE"
  | "INTEGRATED_ORCHESTRATION"
  | "END_TO_END_REPLAY"
  | "REPLAY_DIVERGENCE_DETECTION"
  | "GOVERNANCE_ENFORCEMENT"
  | "CONSTITUTIONAL_COMPLIANCE"
  | "AUTHORITY_BOUNDARIES"
  | "OPERATOR_SUPREMACY"
  | "IMMUTABLE_LEDGER"
  | "EVIDENCE_LINEAGE"
  | "DASHBOARD_VISIBILITY"
  | "SECURITY_BOUNDARIES"
  | "TENANT_ISOLATION"
  | "ADVISORY_ONLY"
  | "PRODUCTION_APPROVAL";

export type FinalCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type FinalCertificationState = "PASS" | "FAIL";

export type FinalCertificationFailure =
  | "PRECEDING_CERTIFICATION_CRITICAL_FAILURE"
  | "NONDETERMINISTIC_ORCHESTRATION"
  | "REPLAY_DIVERGENCE"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "UNAUTHORIZED_EXECUTION"
  | "TENANT_LEAKAGE"
  | "CROSS_TENANT_DATA_EXPOSURE"
  | "HIDDEN_DECISION_LOGIC"
  | "HIDDEN_ORCHESTRATION_STATE"
  | "MISSING_OPERATOR_APPROVAL"
  | "MISSING_AUDIT_EVIDENCE"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "INCOMPLETE_REPLAY_LINEAGE"
  | "DASHBOARD_VISIBILITY_GAP"
  | "SECURITY_BOUNDARY_VIOLATION"
  | "PRODUCTION_READINESS_FAILURE"
  | "DOCUMENTATION_DEFICIENCY"
  | "FAIL_OPEN_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type IntegratedValidationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  complete_suite_executed: boolean;
  foundation_schema_verified: boolean;
  deterministic_orchestration_verified: boolean;
  governance_verified: boolean;
  constitutional_verified: boolean;
  authority_boundaries_enforced: boolean;
  operator_supremacy_preserved: boolean;
  ledger_integrity_verified: boolean;
  observability_complete: boolean;
  security_boundaries_enforced: boolean;
  production_readiness_approved: boolean;
  cross_phase_consistency_verified: boolean;
  validation_state: FinalCertificationState;
  integrity_hash: string;
}>;

export type FinalReplayVerificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  end_to_end_replay_verified: boolean;
  complete_reconstruction_verified: boolean;
  replay_determinism_verified: boolean;
  replay_lineage_complete: boolean;
  replay_integrity_verified: boolean;
  replay_auditability_verified: boolean;
  divergence_detection_operational: boolean;
  validation_state: FinalCertificationState;
  integrity_hash: string;
}>;

export type FinalCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  certification_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  constitutional_evidence_refs: readonly string[];
  operator_evidence_refs: readonly string[];
  ledger_evidence_refs: readonly string[];
  dashboard_evidence_refs: readonly string[];
  security_evidence_refs: readonly string[];
  production_evidence_refs: readonly string[];
  audit_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CertificationDecisionMatrix = Readonly<{
  matrix_id: string;
  tenant_id: string;
  mission_id: string;
  scopes: readonly FinalCertificationScope[];
  checks: readonly FinalCertificationCheck[];
  foundation_schema: FinalCertificationState;
  deterministic_orchestration: FinalCertificationState;
  replay_reconstruction: FinalCertificationState;
  governance_constitutional: FinalCertificationState;
  decision_intelligence: FinalCertificationState;
  operator_workflow: FinalCertificationState;
  ledger_integrity: FinalCertificationState;
  observability_dashboard: FinalCertificationState;
  security_isolation_boundary: FinalCertificationState;
  production_readiness: FinalCertificationState;
  outcome: FinalCertificationOutcome;
  integrity_hash: string;
}>;

export type FinalCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly FinalCertificationScope[];
  certified_checks: readonly FinalCertificationCheck[];
  deterministic_orchestration_assessment: FinalCertificationState;
  replay_assessment: FinalCertificationState;
  governance_assessment: FinalCertificationState;
  constitutional_assessment: FinalCertificationState;
  authority_assessment: FinalCertificationState;
  decision_intelligence_assessment: FinalCertificationState;
  operator_workflow_assessment: FinalCertificationState;
  ledger_integrity_assessment: FinalCertificationState;
  observability_assessment: FinalCertificationState;
  security_assessment: FinalCertificationState;
  production_readiness_assessment: FinalCertificationState;
  risk_summary: readonly FinalCertificationFailure[];
  failure_analysis: readonly FinalCertificationFailure[];
  final_certification_decision: FinalCertificationOutcome;
  production_approval_recommendation: "APPROVE_PRODUCTION" | "BLOCK_PRODUCTION";
  integrity_hash: string;
}>;

export type Phase9CompletionReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  phase_objectives_complete: boolean;
  capability_summary_complete: boolean;
  architecture_summary_complete: boolean;
  certification_summary_complete: boolean;
  deliverables_completed: boolean;
  validation_coverage_percent: number;
  remaining_risks: readonly FinalCertificationFailure[];
  lessons_learned_recorded: boolean;
  production_approval_status: "APPROVED" | "BLOCKED";
  next_phase_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type ProductionApprovalDecision = Readonly<{
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  certification_outcome: FinalCertificationOutcome;
  production_approval_status: "APPROVED" | "BLOCKED";
  outstanding_conditions: readonly string[];
  required_corrective_actions: readonly string[];
  approval_authority: "MISSION_CONTROL_CERTIFICATION_AUTHORITY";
  approval_timestamp: string;
  certification_hash: string;
  ledger_reference: string;
  integrity_hash: string;
}>;

export type FinalCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "SUITE_EXECUTED" | "REPLAY_VERIFIED" | "GOVERNANCE_VERIFIED" | "SECURITY_VERIFIED" | "PRODUCTION_READINESS_VERIFIED" | "FINAL_CERTIFIED" | "FINAL_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: FinalCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type FinalCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  complete_suite_passed: boolean;
  deterministic: boolean;
  replay_reproducible: boolean;
  governance_enforced: boolean;
  constitutional_compliant: boolean;
  authority_bound: boolean;
  operator_supremacy_preserved: boolean;
  ledger_immutable: boolean;
  evidence_complete: boolean;
  dashboard_visible: boolean;
  security_boundaries_valid: boolean;
  production_ready: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly FinalCertificationFailure[];
  integrity_hash: string;
}>;

export type FinalOrchestratorCertificationInput = Readonly<{
  production_readiness?: ProductionReadinessResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "PRODUCTION_INVALID"
    | "NONDETERMINISTIC"
    | "REPLAY_DIVERGENCE"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "GOVERNANCE_BYPASS"
    | "CONSTITUTIONAL_VIOLATION"
    | "AUTHORITY_VIOLATION"
    | "UNAUTHORIZED_EXECUTION"
    | "TENANT_LEAKAGE"
    | "CROSS_TENANT_DATA"
    | "HIDDEN_DECISION_LOGIC"
    | "HIDDEN_ORCHESTRATION_STATE"
    | "MISSING_OPERATOR_APPROVAL"
    | "MISSING_AUDIT"
    | "LEDGER_MUTATION"
    | "HASH_MISMATCH"
    | "INCOMPLETE_REPLAY_LINEAGE"
    | "DASHBOARD_GAP"
    | "SECURITY_BOUNDARY_VIOLATION"
    | "DOCUMENTATION_DEFICIENCY"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type FinalOrchestratorCertificationResult = Readonly<{
  certification_version: "decision-final-orchestrator-certification/v1";
  production_readiness: ProductionReadinessResult;
  integrated_validation_report: IntegratedValidationReport;
  final_replay_report: FinalReplayVerificationReport;
  evidence_package: FinalCertificationEvidencePackage;
  decision_matrix: CertificationDecisionMatrix;
  final_report: FinalCertificationReport;
  phase_9_completion_report: Phase9CompletionReport;
  production_approval_decision: ProductionApprovalDecision;
  final_ledger: readonly FinalCertificationLedgerEntry[];
  validation: FinalCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  production_approved: boolean;
  phase_9_complete: boolean;
  mutates_production_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type FinalOrchestratorCertificationFoundation = Readonly<{
  certification_version: "decision-final-orchestrator-certification/v1";
  scopes: readonly FinalCertificationScope[];
  checks: readonly FinalCertificationCheck[];
  result: FinalOrchestratorCertificationResult;
}>;
