import type { OrchestrationReadinessPackage } from "@/types/decision-context-orchestration-readiness";
import type { DecisionCandidate } from "@/types/decision-input-normalization";

export type DecisionContextCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DecisionContextCertificationStatus = "PASS" | "FAIL";

export type DecisionContextCertificationFailure =
  | "MANDATORY_CONTEXT_MISSING"
  | "NONDETERMINISTIC_CONTEXT_RESOLUTION"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_HASH_MISMATCH"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "TENANT_ISOLATION_FAILURE"
  | "MISSING_EXPLAINABILITY"
  | "MISSING_REPLAY_ARTIFACTS"
  | "INCOMPLETE_VALIDATION"
  | "REGISTRY_LEDGER_FAILURE"
  | "ORCHESTRATION_READINESS_INCOMPLETE"
  | "FAIL_OPEN_BEHAVIOR"
  | "NON_FUNCTIONAL_ARTIFACT_GAP";

export type DecisionContextCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_REPORTING_GAP"
  | "MISSING_CONTEXT"
  | "REPLAY_UNAVAILABLE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "AUTHORITY_UNRESOLVED"
  | "INTEGRITY_MISMATCH"
  | "TENANT_VIOLATION"
  | "INTERFACE_INCOMPATIBLE";

export type DecisionContextCertificationTest = Readonly<{
  certification_test_id: string;
  test_name: string;
  expected: DecisionContextCertificationStatus;
  actual: DecisionContextCertificationStatus;
  failure?: DecisionContextCertificationFailure;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionContextCertification = Readonly<{
  certification_id: string;
  phase: "9.3.13";
  certification_version: "decision-context-certification-gate/v1";
  certification_timestamp: string;
  context_validation: DecisionContextCertificationStatus;
  replay_validation: DecisionContextCertificationStatus;
  integrity_validation: DecisionContextCertificationStatus;
  governance_validation: DecisionContextCertificationStatus;
  constitutional_validation: DecisionContextCertificationStatus;
  authority_validation: DecisionContextCertificationStatus;
  tenant_validation: DecisionContextCertificationStatus;
  explainability_validation: DecisionContextCertificationStatus;
  readiness_validation: DecisionContextCertificationStatus;
  certification_state: DecisionContextCertificationOutcome;
  certification_hash: string;
}>;

export type DecisionContextCertificationReport = Readonly<{
  report_id: string;
  certification_id: string;
  context_completeness: string;
  resolver_performance: string;
  validation_summary: string;
  outstanding_issues: readonly string[];
  integrity_hash: string;
}>;

export type ContextReplayValidationReport = Readonly<{
  report_id: string;
  replay_fidelity: boolean;
  replay_reconstruction: string;
  replay_lineage: readonly string[];
  replay_integrity: DecisionContextCertificationStatus;
  integrity_hash: string;
}>;

export type ContextGovernanceComplianceReport = Readonly<{
  report_id: string;
  policy_compliance: DecisionContextCertificationStatus;
  governance_approvals: readonly string[];
  policy_conflicts: readonly string[];
  governance_lineage: readonly string[];
  integrity_hash: string;
}>;

export type ContextConstitutionalComplianceReport = Readonly<{
  report_id: string;
  constitutional_validation: DecisionContextCertificationStatus;
  principle_enforcement: readonly string[];
  constraint_enforcement: readonly string[];
  violation_analysis: readonly string[];
  integrity_hash: string;
}>;

export type ContextProductionReadinessReport = Readonly<{
  report_id: string;
  readiness_summary: string;
  remaining_blockers: readonly DecisionContextCertificationFailure[];
  certification_outcome: DecisionContextCertificationOutcome;
  deployment_recommendation: "AUTHORIZE_PHASE_9_4_ENTRY" | "BLOCK_PHASE_9_4_ENTRY";
  integrity_hash: string;
}>;

export type DecisionContextCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  certification_id: string;
  readiness_package: OrchestrationReadinessPackage;
  certification_tests: readonly DecisionContextCertificationTest[];
  validation_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  certification_artifacts: readonly string[];
  integrity_hash: string;
}>;

export type DecisionContextCertificationGateRequest = Readonly<{
  certification_id: string;
  candidate: DecisionCandidate;
  readiness_package?: OrchestrationReadinessPackage;
  scenario?: DecisionContextCertificationScenario;
  certification_version: "decision-context-certification-gate/v1";
}>;

export type DecisionContextCertificationGatePackage = Readonly<{
  certification_id: string;
  candidate_id: string;
  certification: DecisionContextCertification;
  certification_tests: readonly DecisionContextCertificationTest[];
  context_certification_report: DecisionContextCertificationReport;
  replay_validation_report: ContextReplayValidationReport;
  governance_compliance_report: ContextGovernanceComplianceReport;
  constitutional_compliance_report: ContextConstitutionalComplianceReport;
  production_readiness_report: ContextProductionReadinessReport;
  evidence_package: DecisionContextCertificationEvidencePackage;
  failures: readonly DecisionContextCertificationFailure[];
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DecisionContextCertificationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  certification_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_outcome: DecisionContextCertificationOutcome;
  failures: readonly DecisionContextCertificationFailure[];
  integrity_hash: string;
}>;

export type DecisionContextCertificationObservability = Readonly<{
  certification_attempts: number;
  pass_count: number;
  conditional_pass_count: number;
  fail_count: number;
  replay_fidelity_rate: number;
  integrity_pass_rate: number;
  governance_pass_rate: number;
  constitutional_pass_rate: number;
  authority_failure_count: number;
  tenant_failure_count: number;
  readiness_failure_count: number;
  evidence_completeness_rate: number;
}>;
