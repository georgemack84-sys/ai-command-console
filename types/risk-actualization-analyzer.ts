import type { RiskAdaptationFoundationResult } from "@/types/risk-adaptation-engine-foundation";

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskActualizationClassification = "ACCURATE" | "UNDERESTIMATED" | "OVERESTIMATED" | "MISSED" | "CORRECTLY_MITIGATED";
export type RiskActualizationValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskActualizationFailure =
  | "HISTORICAL_RISK_DATA_MISSING"
  | "OUTCOME_DATA_MISSING"
  | "EVIDENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "OUTCOME_MUTATION_DETECTED"
  | "EVIDENCE_REWRITE_DETECTED"
  | "GOVERNANCE_DECISION_REWRITE_DETECTED"
  | "AUDIT_HISTORY_REMOVAL_DETECTED"
  | "NONDETERMINISTIC_CALCULATION"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskActualizationScenario =
  | "BASELINE"
  | "ACCURATE"
  | "UNDERESTIMATED"
  | "OVERESTIMATED"
  | "MISSED"
  | "CORRECTLY_MITIGATED"
  | "ESCALATION_MISSED"
  | "ROLLBACK_MISSED"
  | "GOVERNANCE_NEEDED"
  | "MISSING_RISK_DATA"
  | "MISSING_OUTCOME"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "BROKEN_LINEAGE"
  | "MISSING_INTEGRITY"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "PRODUCTION_MUTATION"
  | "OUTCOME_MUTATION"
  | "EVIDENCE_REWRITE"
  | "GOVERNANCE_REWRITE"
  | "AUDIT_REMOVAL"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskActualizationRecord = Readonly<{
  actualization_id: string;
  tenant_id: string;
  mission_id: string;
  risk_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  predicted_severity: RiskSeverity;
  actual_severity: RiskSeverity;
  predicted_probability: number;
  actual_occurrence: boolean;
  predicted_escalation: boolean;
  actual_escalation: boolean;
  rollback_expected: boolean;
  rollback_triggered: boolean;
  governance_expected: boolean;
  governance_intervention: boolean;
  actualization_classification: RiskActualizationClassification;
  risk_accuracy_score: number;
  severity_accuracy_score: number;
  probability_accuracy_score: number;
  escalation_accuracy_score: number;
  rollback_accuracy_score: number;
  governance_accuracy_score: number;
  summary: string;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  created_at: string;
  advisory_only: true;
  observational_only: true;
  updates_risk_model: false;
  mutates_outcomes: false;
  rewrites_evidence: false;
  changes_governance_decisions: false;
  removes_audit_history: false;
  integrity_hash: string;
}>;

export type RiskComparisonReport = Readonly<{
  comparison_id: string;
  actualization_id: string;
  severity_variance: number;
  probability_variance: number;
  escalation_variance: number;
  rollback_variance: number;
  governance_variance: number;
  predicted_domains: readonly string[];
  realized_domains: readonly string[];
  predicted_mission_impact: string;
  actual_mission_impact: string;
  integrity_hash: string;
}>;

export type RiskActualizationSummary = Readonly<{
  summary_id: string;
  actualization_id: string;
  executive_summary: string;
  risk_prediction_quality: RiskActualizationClassification;
  key_variances: readonly string[];
  supporting_evidence_refs: readonly string[];
  governance_findings: readonly string[];
  operational_impact: string;
  confidence_assessment: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskActualizationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  actualization_refs: readonly string[];
  comparison_refs: readonly string[];
  summary_refs: readonly string[];
  classification_index: Readonly<Record<RiskActualizationClassification, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskActualizationValidation = Readonly<{
  validation_id: string;
  state: RiskActualizationValidationState;
  certified: boolean;
  failures: readonly RiskActualizationFailure[];
  historical_data_complete: boolean;
  outcome_data_complete: boolean;
  evidence_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  advisory_only: boolean;
  observational_only: boolean;
  no_production_mutation: boolean;
  no_outcome_mutation: boolean;
  no_evidence_rewrite: boolean;
  no_governance_rewrite: boolean;
  audit_history_preserved: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskActualizationApiSurface = Readonly<{
  api_id: string;
  analyze_actualization: "POST /risk-actualization-analyzer/analyze";
  retrieve_records: "POST /risk-actualization-analyzer/records";
  retrieve_comparison: "POST /risk-actualization-analyzer/comparison";
  retrieve_severity: "POST /risk-actualization-analyzer/severity";
  retrieve_probability: "POST /risk-actualization-analyzer/probability";
  retrieve_escalation: "POST /risk-actualization-analyzer/escalation";
  retrieve_rollback: "POST /risk-actualization-analyzer/rollback";
  retrieve_governance: "POST /risk-actualization-analyzer/governance";
  retrieve_summary: "POST /risk-actualization-analyzer/summary";
  retrieve_evidence: "POST /risk-actualization-analyzer/evidence";
  retrieve_ledger: "POST /risk-actualization-analyzer/ledger";
  retrieve_validation: "POST /risk-actualization-analyzer/validation";
  replay_analysis: "POST /risk-actualization-analyzer/replay";
  retrieve_contract: "GET /risk-actualization-analyzer/contract";
  update_supported: false;
  delete_supported: false;
  production_risk_mutation_supported: false;
  outcome_mutation_supported: false;
  evidence_rewrite_supported: false;
  governance_rewrite_supported: false;
  integrity_hash: string;
}>;

export type RiskActualizationInput = Readonly<{
  scenario?: RiskActualizationScenario;
  foundation_result?: RiskAdaptationFoundationResult;
}>;

export type RiskActualizationResult = Readonly<{
  risk_actualization_analyzer_version: "risk-actualization-analyzer/v1";
  api_surface: RiskActualizationApiSurface;
  records: readonly RiskActualizationRecord[];
  comparison: RiskComparisonReport;
  summary: RiskActualizationSummary;
  ledger: RiskActualizationLedger;
  validation: RiskActualizationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  observational_only: true;
  updates_risk_model: false;
  mutates_outcomes: false;
  rewrites_evidence: false;
  changes_governance_decisions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskActualizationFoundation = Readonly<{
  risk_actualization_analyzer_version: "risk-actualization-analyzer/v1";
  api_surface: RiskActualizationApiSurface;
  result: RiskActualizationResult;
}>;
