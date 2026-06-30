import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type { PolicyDependencyGraph } from "@/types/policy-dependency-graph";
import type { PolicyImpactAnalysis } from "@/types/policy-impact-analysis";

export type PolicyIntelligenceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type PolicyIntelligenceCertificationLifecycleState =
  | "CREATED"
  | "SOURCES_COLLECTED"
  | "CONTRACTS_VALIDATED"
  | "LINEAGE_VALIDATED"
  | "CORRELATIONS_VALIDATED"
  | "GRAPH_VALIDATED"
  | "IMPACTS_VALIDATED"
  | "REPLAY_VALIDATED"
  | "TRUTH_VALIDATED"
  | "CONDITIONAL_REVIEW"
  | "CERTIFIED"
  | "CONDITIONALLY_CERTIFIED"
  | "FAILED"
  | "ARCHIVED";

export type PolicyIntelligenceCertificationCategory =
  | "CONTRACT_VALIDATION"
  | "SCHEMA_VALIDATION"
  | "LINEAGE_VALIDATION"
  | "CORRELATION_VALIDATION"
  | "DEPENDENCY_GRAPH_VALIDATION"
  | "INHERITANCE_VALIDATION"
  | "CONFLICT_DETECTION_VALIDATION"
  | "SUPERSESSION_VALIDATION"
  | "IMPACT_EXPLANATION_VALIDATION"
  | "GOVERNANCE_INFLUENCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "TENANT_IDENTITY_TRUTH_VALIDATION";

export type PolicyIntelligenceFailureReason =
  | "MISSING_POLICY_CONTRACT"
  | "INVALID_POLICY_SCHEMA"
  | "LINEAGE_BREAK"
  | "INCONSISTENT_CORRELATION"
  | "DEPENDENCY_GRAPH_MISMATCH"
  | "INHERITANCE_MISMATCH"
  | "UNDETECTED_CONFLICT"
  | "SUPERSESSION_MISMATCH"
  | "UNEXPLAINED_IMPACT"
  | "GOVERNANCE_INFLUENCE_MISMATCH"
  | "REPLAY_MISMATCH"
  | "TENANT_ISOLATION_FAILURE"
  | "IDENTIFIER_MUTATION"
  | "TRUTH_LINEAGE_MISMATCH"
  | "HISTORICAL_TRUTH_MUTATION"
  | "CERTIFICATION_HASH_MISMATCH"
  | "INVALID_CERTIFICATION_STATE"
  | "INVALID_LIFECYCLE_TRANSITION";

export type PolicyIntelligenceCertificationScope = Readonly<{
  tenant_scope: string;
  mission_scope: string;
  policy_scope: string;
  governance_scope: string;
  runtime_scope: string;
  historical_window: string;
  certification_boundary: "Phase 7B";
  visibility_scope: string;
}>;

export type PolicyIntelligenceTestResult = Readonly<{
  test_id: string;
  test_name: string;
  test_category: PolicyIntelligenceCertificationCategory;
  expected_result: "PASS" | "FAIL";
  actual_result: "PASS" | "FAIL";
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failure_reason: PolicyIntelligenceFailureReason | null;
  certification_effect: "CRITICAL" | "CONDITIONAL" | "NONE";
}>;

export type PolicyIntelligenceValidationFailure = Readonly<{
  failure_id: string;
  reason: PolicyIntelligenceFailureReason;
  test_id: string;
  message: string;
  critical: true;
  fail_closed: true;
}>;

export type PolicyIntelligenceConditionalFinding = Readonly<{
  finding_id: string;
  description: string;
  risk_level: "LOW" | "MEDIUM";
  affected_component: string;
  required_remediation: string;
  operator_visibility_warning: string;
}>;

export type PolicyIntelligenceCertificationReplayRefs = Readonly<{
  policy_analysis_replay_refs: readonly string[];
  policy_correlation_replay_refs: readonly string[];
  policy_dependency_graph_replay_refs: readonly string[];
  policy_impact_analysis_replay_refs: readonly string[];
  certification_algorithm_version: "policy-intelligence-certification/v7B.5";
  test_result_hash: string;
  failure_hash: string;
  conditional_finding_hash: string;
  certification_output_hash: string;
  replay_execution_ref: string;
}>;

export type PolicyIntelligenceCertification = Readonly<{
  schema_version: "policy-intelligence-certification/v7B.5";
  policy_certification_id: string;
  tenant_id: string;
  certification_scope: PolicyIntelligenceCertificationScope;
  certification_version: "policy-intelligence-certification-suite/v7B.5";
  policy_analysis_refs: readonly string[];
  policy_correlation_refs: readonly string[];
  policy_dependency_graph_refs: readonly string[];
  policy_impact_analysis_refs: readonly string[];
  truth_record_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: PolicyIntelligenceCertificationReplayRefs;
  test_results: readonly PolicyIntelligenceTestResult[];
  validation_failures: readonly PolicyIntelligenceValidationFailure[];
  conditional_findings: readonly PolicyIntelligenceConditionalFinding[];
  lifecycle_state: PolicyIntelligenceCertificationLifecycleState;
  certification_state: PolicyIntelligenceCertificationState;
  certification_hash: string;
  certified_by: "Mission Control Policy Intelligence Certification Gate";
  created_timestamp: string;
}>;

export type PolicyIntelligenceCertificationDoctrine = Readonly<{
  principles: readonly ("contract-bound" | "evidence-linked" | "lineage-preserving" | "deterministic" | "replayable" | "tenant-isolated" | "governance-compliant" | "operator-explainable" | "fail-closed")[];
  critical_failure_reasons: readonly PolicyIntelligenceFailureReason[];
  certification_categories: readonly PolicyIntelligenceCertificationCategory[];
  allowed_states: readonly PolicyIntelligenceCertificationState[];
  prohibited_behaviors: readonly string[];
}>;

export type PolicyIntelligenceCertificationInputs = Readonly<{
  policy_analysis: PolicyAnalysisRecord;
  policy_correlations: readonly PolicyCorrelationRecord[];
  policy_graph: PolicyDependencyGraph;
  policy_impact: PolicyImpactAnalysis;
}>;

export type PolicyIntelligenceCertificationReport = Readonly<{
  summary: string;
  certification_state: PolicyIntelligenceCertificationState;
  exit_readiness_statement: string;
  passed_tests: number;
  failed_tests: number;
  critical_failures: readonly PolicyIntelligenceValidationFailure[];
  conditional_findings: readonly PolicyIntelligenceConditionalFinding[];
  evidence_summary: readonly string[];
  lineage_summary: readonly string[];
  replay_summary: readonly string[];
  tenant_isolation_summary: string;
  truth_preservation_summary: string;
}>;

export type PolicyIntelligenceCertificationLedgerRecord = Readonly<{
  truth_record_id: string;
  event_type: "POLICY_INTELLIGENCE_CERTIFICATION";
  tenant_id: string;
  certification_id: string;
  certification_state: PolicyIntelligenceCertificationState;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  certification_hash: string;
  operator_visibility: "operator_visible";
  created_timestamp: string;
}>;

export type PolicyIntelligenceCertificationReplayResult = Readonly<{
  replay_id: string;
  policy_certification_id: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: PolicyIntelligenceFailureReason | null;
  reconstructed_hash: string;
  expected_hash: string;
  final_state: PolicyIntelligenceCertificationState;
}>;

export type PolicyIntelligenceCertificationObservabilitySurface = Readonly<{
  certification_state: PolicyIntelligenceCertificationState;
  certification_scope: PolicyIntelligenceCertificationScope;
  certification_version: string;
  tested_policy_analysis_records: readonly string[];
  tested_policy_correlation_records: readonly string[];
  tested_policy_dependency_graph_records: readonly string[];
  tested_policy_impact_analysis_records: readonly string[];
  test_results: readonly PolicyIntelligenceTestResult[];
  failed_tests: readonly PolicyIntelligenceTestResult[];
  conditional_findings: readonly PolicyIntelligenceConditionalFinding[];
  critical_failures: readonly PolicyIntelligenceValidationFailure[];
  evidence_references: readonly string[];
  truth_references: readonly string[];
  lineage_references: readonly string[];
  replay_references: PolicyIntelligenceCertificationReplayRefs;
  tenant_isolation_status: "PRESERVED" | "FAILED";
  identity_immutability_status: "PRESERVED" | "FAILED";
  historical_truth_status: "PRESERVED" | "FAILED";
  governance_compliance_status: "PRESERVED" | "FAILED";
  certification_hash: string;
  certification_timestamp: string;
}>;
