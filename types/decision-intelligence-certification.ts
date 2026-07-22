import type { GovernanceConstitutionalCertificationResult } from "@/types/decision-governance-constitutional-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type DecisionIntelligenceScope =
  | "CONTEXT_COMPLETENESS"
  | "DEPENDENCY_ACCURACY"
  | "CONFLICT_DETECTION"
  | "ARBITRATION"
  | "PRIORITY_SCORING"
  | "ALTERNATIVE_GENERATION"
  | "REJECTED_OPTION_EXPLAINABILITY"
  | "REPLAY_CONSISTENCY";

export type DecisionIntelligenceCheck =
  | "REASONING_CORRECTNESS"
  | "CONTEXT_SUFFICIENCY"
  | "DEPENDENCY_VALIDITY"
  | "CONFLICT_VALIDITY"
  | "ARBITRATION_REPRODUCIBILITY"
  | "PRIORITY_REPRODUCIBILITY"
  | "ALTERNATIVE_EXPLAINABILITY"
  | "REJECTION_EXPLAINABILITY"
  | "TRACEABILITY"
  | "INTEGRITY_VERIFICATION";

export type DecisionIntelligenceCertificationState = "PASS" | "FAIL";

export type DecisionIntelligenceCertificationFailure =
  | "GOVERNANCE_CONSTITUTIONAL_CERTIFICATION_INVALID"
  | "INCOMPLETE_DECISION_CONTEXT"
  | "MISSING_REQUIRED_EVIDENCE"
  | "INCORRECT_DEPENDENCY_ANALYSIS"
  | "DEPENDENCY_GRAPH_INCONSISTENCY"
  | "UNDETECTED_CONFLICT"
  | "INCORRECT_CONFLICT_CLASSIFICATION"
  | "NONDETERMINISTIC_ARBITRATION"
  | "INCORRECT_PRIORITY_CALCULATION"
  | "INCONSISTENT_TIE_BREAKING"
  | "MISSING_ALTERNATIVE_RECOMMENDATIONS"
  | "MISSING_REJECTED_OPTION_EXPLANATIONS"
  | "HIDDEN_REASONING"
  | "UNTRACEABLE_RECOMMENDATIONS"
  | "MISSING_GOVERNANCE_RATIONALE"
  | "MISSING_CONSTITUTIONAL_RATIONALE"
  | "REPLAY_INCONSISTENCY"
  | "DECISION_INCONSISTENCY"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_REASONING"
  | "CROSS_TENANT_REASONING_CONTAMINATION"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type ContextCompletenessReport = Readonly<{
  context_report_id: string;
  tenant_id: string;
  mission_id: string;
  required_contexts: readonly string[];
  available_contexts: readonly string[];
  missing_contexts: readonly string[];
  context_relevance_verified: boolean;
  context_quality_verified: boolean;
  context_sufficiency_verified: boolean;
  context_lineage_ref: string;
  evidence_refs: readonly string[];
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type DependencyAccuracyReport = Readonly<{
  dependency_report_id: string;
  tenant_id: string;
  mission_id: string;
  dependency_refs: readonly string[];
  relationship_refs: readonly string[];
  dependency_order: readonly string[];
  blocker_refs: readonly string[];
  upstream_refs: readonly string[];
  downstream_refs: readonly string[];
  cross_domain_refs: readonly string[];
  dependency_lineage_ref: string;
  graph_consistent: boolean;
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type ConflictArbitrationReport = Readonly<{
  conflict_report_id: string;
  tenant_id: string;
  mission_id: string;
  detected_conflicts: readonly string[];
  classified_conflicts: readonly string[];
  arbitration_rules: readonly string[];
  tradeoff_refs: readonly string[];
  escalation_refs: readonly string[];
  resolution_refs: readonly string[];
  conflict_detection_complete: boolean;
  conflict_classification_correct: boolean;
  arbitration_deterministic: boolean;
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type PriorityReproducibilityReport = Readonly<{
  priority_report_id: string;
  tenant_id: string;
  mission_id: string;
  score_calculations: readonly string[];
  composite_weights: readonly string[];
  ranking: readonly string[];
  tie_breaking_refs: readonly string[];
  priority_explanations: readonly string[];
  calculations_correct: boolean;
  ranking_reproducible: boolean;
  tie_breaking_deterministic: boolean;
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type AlternativeExplainabilityReport = Readonly<{
  alternative_report_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_ref: string;
  alternative_refs: readonly string[];
  rejected_option_refs: readonly string[];
  recommendation_rationale_ref: string;
  evidence_traceability_refs: readonly string[];
  governance_rationale_ref: string;
  constitutional_rationale_ref: string;
  alternative_explanations: readonly string[];
  rejected_option_explanations: readonly string[];
  hidden_reasoning_absent: boolean;
  operator_understandable: boolean;
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type DecisionConsistencyReport = Readonly<{
  consistency_report_id: string;
  tenant_id: string;
  mission_id: string;
  decision_comparison_matrix: readonly string[];
  context_consistent: boolean;
  dependency_consistent: boolean;
  arbitration_consistent: boolean;
  priority_consistent: boolean;
  recommendation_consistent: boolean;
  replay_consistent: boolean;
  determinism_verified: boolean;
  validation_state: DecisionIntelligenceCertificationState;
  integrity_hash: string;
}>;

export type DecisionIntelligenceEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  context_evidence_refs: readonly string[];
  dependency_evidence_refs: readonly string[];
  conflict_evidence_refs: readonly string[];
  priority_evidence_refs: readonly string[];
  explainability_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ExplainabilityValidationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  decision_scope: readonly DecisionIntelligenceScope[];
  certified_checks: readonly DecisionIntelligenceCheck[];
  context_completeness_assessment: DecisionIntelligenceCertificationState;
  dependency_analysis_results: DecisionIntelligenceCertificationState;
  conflict_detection_results: DecisionIntelligenceCertificationState;
  arbitration_assessment: DecisionIntelligenceCertificationState;
  priority_scoring_assessment: DecisionIntelligenceCertificationState;
  alternative_recommendation_assessment: DecisionIntelligenceCertificationState;
  rejected_option_assessment: DecisionIntelligenceCertificationState;
  explainability_assessment: DecisionIntelligenceCertificationState;
  replay_verification: DecisionIntelligenceCertificationState;
  integrity_verification: DecisionIntelligenceCertificationState;
  failure_analysis: readonly DecisionIntelligenceCertificationFailure[];
  certification_decision: DecisionIntelligenceCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type DecisionIntelligenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "CONTEXT_CERTIFIED" | "DEPENDENCIES_CERTIFIED" | "ARBITRATION_CERTIFIED" | "PRIORITY_CERTIFIED" | "EXPLAINABILITY_CERTIFIED" | "INTELLIGENCE_CERTIFIED" | "INTELLIGENCE_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: DecisionIntelligenceCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type DecisionIntelligenceCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  governance_certification_valid: boolean;
  context_complete: boolean;
  required_evidence_present: boolean;
  dependency_analysis_correct: boolean;
  dependency_graph_consistent: boolean;
  conflicts_detected: boolean;
  conflict_classification_correct: boolean;
  arbitration_deterministic: boolean;
  priority_calculation_correct: boolean;
  tie_breaking_consistent: boolean;
  alternatives_present: boolean;
  rejected_options_explained: boolean;
  hidden_reasoning_absent: boolean;
  recommendations_traceable: boolean;
  governance_rationale_complete: boolean;
  constitutional_rationale_complete: boolean;
  replay_consistent: boolean;
  decision_consistent: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly DecisionIntelligenceCertificationFailure[];
  integrity_hash: string;
}>;

export type DecisionIntelligenceCertificationInput = Readonly<{
  governance_certification?: GovernanceConstitutionalCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "GOVERNANCE_INVALID"
    | "INCOMPLETE_CONTEXT"
    | "MISSING_EVIDENCE"
    | "INCORRECT_DEPENDENCY"
    | "GRAPH_INCONSISTENCY"
    | "UNDETECTED_CONFLICT"
    | "INCORRECT_CONFLICT_CLASSIFICATION"
    | "NONDETERMINISTIC_ARBITRATION"
    | "INCORRECT_PRIORITY"
    | "INCONSISTENT_TIE_BREAKING"
    | "MISSING_ALTERNATIVES"
    | "MISSING_REJECTED_EXPLANATIONS"
    | "HIDDEN_REASONING"
    | "UNTRACEABLE_RECOMMENDATION"
    | "MISSING_GOVERNANCE_RATIONALE"
    | "MISSING_CONSTITUTIONAL_RATIONALE"
    | "REPLAY_INCONSISTENCY"
    | "DECISION_INCONSISTENCY"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "CROSS_TENANT"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type DecisionIntelligenceCertificationResult = Readonly<{
  certification_version: "decision-intelligence-certification/v1";
  governance_certification: GovernanceConstitutionalCertificationResult;
  context_report: ContextCompletenessReport;
  dependency_report: DependencyAccuracyReport;
  conflict_arbitration_report: ConflictArbitrationReport;
  priority_report: PriorityReproducibilityReport;
  alternative_explainability_report: AlternativeExplainabilityReport;
  consistency_report: DecisionConsistencyReport;
  evidence_package: DecisionIntelligenceEvidencePackage;
  explainability_report: ExplainabilityValidationReport;
  intelligence_ledger: readonly DecisionIntelligenceLedgerEntry[];
  validation: DecisionIntelligenceCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_reasoning_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionIntelligenceCertificationFoundation = Readonly<{
  certification_version: "decision-intelligence-certification/v1";
  scopes: readonly DecisionIntelligenceScope[];
  checks: readonly DecisionIntelligenceCheck[];
  result: DecisionIntelligenceCertificationResult;
}>;
