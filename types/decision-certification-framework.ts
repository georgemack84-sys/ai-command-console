import type { ObservabilityAnalyticsResult } from "@/types/decision-observability-analytics-engine";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type CertificationLifecycleState = "DEFINED" | "REGISTERED" | "READY" | "EXECUTING" | "EVIDENCE_COLLECTION" | "VALIDATION" | "SCORING" | "RESULT_GENERATION" | "OPERATOR_REVIEW" | "FINALIZED" | "ARCHIVED";
export type CertificationExecutionState = "NOT_STARTED" | "RUNNING" | "COMPLETED" | "BLOCKED";
export type DecisionOrchestratorCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationCategory = "FOUNDATION" | "SCHEMA" | "DETERMINISM" | "CONTEXT" | "DEPENDENCY" | "CONFLICT" | "PRIORITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "DECISION_PACKAGE" | "OPERATOR_WORKFLOW" | "REPLAY" | "LEDGER" | "DASHBOARD" | "SECURITY" | "PRODUCTION_READINESS";
export type CertificationSeverity = "CRITICAL" | "MAJOR" | "MINOR";
export type CertificationEvidenceType = "TEST" | "REPLAY" | "GOVERNANCE" | "INTEGRITY" | "OPERATOR" | "DASHBOARD";
export type CertificationFailureClass = "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_VIOLATION" | "UNAUTHORIZED_EXECUTION" | "REPLAY_MISMATCH" | "TENANT_LEAKAGE" | "HIDDEN_ORCHESTRATION" | "INTEGRITY_FAILURE" | "MISSING_MANDATORY_EVIDENCE" | "FAIL_OPEN_BEHAVIOR" | "MISSING_EXPLANATION" | "INCOMPLETE_OBSERVABILITY" | "DOCUMENTATION_DEFICIENCY";

export type CertificationFrameworkFailure =
  | "CERTIFICATION_CONTRACT_INCOMPLETE"
  | "TEST_REGISTRY_INCOMPLETE"
  | "EXECUTION_ORDER_NONDETERMINISTIC"
  | "MANDATORY_TEST_FAILED"
  | "EVIDENCE_INCOMPLETE"
  | "SCORING_NONDETERMINISTIC"
  | "FAILURE_CLASSIFICATION_INCONSISTENT"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "AUTHORITY_VALIDATION_MISSING"
  | "TENANT_VALIDATION_MISSING"
  | "INTEGRITY_VALIDATION_MISSING"
  | "OPERATOR_REVIEW_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_LINEAGE_MUTABLE"
  | "CROSS_TENANT_CERTIFICATION_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "CERTIFICATION_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type CertificationTestRegistryEntry = Readonly<{
  test_id: string;
  test_name: string;
  description: string;
  certification_category: CertificationCategory;
  dependencies: readonly string[];
  expected_result: "PASS";
  pass_criteria: readonly string[];
  failure_criteria: readonly CertificationFailureClass[];
  required_evidence: readonly CertificationEvidenceType[];
  replay_requirement: "REQUIRED";
  severity: CertificationSeverity;
  owner: string;
  version: "phase-9-cert-test/v1";
  mandatory: boolean;
  integrity_hash: string;
}>;

export type CertificationExecutedTest = Readonly<{
  execution_id: string;
  test_id: string;
  execution_order: number;
  expected_outcome: "PASS";
  actual_outcome: DecisionOrchestratorCertificationState;
  execution_duration_ms: number;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failure_class: CertificationFailureClass | null;
  integrity_hash: string;
}>;

export type CertificationEvidenceRequirement = Readonly<{
  evidence_id: string;
  evidence_type: CertificationEvidenceType;
  required_refs: readonly string[];
  collected_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CertificationExecutionRule = Readonly<{
  rule_id: string;
  execution_order: number;
  rule_name: string;
  deterministic: boolean;
  required: true;
  replay_required: boolean;
  integrity_hash: string;
}>;

export type CertificationScoreComponent = Readonly<{
  category: "FOUNDATION" | "DETERMINISM" | "REPLAY" | "GOVERNANCE" | "CONSTITUTIONAL_COMPLIANCE" | "AUTHORITY_VALIDATION" | "DECISION_INTELLIGENCE" | "OPERATOR_WORKFLOW" | "INTEGRITY_LEDGER" | "OBSERVABILITY";
  weight: number;
  score: number;
  weighted_score: number;
  integrity_hash: string;
}>;

export type CertificationFailureClassification = Readonly<{
  classification_id: string;
  failure_class: CertificationFailureClass;
  severity: CertificationSeverity;
  result: DecisionOrchestratorCertificationState;
  rationale: string;
  integrity_hash: string;
}>;

export type CertificationMetadata = Readonly<{
  certification_id: string;
  phase_id: "9.12.1";
  version: "decision-certification-framework/v1";
  build_version: "phase-9-decision-orchestrator";
  execution_timestamp: string;
  operator: string;
  environment: "TEST";
  test_registry_version: "decision-certification-test-registry/v1";
  certification_state: DecisionOrchestratorCertificationState;
  replay_reference: string;
  ledger_reference: string;
  digital_signature: string;
  certification_duration_ms: number;
  integrity_hash: string;
}>;

export type DecisionOrchestratorCertification = Readonly<{
  certification_id: string;
  certification_version: "decision-certification-framework/v1";
  phase_id: "9.12.1";
  certification_scope: "MISSION_CONTROL_DECISION_ORCHESTRATOR";
  execution_timestamp: string;
  execution_id: string;
  execution_state: CertificationExecutionState;
  lifecycle_state: CertificationLifecycleState;
  certification_state: DecisionOrchestratorCertificationState;
  certification_score: number;
  test_registry_version: "decision-certification-test-registry/v1";
  executed_tests: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  tenant_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  failure_summary: readonly CertificationFailureClass[];
  recommendations: readonly string[];
  operator_review: "REQUIRED" | "COMPLETED" | "MISSING";
  advisory_only: true;
  production_ready: boolean;
  certification_hash: string;
}>;

export type CertificationFrameworkValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  contract_complete: boolean;
  test_registry_complete: boolean;
  execution_order_deterministic: boolean;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  scoring_deterministic: boolean;
  failure_classification_consistent: boolean;
  governance_validation_present: boolean;
  constitutional_validation_present: boolean;
  authority_validation_present: boolean;
  tenant_validation_present: boolean;
  integrity_validation_present: boolean;
  operator_review_present: boolean;
  replay_refs_present: boolean;
  lineage_immutable: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly CertificationFrameworkFailure[];
  integrity_hash: string;
}>;

export type CertificationFrameworkInput = Readonly<{
  analytics_result?: ObservabilityAnalyticsResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "INCOMPLETE_CONTRACT"
    | "INCOMPLETE_REGISTRY"
    | "NONDETERMINISTIC_ORDER"
    | "MANDATORY_TEST_FAILURE"
    | "INCOMPLETE_EVIDENCE"
    | "BAD_SCORING"
    | "BAD_FAILURE_CLASSIFICATION"
    | "MISSING_GOVERNANCE_VALIDATION"
    | "MISSING_CONSTITUTIONAL_VALIDATION"
    | "MISSING_AUTHORITY_VALIDATION"
    | "MISSING_TENANT_VALIDATION"
    | "MISSING_INTEGRITY_VALIDATION"
    | "MISSING_OPERATOR_REVIEW"
    | "MISSING_REPLAY_REFS"
    | "MUTABLE_LINEAGE"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type CertificationFrameworkResult = Readonly<{
  framework_version: "decision-certification-framework/v1";
  analytics_result: ObservabilityAnalyticsResult;
  certification_contract: DecisionOrchestratorCertification;
  test_registry: readonly CertificationTestRegistryEntry[];
  executed_tests: readonly CertificationExecutedTest[];
  evidence_requirements: readonly CertificationEvidenceRequirement[];
  execution_rules: readonly CertificationExecutionRule[];
  score_components: readonly CertificationScoreComponent[];
  failure_classifications: readonly CertificationFailureClassification[];
  metadata: CertificationMetadata;
  validation: CertificationFrameworkValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_certification_or_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CertificationFrameworkFoundation = Readonly<{
  framework_version: "decision-certification-framework/v1";
  lifecycle_states: readonly CertificationLifecycleState[];
  certification_states: readonly DecisionOrchestratorCertificationState[];
  categories: readonly CertificationCategory[];
  evidence_types: readonly CertificationEvidenceType[];
  failure_classes: readonly CertificationFailureClass[];
  result: CertificationFrameworkResult;
}>;
