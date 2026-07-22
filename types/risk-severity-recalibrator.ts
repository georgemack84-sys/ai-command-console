import type { RiskSeverity } from "@/types/risk-actualization-analyzer";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";
import type { RiskDriftResult } from "@/types/risk-drift-detector";

export type RiskSeverityCalibrationType = "SEVERITY_ADJUSTMENT" | "PROBABILITY_ADJUSTMENT" | "IMPACT_ADJUSTMENT" | "ESCALATION_THRESHOLD_REFINEMENT" | "ROLLBACK_THRESHOLD_REFINEMENT" | "EVIDENCE_REQUIREMENT" | "ENHANCED_MONITORING" | "GOVERNANCE_ESCALATION" | "SIMULATION_REQUIREMENT";
export type RiskSeverityCalibrationRating = "ACCURATE" | "SEVERITY_INFLATED" | "SEVERITY_SUPPRESSED" | "PROBABILITY_OVERESTIMATED" | "PROBABILITY_UNDERESTIMATED" | "IMPACT_MISCALIBRATED" | "ESCALATION_THRESHOLD_MISCALIBRATED" | "ROLLBACK_THRESHOLD_MISCALIBRATED" | "UNSTABLE" | "INSUFFICIENT_DATA";
export type RiskSeverityRecommendationStrength = "OBSERVE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskSeverityRecalibrationValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskSeverityRecalibrationFailure =
  | "HISTORICAL_ASSESSMENTS_MISSING"
  | "ACTUAL_OUTCOMES_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "DETERMINISTIC_CALCULATION_MISSING"
  | "EXPLAINABLE_LOGIC_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "SIMULATION_REQUIREMENT_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_SEVERITY_MODEL_MUTATION_DETECTED"
  | "PRODUCTION_PROBABILITY_MODEL_MUTATION_DETECTED"
  | "ESCALATION_THRESHOLD_MUTATION_DETECTED"
  | "ROLLBACK_POLICY_MUTATION_DETECTED"
  | "GOVERNANCE_POLICY_MUTATION_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "HISTORICAL_EVIDENCE_REWRITE_DETECTED"
  | "MISSION_HISTORY_REWRITE_DETECTED"
  | "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"
  | "NONDETERMINISTIC_RECALIBRATION"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskSeverityRecalibrationScenario =
  | "BASELINE"
  | "ACCURATE"
  | "SEVERITY_INFLATED"
  | "SEVERITY_SUPPRESSED"
  | "PROBABILITY_OVERESTIMATED"
  | "PROBABILITY_UNDERESTIMATED"
  | "IMPACT_MISCALIBRATED"
  | "ESCALATION_THRESHOLD"
  | "ROLLBACK_THRESHOLD"
  | "EVIDENCE_REQUIREMENT"
  | "ENHANCED_MONITORING"
  | "GOVERNANCE_ESCALATION"
  | "SIMULATION_REQUIREMENT"
  | "UNSTABLE"
  | "MISSING_ASSESSMENTS"
  | "MISSING_OUTCOMES"
  | "MISSING_EVIDENCE"
  | "MISSING_CALCULATION"
  | "MISSING_EXPLANATION"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "BROKEN_LINEAGE"
  | "MISSING_SIMULATION"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "SEVERITY_MODEL_MUTATION"
  | "PROBABILITY_MODEL_MUTATION"
  | "ESCALATION_THRESHOLD_MUTATION"
  | "ROLLBACK_POLICY_MUTATION"
  | "GOVERNANCE_POLICY_MUTATION"
  | "OPERATOR_OVERRIDE"
  | "EVIDENCE_REWRITE"
  | "MISSION_HISTORY_REWRITE"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskSeverityRecalibrationRecord = Readonly<{
  recalibration_id: string;
  tenant_id: string;
  mission_scope: string;
  risk_domain: RiskAdaptationDomain;
  historical_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  calibration_type: RiskSeverityCalibrationType;
  current_value: string;
  proposed_value: string;
  current_severity: RiskSeverity;
  observed_severity: RiskSeverity;
  proposed_severity: RiskSeverity;
  adjustment_reason: string;
  supporting_evidence_refs: readonly string[];
  expected_improvement: number;
  governance_impact: string;
  constitutional_impact: string;
  simulation_required: boolean;
  operator_review_required: boolean;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  advisory_only: true;
  observational_only: true;
  mutates_production_severity_models: false;
  mutates_production_probability_models: false;
  changes_escalation_thresholds: false;
  changes_rollback_policies: false;
  changes_governance_policy: false;
  overrides_operator_authority: false;
  rewrites_historical_evidence: false;
  rewrites_mission_history: false;
  suppresses_constitutional_risk: false;
}>;

export type RiskSeverityCalibrationAnalysis = Readonly<{
  analysis_id: string;
  recalibration_id: string;
  calibration_rating: RiskSeverityCalibrationRating;
  severity_calibration_score: number;
  probability_calibration_score: number;
  impact_calibration_score: number;
  escalation_threshold_score: number;
  rollback_threshold_score: number;
  severity_variance: number;
  probability_variance: number;
  impact_variance: number;
  threshold_variance: number;
  historical_comparison: readonly number[];
  integrity_hash: string;
}>;

export type RiskSeverityRecalibrationProposal = Readonly<{
  proposal_id: string;
  recalibration_id: string;
  category: RiskSeverityCalibrationType;
  recommendation_strength: RiskSeverityRecommendationStrength;
  recommended_adjustment: string;
  expected_accuracy_gain: number;
  false_positive_reduction: number;
  false_negative_reduction: number;
  governance_review_required: boolean;
  simulation_scope: string;
  approval_requirements: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskSeverityRecalibrationEvidenceRegistry = Readonly<{
  evidence_registry_id: string;
  recalibration_id: string;
  historical_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  calibration_analysis_refs: readonly string[];
  drift_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskSeverityRecalibrationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  recalibration_refs: readonly string[];
  analysis_refs: readonly string[];
  proposal_refs: readonly string[];
  evidence_registry_refs: readonly string[];
  rating_index: Readonly<Record<RiskSeverityCalibrationRating, readonly string[]>>;
  type_index: Readonly<Record<RiskSeverityCalibrationType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskSeverityRecalibrationValidation = Readonly<{
  validation_id: string;
  state: RiskSeverityRecalibrationValidationState;
  certified: boolean;
  failures: readonly RiskSeverityRecalibrationFailure[];
  historical_assessments_complete: boolean;
  actual_outcomes_complete: boolean;
  evidence_complete: boolean;
  deterministic_calculations_complete: boolean;
  explainable_logic_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  lineage_complete: boolean;
  simulation_ready: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  advisory_only: boolean;
  observational_only: boolean;
  no_production_severity_model_mutation: boolean;
  no_production_probability_model_mutation: boolean;
  no_escalation_threshold_mutation: boolean;
  no_rollback_policy_mutation: boolean;
  no_governance_policy_mutation: boolean;
  no_operator_override: boolean;
  no_historical_evidence_rewrite: boolean;
  no_mission_history_rewrite: boolean;
  no_constitutional_suppression: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskSeverityRecalibratorApiSurface = Readonly<{
  api_id: string;
  analyze_recalibration: "POST /risk-severity-recalibrator/analyze";
  retrieve_records: "POST /risk-severity-recalibrator/records";
  retrieve_calibration: "POST /risk-severity-recalibrator/calibration";
  retrieve_probability: "POST /risk-severity-recalibrator/probability";
  retrieve_impact: "POST /risk-severity-recalibrator/impact";
  retrieve_thresholds: "POST /risk-severity-recalibrator/thresholds";
  retrieve_escalation: "POST /risk-severity-recalibrator/escalation";
  retrieve_rollback: "POST /risk-severity-recalibrator/rollback";
  retrieve_proposals: "POST /risk-severity-recalibrator/proposals";
  retrieve_governance: "POST /risk-severity-recalibrator/governance";
  retrieve_evidence: "POST /risk-severity-recalibrator/evidence";
  retrieve_ledger: "POST /risk-severity-recalibrator/ledger";
  retrieve_validation: "POST /risk-severity-recalibrator/validation";
  replay_analysis: "POST /risk-severity-recalibrator/replay";
  retrieve_contract: "GET /risk-severity-recalibrator/contract";
  update_supported: false;
  delete_supported: false;
  production_severity_mutation_supported: false;
  production_probability_mutation_supported: false;
  escalation_threshold_mutation_supported: false;
  rollback_policy_mutation_supported: false;
  governance_policy_mutation_supported: false;
  integrity_hash: string;
}>;

export type RiskSeverityRecalibrationInput = Readonly<{
  scenario?: RiskSeverityRecalibrationScenario;
  drift_result?: RiskDriftResult;
}>;

export type RiskSeverityRecalibrationResult = Readonly<{
  risk_severity_recalibrator_version: "risk-severity-recalibrator/v1";
  api_surface: RiskSeverityRecalibratorApiSurface;
  records: readonly RiskSeverityRecalibrationRecord[];
  calibration_analysis: RiskSeverityCalibrationAnalysis;
  proposals: readonly RiskSeverityRecalibrationProposal[];
  evidence_registry: RiskSeverityRecalibrationEvidenceRegistry;
  ledger: RiskSeverityRecalibrationLedger;
  validation: RiskSeverityRecalibrationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  simulation_ready: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  observational_only: true;
  mutates_production_severity_models: false;
  mutates_production_probability_models: false;
  changes_escalation_thresholds: false;
  changes_rollback_policies: false;
  changes_governance_policy: false;
  changes_constitutional_safeguards: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskSeverityRecalibratorFoundation = Readonly<{
  risk_severity_recalibrator_version: "risk-severity-recalibrator/v1";
  api_surface: RiskSeverityRecalibratorApiSurface;
  result: RiskSeverityRecalibrationResult;
}>;
