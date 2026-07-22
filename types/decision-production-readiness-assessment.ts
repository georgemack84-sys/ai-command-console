import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { SecurityBoundaryCertificationResult } from "@/types/decision-security-isolation-boundary-certification";

export type ProductionReadinessDomain =
  | "PERFORMANCE"
  | "SCALABILITY"
  | "RELIABILITY"
  | "EXPLAINABILITY"
  | "REPLAY"
  | "GOVERNANCE"
  | "OPERATIONS"
  | "MONITORING"
  | "DISASTER_RECOVERY";

export type ProductionReadinessCheck =
  | "PERFORMANCE_OBJECTIVES"
  | "ORCHESTRATION_LATENCY"
  | "SCALABILITY_DETERMINISM"
  | "CONCURRENT_WORKLOADS"
  | "RUNTIME_STABILITY"
  | "RECOMMENDATION_EXPLAINABILITY"
  | "REPLAY_RECONSTRUCTION"
  | "GOVERNANCE_ENFORCEMENT"
  | "TENANT_ISOLATION"
  | "ADVISORY_ONLY"
  | "OPERATIONAL_PROCEDURES"
  | "MONITORING_COVERAGE"
  | "DISASTER_RECOVERY"
  | "INTEGRITY_VERIFICATION";

export type ProductionReadinessState = "PASS" | "FAIL";

export type ProductionReadinessFailure =
  | "SECURITY_CERTIFICATION_INVALID"
  | "PERFORMANCE_OBJECTIVES_NOT_ACHIEVED"
  | "ORCHESTRATION_LATENCY_UNACCEPTABLE"
  | "SCALABILITY_NONDETERMINISM"
  | "CONCURRENT_WORKLOAD_LIMITATION"
  | "RUNTIME_INSTABILITY"
  | "RELIABILITY_FAILURE"
  | "MISSING_RECOMMENDATION_EXPLANATIONS"
  | "REPLAY_NOT_PRODUCTION_READY"
  | "REPLAY_INCONSISTENCY"
  | "GOVERNANCE_ENFORCEMENT_INCOMPLETE"
  | "CONSTITUTIONAL_ENFORCEMENT_INCOMPLETE"
  | "AUTHORITY_VALIDATION_FAILURE"
  | "TENANT_ISOLATION_FAILURE"
  | "ADVISORY_ONLY_FAILURE"
  | "MONITORING_GAPS"
  | "MISSING_OPERATIONAL_PROCEDURES"
  | "DISASTER_RECOVERY_NOT_VALIDATED"
  | "BACKUP_FAILURE"
  | "RECOVERY_FAILURE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "HIDDEN_OPERATIONAL_DEPENDENCY"
  | "FAIL_OPEN_OPERATIONAL_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type PerformanceReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  orchestration_latency_ms: number;
  context_construction_ms: number;
  graph_generation_ms: number;
  arbitration_ms: number;
  priority_scoring_ms: number;
  package_generation_ms: number;
  replay_execution_ms: number;
  dashboard_response_ms: number;
  throughput_per_minute: number;
  resource_utilization_percent: number;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type ScalabilityReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  concurrent_orchestrations_supported: number;
  large_workload_supported: boolean;
  evidence_volume_supported: boolean;
  multi_mission_supported: boolean;
  multi_tenant_supported: boolean;
  dashboard_scalability_verified: boolean;
  replay_scalability_verified: boolean;
  ledger_growth_handling_verified: boolean;
  deterministic_under_load: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type ReliabilityReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  runtime_stability_verified: boolean;
  error_recovery_verified: boolean;
  service_continuity_verified: boolean;
  workflow_completion_verified: boolean;
  replay_reliability_verified: boolean;
  ledger_reliability_verified: boolean;
  dashboard_availability_verified: boolean;
  operational_consistency_verified: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type ExplainabilityReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_rationale_complete: boolean;
  evidence_traceability_complete: boolean;
  dependency_explanations_complete: boolean;
  conflict_explanations_complete: boolean;
  priority_explanations_complete: boolean;
  governance_explanations_complete: boolean;
  constitutional_explanations_complete: boolean;
  operator_summaries_complete: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type MonitoringReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  health_monitoring_complete: boolean;
  dashboard_monitoring_complete: boolean;
  alerting_operational: boolean;
  logging_integrity_verified: boolean;
  metrics_collection_complete: boolean;
  replay_monitoring_complete: boolean;
  governance_monitoring_complete: boolean;
  performance_monitoring_complete: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type DisasterRecoveryReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  backup_validation_complete: boolean;
  recovery_procedures_tested: boolean;
  ledger_recovery_verified: boolean;
  replay_recovery_verified: boolean;
  configuration_recovery_verified: boolean;
  certification_recovery_verified: boolean;
  recovery_documentation_complete: boolean;
  recovery_replay_reproducible: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type ProductionReadinessChecklist = Readonly<{
  checklist_id: string;
  tenant_id: string;
  mission_id: string;
  all_phase_9_certifications_complete: boolean;
  deterministic_orchestration_verified: boolean;
  replay_certification_passed: boolean;
  governance_certification_passed: boolean;
  decision_intelligence_certification_passed: boolean;
  operator_workflow_certification_passed: boolean;
  ledger_certification_passed: boolean;
  observability_certification_passed: boolean;
  security_certification_passed: boolean;
  production_documentation_complete: boolean;
  operational_procedures_approved: boolean;
  hidden_dependencies_absent: boolean;
  validation_state: ProductionReadinessState;
  integrity_hash: string;
}>;

export type ProductionReadinessEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  performance_evidence_refs: readonly string[];
  scalability_evidence_refs: readonly string[];
  reliability_evidence_refs: readonly string[];
  explainability_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  monitoring_evidence_refs: readonly string[];
  recovery_evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  operational_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ProductionReadinessScorecard = Readonly<{
  scorecard_id: string;
  tenant_id: string;
  mission_id: string;
  performance_readiness: ProductionReadinessState;
  scalability_readiness: ProductionReadinessState;
  reliability_readiness: ProductionReadinessState;
  explainability_readiness: ProductionReadinessState;
  replay_readiness: ProductionReadinessState;
  governance_readiness: ProductionReadinessState;
  operational_readiness: ProductionReadinessState;
  monitoring_readiness: ProductionReadinessState;
  disaster_recovery_readiness: ProductionReadinessState;
  overall_score: number;
  outstanding_risks: readonly ProductionReadinessFailure[];
  final_recommendation: "APPROVE_CONTROLLED_PRODUCTION" | "BLOCK_PRODUCTION";
  integrity_hash: string;
}>;

export type OperationalReadinessReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly ProductionReadinessDomain[];
  certified_checks: readonly ProductionReadinessCheck[];
  performance_assessment: ProductionReadinessState;
  scalability_assessment: ProductionReadinessState;
  reliability_assessment: ProductionReadinessState;
  explainability_assessment: ProductionReadinessState;
  replay_readiness_assessment: ProductionReadinessState;
  governance_readiness_assessment: ProductionReadinessState;
  operational_procedures_assessment: ProductionReadinessState;
  monitoring_assessment: ProductionReadinessState;
  disaster_recovery_assessment: ProductionReadinessState;
  integrity_verification: ProductionReadinessState;
  risk_assessment: readonly ProductionReadinessFailure[];
  certification_decision: ProductionReadinessState;
  production_approval_recommendation: "APPROVE_CONTROLLED_PRODUCTION" | "BLOCK_PRODUCTION";
  integrity_hash: string;
}>;

export type ProductionReadinessLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "PERFORMANCE_VALIDATED" | "SCALABILITY_VALIDATED" | "RELIABILITY_VALIDATED" | "MONITORING_VALIDATED" | "RECOVERY_VALIDATED" | "READINESS_CERTIFIED" | "READINESS_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: ProductionReadinessState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ProductionReadinessValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  security_certification_valid: boolean;
  performance_ready: boolean;
  scalability_ready: boolean;
  reliability_ready: boolean;
  explainability_ready: boolean;
  replay_ready: boolean;
  governance_ready: boolean;
  operational_ready: boolean;
  monitoring_ready: boolean;
  disaster_recovery_ready: boolean;
  backup_validated: boolean;
  recovery_validated: boolean;
  integrity_verified: boolean;
  hidden_dependencies_absent: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly ProductionReadinessFailure[];
  integrity_hash: string;
}>;

export type ProductionReadinessInput = Readonly<{
  security_certification?: SecurityBoundaryCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "SECURITY_INVALID"
    | "PERFORMANCE_MISS"
    | "LATENCY_UNACCEPTABLE"
    | "SCALABILITY_NONDETERMINISM"
    | "CONCURRENT_LIMIT"
    | "RUNTIME_INSTABILITY"
    | "RELIABILITY_FAILURE"
    | "MISSING_EXPLANATIONS"
    | "REPLAY_NOT_READY"
    | "REPLAY_INCONSISTENCY"
    | "GOVERNANCE_INCOMPLETE"
    | "CONSTITUTIONAL_INCOMPLETE"
    | "AUTHORITY_FAILURE"
    | "TENANT_ISOLATION_FAILURE"
    | "ADVISORY_ONLY_FAILURE"
    | "MONITORING_GAP"
    | "MISSING_PROCEDURES"
    | "DR_NOT_VALIDATED"
    | "BACKUP_FAILURE"
    | "RECOVERY_FAILURE"
    | "HASH_MISMATCH"
    | "HIDDEN_DEPENDENCY"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ProductionReadinessResult = Readonly<{
  certification_version: "decision-production-readiness-assessment/v1";
  security_certification: SecurityBoundaryCertificationResult;
  checklist: ProductionReadinessChecklist;
  performance_report: PerformanceReadinessReport;
  scalability_report: ScalabilityReadinessReport;
  reliability_report: ReliabilityReadinessReport;
  explainability_report: ExplainabilityReadinessReport;
  monitoring_report: MonitoringReadinessReport;
  disaster_recovery_report: DisasterRecoveryReadinessReport;
  evidence_package: ProductionReadinessEvidencePackage;
  scorecard: ProductionReadinessScorecard;
  operational_report: OperationalReadinessReport;
  readiness_ledger: readonly ProductionReadinessLedgerEntry[];
  validation: ProductionReadinessValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  approved_for_controlled_production: boolean;
  mutates_production_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionReadinessFoundation = Readonly<{
  certification_version: "decision-production-readiness-assessment/v1";
  domains: readonly ProductionReadinessDomain[];
  checks: readonly ProductionReadinessCheck[];
  result: ProductionReadinessResult;
}>;
