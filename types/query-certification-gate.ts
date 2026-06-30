import type { AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";

export type QueryCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type QueryCertificationScenario =
  | "BASELINE"
  | "MINOR_VISUALIZATION_GAP"
  | "QUERY_CONTRACT_MISSING"
  | "QUERY_SCHEMA_INVALID"
  | "PLAN_LOOKUP_NONREPRODUCIBLE"
  | "EXECUTION_LOOKUP_NONREPRODUCIBLE"
  | "DELEGATION_LOOKUP_NONREPRODUCIBLE"
  | "SUPERVISION_LOOKUP_NONREPRODUCIBLE"
  | "REPLAY_LOOKUP_NONREPRODUCIBLE"
  | "INTERVENTION_LOOKUP_NONREPRODUCIBLE"
  | "POLICY_LOOKUP_NONREPRODUCIBLE"
  | "HISTORICAL_RECONSTRUCTION_NONDETERMINISTIC"
  | "RECONSTRUCTION_MISMATCH_UNDETECTED"
  | "LINEAGE_SEARCH_NONDETERMINISTIC"
  | "BROKEN_LINEAGE_UNDETECTED"
  | "CROSS_REFERENCE_NONDETERMINISTIC"
  | "MISSING_REFERENCE_UNDETECTED"
  | "CONFLICTING_REFERENCE_UNSURFACED"
  | "ORDERING_NONDETERMINISTIC"
  | "TENANT_ISOLATION_BROKEN"
  | "CROSS_TENANT_QUERY_ACCEPTED"
  | "UNAUTHORIZED_QUERY_ACCEPTED"
  | "READ_ONLY_ENFORCEMENT_BROKEN"
  | "QUERY_MUTATION_ACCEPTED"
  | "REPLAY_REFERENCE_LOST"
  | "INTEGRITY_REFERENCE_LOST"
  | "HIDDEN_AUTONOMOUS_STATE_UNDETECTED"
  | "AUDIT_RECORD_MISSING";

export type QueryCertificationFailure =
  | "MINOR_VISUALIZATION_GAP"
  | "QUERY_CONTRACT_NOT_CERTIFIED"
  | "QUERY_SCHEMA_NOT_CERTIFIED"
  | "PLAN_LOOKUP_NOT_REPRODUCIBLE"
  | "EXECUTION_LOOKUP_NOT_REPRODUCIBLE"
  | "DELEGATION_LOOKUP_NOT_REPRODUCIBLE"
  | "SUPERVISION_LOOKUP_NOT_REPRODUCIBLE"
  | "REPLAY_LOOKUP_NOT_REPRODUCIBLE"
  | "INTERVENTION_LOOKUP_NOT_REPRODUCIBLE"
  | "POLICY_LOOKUP_NOT_REPRODUCIBLE"
  | "HISTORICAL_RECONSTRUCTION_NOT_DETERMINISTIC"
  | "RECONSTRUCTION_MISMATCH_NOT_DETECTED"
  | "LINEAGE_SEARCH_NOT_DETERMINISTIC"
  | "BROKEN_LINEAGE_NOT_DETECTED"
  | "CROSS_REFERENCE_SEARCH_NOT_DETERMINISTIC"
  | "MISSING_REFERENCE_NOT_DETECTED"
  | "CONFLICTING_REFERENCE_NOT_SURFACED"
  | "DETERMINISTIC_ORDERING_NOT_CERTIFIED"
  | "TENANT_ISOLATION_NOT_CERTIFIED"
  | "CROSS_TENANT_QUERY_NOT_REJECTED"
  | "UNAUTHORIZED_QUERY_NOT_REJECTED"
  | "READ_ONLY_BEHAVIOR_NOT_CERTIFIED"
  | "QUERY_MUTATION_NOT_REJECTED"
  | "REPLAY_REFERENCE_NOT_PRESERVED"
  | "INTEGRITY_REFERENCE_NOT_PRESERVED"
  | "HIDDEN_AUTONOMOUS_STATE_NOT_DETECTED"
  | "QUERY_AUDIT_NOT_CERTIFIED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type QueryCertificationCategory = "CONTRACT" | "FUNCTIONAL" | "DETERMINISM" | "REPLAY" | "INTEGRITY" | "SECURITY" | "AUDIT" | "VISIBILITY";

export type QueryCertificationTestResult = Readonly<{
  test_id: string;
  category: QueryCertificationCategory;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: QueryCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type QueryCertificationScorecard = Readonly<{
  functional_score: number;
  determinism_score: number;
  replay_score: number;
  integrity_score: number;
  security_score: number;
  audit_score: number;
  scorecard_hash: string;
}>;

export type QueryCertificationEvidence = Readonly<{
  evidence_id: string;
  query_contract_hash: string;
  autonomy_search_hash: string;
  plan_execution_hash: string;
  delegation_orchestration_hash: string;
  supervision_intervention_boundary_hash: string;
  replay_reconstruction_hash: string;
  lineage_search_hash: string;
  cross_reference_hash: string;
  security_hash: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type QueryCertificationReport = Readonly<{
  certification_id: string;
  tenant_id: string;
  phase: "8I";
  phase_version: "8I.10";
  schema_version: "query-certification-gate/v8I.10";
  certification_state: QueryCertificationState;
  functional_score: number;
  determinism_score: number;
  replay_score: number;
  integrity_score: number;
  security_score: number;
  audit_score: number;
  certification_tests: readonly QueryCertificationTestResult[];
  passed_tests: readonly QueryCertificationTestResult[];
  failed_tests: readonly QueryCertificationTestResult[];
  warnings: readonly QueryCertificationFailure[];
  detected_findings: readonly QueryCertificationFailure[];
  certification_evidence: QueryCertificationEvidence;
  scorecard: QueryCertificationScorecard;
  query_contract_validation: AutonomyQueryValidationResult;
  operator_approval_status: "APPROVED_FOR_PRODUCTION" | "APPROVED_FOR_STAGING" | "BLOCKED";
  production_ready: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  certification_timestamp: string;
  report_hash: string;
}>;

export type QueryCertificationInput = Readonly<{
  scenario?: QueryCertificationScenario;
}>;

export type QueryCertificationValidationResult = Readonly<{
  certification_id: string | null;
  validation_state: "VALID" | "INVALID";
  certified: boolean;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  report_hash_valid: boolean;
  failures: readonly QueryCertificationFailure[];
  validation_hash: string;
}>;

export type QueryCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: QueryCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warnings: readonly QueryCertificationFailure[];
  failures: readonly QueryCertificationFailure[];
  functional_score: number;
  determinism_score: number;
  replay_score: number;
  integrity_score: number;
  security_score: number;
  audit_score: number;
  operator_approval_status: QueryCertificationReport["operator_approval_status"];
  production_ready: boolean;
}>;
