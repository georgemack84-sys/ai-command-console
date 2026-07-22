import type { RiskActualizationResult } from "@/types/risk-actualization-analyzer";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";

export type RiskDriftType = "SEVERITY_DRIFT" | "PROBABILITY_DRIFT" | "ESCALATION_DRIFT" | "GOVERNANCE_DRIFT" | "MISSION_TYPE_DRIFT" | "OPERATOR_SPECIFIC_DRIFT" | "TENANT_SPECIFIC_DRIFT" | "DOMAIN_DRIFT" | "ENVIRONMENTAL_DRIFT" | "COMPOSITE_PREDICTION_DRIFT";
export type RiskDriftClassification = "IMPROVING" | "STABLE" | "MINOR_DRIFT" | "MODERATE_DRIFT" | "SIGNIFICANT_DRIFT" | "CRITICAL_DRIFT" | "GOVERNANCE_SENSITIVE_DRIFT" | "CONSTITUTIONAL_DRIFT" | "TENANT_SPECIFIC_DRIFT" | "DOMAIN_SPECIFIC_DRIFT";
export type RiskTrendDirection = "IMPROVING" | "STABLE" | "DEGRADING" | "VOLATILE";
export type RiskDriftValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskDriftFailure =
  | "HISTORICAL_DATASET_MISSING"
  | "EVIDENCE_MISSING"
  | "STATISTICAL_CONSISTENCY_MISSING"
  | "MULTI_MISSION_VALIDATION_MISSING"
  | "CONFIDENCE_THRESHOLD_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "RISK_THRESHOLD_MUTATION_DETECTED"
  | "EVIDENCE_REWRITE_DETECTED"
  | "MISSION_HISTORY_REWRITE_DETECTED"
  | "GOVERNANCE_POLICY_MUTATION_DETECTED"
  | "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "NONDETERMINISTIC_DRIFT_ANALYSIS"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskDriftScenario =
  | "BASELINE"
  | "IMPROVING"
  | "STABLE"
  | "MINOR"
  | "MODERATE"
  | "SIGNIFICANT"
  | "CRITICAL"
  | "GOVERNANCE_SENSITIVE"
  | "CONSTITUTIONAL"
  | "TENANT_SPECIFIC"
  | "DOMAIN_SPECIFIC"
  | "SEVERITY"
  | "PROBABILITY"
  | "ESCALATION"
  | "GOVERNANCE"
  | "MISSION"
  | "OPERATOR"
  | "TENANT"
  | "DOMAIN"
  | "ENVIRONMENTAL"
  | "COMPOSITE"
  | "MISSING_HISTORY"
  | "MISSING_EVIDENCE"
  | "MISSING_STATISTICS"
  | "MISSING_MULTI_MISSION"
  | "MISSING_CONFIDENCE_THRESHOLD"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "PRODUCTION_MUTATION"
  | "THRESHOLD_MUTATION"
  | "EVIDENCE_REWRITE"
  | "MISSION_HISTORY_REWRITE"
  | "GOVERNANCE_POLICY_MUTATION"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "OPERATOR_OVERRIDE"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskDriftRecord = Readonly<{
  risk_drift_id: string;
  tenant_id: string;
  mission_scope: string;
  risk_domain: RiskAdaptationDomain;
  drift_type: RiskDriftType;
  drift_classification: RiskDriftClassification;
  analysis_period: string;
  baseline_period: string;
  comparison_period: string;
  historical_accuracy_refs: readonly string[];
  drift_score: number;
  confidence_interval: readonly [number, number];
  trend_direction: RiskTrendDirection;
  drift_summary: string;
  supporting_evidence_refs: readonly string[];
  governance_impact: string;
  operator_impact: string;
  recommended_review: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  created_at: string;
  advisory_only: true;
  observational_only: true;
  updates_risk_model: false;
  updates_risk_thresholds: false;
  rewrites_evidence: false;
  rewrites_mission_history: false;
  changes_governance_policy: false;
  suppresses_constitutional_risk: false;
  overrides_operator_authority: false;
  integrity_hash: string;
}>;

export type RiskTrendAnalysis = Readonly<{
  trend_id: string;
  drift_record_id: string;
  direction_of_change: RiskTrendDirection;
  rate_of_change: number;
  stability_measurement: number;
  historical_progression: readonly number[];
  comparative_baseline: number;
  trend_explanation: string;
  integrity_hash: string;
}>;

export type RiskDriftTimeline = Readonly<{
  timeline_id: string;
  drift_record_id: string;
  drift_initiation: string;
  drift_acceleration: string;
  stable_periods: readonly string[];
  recovery_periods: readonly string[];
  significant_events: readonly string[];
  governance_interventions: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskDriftEvidenceRegistry = Readonly<{
  evidence_registry_id: string;
  drift_record_id: string;
  evidence_refs: readonly string[];
  historical_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  multi_mission_validation_refs: readonly string[];
  confidence_threshold_refs: readonly string[];
  false_positive_mitigation_applied: boolean;
  integrity_hash: string;
}>;

export type RiskDriftLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  drift_record_refs: readonly string[];
  trend_refs: readonly string[];
  timeline_refs: readonly string[];
  evidence_registry_refs: readonly string[];
  classification_index: Readonly<Record<RiskDriftClassification, readonly string[]>>;
  type_index: Readonly<Record<RiskDriftType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskDriftValidation = Readonly<{
  validation_id: string;
  state: RiskDriftValidationState;
  certified: boolean;
  failures: readonly RiskDriftFailure[];
  historical_dataset_complete: boolean;
  evidence_complete: boolean;
  statistical_consistency_complete: boolean;
  multi_mission_validation_complete: boolean;
  confidence_threshold_validation_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  false_positive_mitigation_verified: boolean;
  advisory_only: boolean;
  observational_only: boolean;
  no_production_mutation: boolean;
  no_threshold_mutation: boolean;
  no_evidence_rewrite: boolean;
  no_history_rewrite: boolean;
  no_governance_policy_mutation: boolean;
  no_constitutional_suppression: boolean;
  no_operator_override: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskDriftApiSurface = Readonly<{
  api_id: string;
  analyze_drift: "POST /risk-drift-detector/analyze";
  retrieve_records: "POST /risk-drift-detector/records";
  retrieve_trends: "POST /risk-drift-detector/trends";
  retrieve_confidence: "POST /risk-drift-detector/confidence";
  retrieve_timeline: "POST /risk-drift-detector/timeline";
  retrieve_evidence: "POST /risk-drift-detector/evidence";
  retrieve_ledger: "POST /risk-drift-detector/ledger";
  retrieve_severity: "POST /risk-drift-detector/severity";
  retrieve_probability: "POST /risk-drift-detector/probability";
  retrieve_escalation: "POST /risk-drift-detector/escalation";
  retrieve_governance: "POST /risk-drift-detector/governance";
  retrieve_mission: "POST /risk-drift-detector/mission";
  retrieve_operator: "POST /risk-drift-detector/operator";
  retrieve_tenant: "POST /risk-drift-detector/tenant";
  retrieve_domain: "POST /risk-drift-detector/domain";
  retrieve_validation: "POST /risk-drift-detector/validation";
  replay_analysis: "POST /risk-drift-detector/replay";
  retrieve_contract: "GET /risk-drift-detector/contract";
  update_supported: false;
  delete_supported: false;
  production_risk_mutation_supported: false;
  threshold_mutation_supported: false;
  governance_policy_mutation_supported: false;
  constitutional_suppression_supported: false;
  integrity_hash: string;
}>;

export type RiskDriftInput = Readonly<{
  scenario?: RiskDriftScenario;
  actualization_result?: RiskActualizationResult;
}>;

export type RiskDriftResult = Readonly<{
  risk_drift_detector_version: "risk-drift-detector/v1";
  api_surface: RiskDriftApiSurface;
  records: readonly RiskDriftRecord[];
  trend: RiskTrendAnalysis;
  timeline: RiskDriftTimeline;
  evidence_registry: RiskDriftEvidenceRegistry;
  ledger: RiskDriftLedger;
  validation: RiskDriftValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  observational_only: true;
  updates_risk_model: false;
  updates_risk_thresholds: false;
  changes_governance_policy: false;
  changes_constitutional_safeguards: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskDriftFoundation = Readonly<{
  risk_drift_detector_version: "risk-drift-detector/v1";
  api_surface: RiskDriftApiSurface;
  result: RiskDriftResult;
}>;
