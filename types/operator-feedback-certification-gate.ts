import type { FeedbackAnalyticsDashboardResult } from "@/types/feedback-analytics-dashboard";
import type { FeedbackEvidenceCorrelationResult } from "@/types/feedback-evidence-correlation";
import type { FeedbackIntakeEngineResult } from "@/types/feedback-intake-engine";
import type { FeedbackNormalizationEngineResult } from "@/types/feedback-normalization-engine";
import type { FeedbackGovernanceValidationResult } from "@/types/operator-feedback-governance-validation";
import type { OperatorFeedbackContractResult } from "@/types/operator-feedback-contract";
import type { OperatorFeedbackLedgerResult } from "@/types/operator-feedback-ledger";
import type { OverrideLearningAnalyzerResult } from "@/types/override-learning-analyzer";
import type { RejectionLearningAnalyzerResult } from "@/types/rejection-learning-analyzer";

export type OperatorFeedbackCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type OperatorFeedbackCertificationDomain =
  | "CONTRACT_INTEGRITY"
  | "FEEDBACK_PROCESSING"
  | "LEARNING_ANALYSIS"
  | "EVIDENCE_CORRELATION"
  | "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT"
  | "LEDGER_REPLAY_INTEGRITY"
  | "ANALYTICS_EXPLAINABILITY";

export type OperatorFeedbackCertificationFailure =
  | "CONTRACT_INVALID"
  | "SCHEMA_VALIDATION_NONDETERMINISTIC"
  | "INTAKE_NONDETERMINISTIC"
  | "AUTHENTICATION_NOT_ENFORCED"
  | "AUTHORIZATION_NOT_ENFORCED"
  | "UNAUTHORIZED_FEEDBACK_ACCEPTED"
  | "NORMALIZATION_NONDETERMINISTIC"
  | "CLASSIFICATION_INCONSISTENT"
  | "DUPLICATE_RESOLUTION_NONDETERMINISTIC"
  | "OVERRIDE_ANALYSIS_NONDETERMINISTIC"
  | "REJECTION_ANALYSIS_NONDETERMINISTIC"
  | "MISSING_DECISION_LINEAGE"
  | "MISSING_RECOMMENDATION_LINEAGE"
  | "MISSING_OUTCOME_LINEAGE"
  | "MISSING_REPLAY_LINEAGE"
  | "MISSING_EVIDENCE_LINEAGE"
  | "CORRELATION_NONDETERMINISTIC"
  | "ADAPTATION_RELEVANCE_NONDETERMINISTIC"
  | "GOVERNANCE_RELEVANCE_NONDETERMINISTIC"
  | "CONFIDENCE_SIGNAL_NONDETERMINISTIC"
  | "FEEDBACK_USED_AS_AUTHORITY"
  | "PRODUCTION_MUTATION_DETECTED"
  | "GOVERNANCE_POLICY_OVERRIDE_DETECTED"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "AUTHORITY_BOUNDARY_VIOLATED"
  | "CROSS_TENANT_FEEDBACK_ACCEPTED"
  | "TENANT_ISOLATION_BROKEN"
  | "LEDGER_NOT_APPEND_ONLY"
  | "LEDGER_NOT_IMMUTABLE"
  | "LEDGER_HASH_INVALID"
  | "REPLAY_NONDETERMINISTIC"
  | "AUDIT_LINEAGE_INCOMPLETE"
  | "SIMULATION_TRIGGER_NONDETERMINISTIC"
  | "REVIEW_TRIGGER_NONDETERMINISTIC"
  | "HIGH_RISK_ESCALATION_MISSING"
  | "DASHBOARD_METRICS_NONDETERMINISTIC"
  | "EXPLAINABILITY_INCOMPLETE"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "DOCUMENTATION_GAP"
  | "VISUALIZATION_REPORTING_GAP"
  | "USABILITY_GAP";

export type OperatorFeedbackCertificationScenario =
  | "BASELINE"
  | "DOCUMENTATION_GAP"
  | "VISUALIZATION_REPORTING_GAP"
  | "USABILITY_GAP"
  | "CONTRACT_INVALID"
  | "UNAUTHORIZED_FEEDBACK_ACCEPTED"
  | "NORMALIZATION_NONDETERMINISTIC"
  | "OVERRIDE_ANALYSIS_NONDETERMINISTIC"
  | "REJECTION_ANALYSIS_NONDETERMINISTIC"
  | "MISSING_LINEAGE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "TENANT_BREACH"
  | "LEDGER_MUTATION"
  | "HASH_MISMATCH"
  | "REPLAY_DIVERGENCE"
  | "AUDIT_GAP"
  | "PRODUCTION_MUTATION"
  | "POLICY_MUTATION"
  | "ADAPTIVE_IMPLEMENTATION_AUTHORIZATION"
  | "ANALYTICS_UNEXPLAINED"
  | "EVIDENCE_PACKAGE_INCOMPLETE";

export type OperatorFeedbackCertificationMatrixResult = Readonly<{
  test_name: string;
  domain: OperatorFeedbackCertificationDomain;
  expected: "PASS";
  actual: OperatorFeedbackCertificationOutcome;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failures: readonly OperatorFeedbackCertificationFailure[];
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationDomainReport = Readonly<{
  domain: OperatorFeedbackCertificationDomain;
  outcome: OperatorFeedbackCertificationOutcome;
  validations: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failures: readonly OperatorFeedbackCertificationFailure[];
  explanation: string;
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationEvidencePackage = Readonly<{
  package_id: string;
  executive_certification_summary: string;
  test_matrix_results: readonly string[];
  determinism_report: string;
  governance_validation_report: string;
  constitutional_compliance_report: string;
  authority_boundary_report: string;
  evidence_lineage_report: string;
  replay_verification_report: string;
  ledger_integrity_report: string;
  analytics_validation_report: string;
  explainability_assessment: string;
  audit_completeness_report: string;
  risk_assessment: string;
  certification_decision_record: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  audit_refs: readonly string[];
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationApiSurface = Readonly<{
  api_id: string;
  certify_feedback_integration: "POST /operator-feedback-certification-gate/certify";
  retrieve_evidence_package: "POST /operator-feedback-certification-gate/evidence-package";
  retrieve_matrix: "POST /operator-feedback-certification-gate/matrix";
  retrieve_decision: "POST /operator-feedback-certification-gate/decision";
  replay_certification: "POST /operator-feedback-certification-gate/replay";
  inspect_certification: "POST /operator-feedback-certification-gate/inspect";
  retrieve_contract: "GET /operator-feedback-certification-gate/contract";
  production_mutation_supported: false;
  governance_override_supported: false;
  policy_mutation_supported: false;
  adaptive_implementation_authorization_supported: false;
  operator_authority_expansion_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationGateInput = Readonly<{
  scenario?: OperatorFeedbackCertificationScenario;
}>;

export type OperatorFeedbackCertificationGateResult = Readonly<{
  operator_feedback_certification_gate_version: "operator-feedback-certification-gate/v1";
  certification_framework_version: "operator-feedback-certification-framework/v1";
  api_surface: OperatorFeedbackCertificationApiSurface;
  contract_result: OperatorFeedbackContractResult;
  intake_result: FeedbackIntakeEngineResult;
  normalization_result: FeedbackNormalizationEngineResult;
  override_learning_result: OverrideLearningAnalyzerResult;
  rejection_learning_result: RejectionLearningAnalyzerResult;
  evidence_correlation_result: FeedbackEvidenceCorrelationResult;
  ledger_result: OperatorFeedbackLedgerResult;
  governance_result: FeedbackGovernanceValidationResult;
  analytics_result: FeedbackAnalyticsDashboardResult;
  domain_reports: readonly OperatorFeedbackCertificationDomainReport[];
  test_matrix: readonly OperatorFeedbackCertificationMatrixResult[];
  evidence_package: OperatorFeedbackCertificationEvidencePackage;
  outcome: OperatorFeedbackCertificationOutcome;
  failures: readonly OperatorFeedbackCertificationFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  governance_supremacy_enforced: boolean;
  constitutional_enforcement_mandatory: boolean;
  authority_boundaries_enforced: boolean;
  tenant_isolated: boolean;
  audit_complete: boolean;
  evidence_lineage_complete: boolean;
  advisory_only: true;
  uses_feedback_as_evidence_only: boolean;
  modifies_feedback: false;
  modifies_recommendations: false;
  modifies_governance: false;
  modifies_policy: false;
  authorizes_adaptive_implementation: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperatorFeedbackCertificationGateFoundation = Readonly<{
  operator_feedback_certification_gate_version: "operator-feedback-certification-gate/v1";
  api_surface: OperatorFeedbackCertificationApiSurface;
  result: OperatorFeedbackCertificationGateResult;
}>;
