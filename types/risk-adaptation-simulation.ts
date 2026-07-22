import type { GovernanceRiskResult } from "@/types/governance-aware-risk-adaptation";
import type { RiskAdaptationFoundationResult } from "@/types/risk-adaptation-engine-foundation";

export type RiskAdaptationSimulationType = "HISTORICAL_REPLAY" | "PREDICTIVE_FORECAST" | "CALIBRATION_COMPARISON" | "SCENARIO_EVALUATION" | "IMPROVEMENT_ANALYSIS" | "ESCALATION_BEHAVIOR" | "ROLLBACK_BEHAVIOR" | "GOVERNANCE_OUTCOME" | "COMPOSITE_SIMULATION";
export type RiskAdaptationSimulationScenarioCategory = "NORMAL_OPERATIONS" | "ELEVATED_OPERATIONAL_RISK" | "CRITICAL_INCIDENT" | "GOVERNANCE_ESCALATION" | "CONSTITUTIONAL_REVIEW" | "INFRASTRUCTURE_DISRUPTION" | "RECOVERY_OPERATIONS" | "CROSS_TENANT_ISOLATION";
export type RiskAdaptationSimulationValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskAdaptationSimulationFailure =
  | "PROPOSAL_INPUTS_MISSING"
  | "HISTORICAL_REPLAY_FAILED"
  | "DETERMINISTIC_EXECUTION_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "IMPROVEMENT_MEASUREMENTS_MISSING"
  | "GOVERNANCE_PRESERVATION_FAILED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "RECALIBRATION_EXECUTION_DETECTED"
  | "ESCALATION_POLICY_MUTATION_DETECTED"
  | "ROLLBACK_POLICY_MUTATION_DETECTED"
  | "GOVERNANCE_DECISION_OVERRIDE_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "HISTORICAL_EVIDENCE_REWRITE_DETECTED"
  | "PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"
  | "CERTIFICATION_STATUS_MUTATION_DETECTED"
  | "NONDETERMINISTIC_SIMULATION"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskAdaptationSimulationScenario =
  | "BASELINE"
  | "HISTORICAL_REPLAY"
  | "PREDICTIVE_FORECAST"
  | "CALIBRATION_COMPARISON"
  | "SCENARIO_EVALUATION"
  | "IMPROVEMENT_ANALYSIS"
  | "ESCALATION_BEHAVIOR"
  | "ROLLBACK_BEHAVIOR"
  | "GOVERNANCE_OUTCOME"
  | "COMPOSITE"
  | "NORMAL"
  | "ELEVATED"
  | "CRITICAL"
  | "GOVERNANCE"
  | "CONSTITUTIONAL"
  | "INFRASTRUCTURE"
  | "RECOVERY"
  | "CROSS_TENANT_SCENARIO"
  | "MISSING_PROPOSAL"
  | "REPLAY_FAILED"
  | "MISSING_DETERMINISM"
  | "MISSING_EVIDENCE"
  | "MISSING_IMPROVEMENT"
  | "GOVERNANCE_REGRESSION"
  | "CONSTITUTIONAL_FAILURE"
  | "MISSING_REPLAY"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "PRODUCTION_MUTATION"
  | "RECALIBRATION_EXECUTION"
  | "ESCALATION_POLICY_MUTATION"
  | "ROLLBACK_POLICY_MUTATION"
  | "GOVERNANCE_OVERRIDE"
  | "OPERATOR_OVERRIDE"
  | "EVIDENCE_REWRITE"
  | "PRODUCTION_APPROVAL"
  | "CERTIFICATION_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskAdaptationSimulationMetrics = Readonly<{
  prediction_accuracy: number;
  severity_accuracy: number;
  probability_accuracy: number;
  calibration_consistency: number;
  false_positive_reduction: number;
  false_negative_reduction: number;
  escalation_effectiveness: number;
  rollback_effectiveness: number;
  governance_consistency: number;
}>;

export type RiskAdaptationSimulationRecord = Readonly<{
  simulation_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: string;
  simulation_type: RiskAdaptationSimulationType;
  scenario_category: RiskAdaptationSimulationScenarioCategory;
  historical_replay_refs: readonly string[];
  forecast_scenario_refs: readonly string[];
  baseline_results: RiskAdaptationSimulationMetrics;
  proposed_results: RiskAdaptationSimulationMetrics;
  improvement_metrics: RiskAdaptationSimulationMetrics;
  false_positive_rate: number;
  false_negative_rate: number;
  escalation_results: string;
  rollback_results: string;
  governance_results: string;
  simulation_summary: string;
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  advisory_only: true;
  production_isolated: true;
  mutates_production_risk_models: false;
  executes_recalibration: false;
  changes_escalation_policies: false;
  changes_rollback_policies: false;
  overrides_governance_decisions: false;
  overrides_operator_authority: false;
  rewrites_historical_evidence: false;
  authorizes_production_deployment: false;
  modifies_certification_status: false;
}>;

export type RiskAdaptationSimulationReport = Readonly<{
  report_id: string;
  simulation_id: string;
  executive_summary: string;
  historical_replay_summary: string;
  forecast_summary: string;
  comparison_summary: string;
  improvement_summary: string;
  governance_outcome_summary: string;
  risk_forecast_summary: string;
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  immutable: true;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  simulation_refs: readonly string[];
  report_refs: readonly string[];
  type_index: Readonly<Record<RiskAdaptationSimulationType, readonly string[]>>;
  scenario_index: Readonly<Record<RiskAdaptationSimulationScenarioCategory, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationValidation = Readonly<{
  validation_id: string;
  state: RiskAdaptationSimulationValidationState;
  certified: boolean;
  failures: readonly RiskAdaptationSimulationFailure[];
  proposal_inputs_complete: boolean;
  historical_replay_successful: boolean;
  deterministic_execution_complete: boolean;
  evidence_complete: boolean;
  improvement_measurements_complete: boolean;
  governance_preserved: boolean;
  constitutional_compliant: boolean;
  replay_complete: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  production_isolated: boolean;
  no_production_mutation: boolean;
  no_recalibration_execution: boolean;
  no_policy_mutation: boolean;
  no_governance_override: boolean;
  no_operator_override: boolean;
  no_evidence_rewrite: boolean;
  no_production_approval: boolean;
  no_certification_mutation: boolean;
  deterministic: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationApiSurface = Readonly<{
  api_id: string;
  run_simulation: "POST /risk-adaptation-simulation/run";
  retrieve_records: "POST /risk-adaptation-simulation/records";
  retrieve_report: "POST /risk-adaptation-simulation/report";
  retrieve_metrics: "POST /risk-adaptation-simulation/metrics";
  retrieve_ledger: "POST /risk-adaptation-simulation/ledger";
  retrieve_validation: "POST /risk-adaptation-simulation/validation";
  replay_simulation: "POST /risk-adaptation-simulation/replay";
  retrieve_contract: "GET /risk-adaptation-simulation/contract";
  update_supported: false;
  delete_supported: false;
  production_mutation_supported: false;
  policy_mutation_supported: false;
  production_deployment_approval_supported: false;
  certification_mutation_supported: false;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationInput = Readonly<{
  scenario?: RiskAdaptationSimulationScenario;
  foundation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceRiskResult;
}>;

export type RiskAdaptationSimulationResult = Readonly<{
  risk_adaptation_simulation_version: "risk-adaptation-simulation/v1";
  api_surface: RiskAdaptationSimulationApiSurface;
  records: readonly RiskAdaptationSimulationRecord[];
  report: RiskAdaptationSimulationReport;
  ledger: RiskAdaptationSimulationLedger;
  validation: RiskAdaptationSimulationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  production_isolated: true;
  mutates_production_risk_models: false;
  executes_recalibration: false;
  changes_escalation_policies: false;
  changes_rollback_policies: false;
  authorizes_production_deployment: false;
  modifies_certification_status: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationFoundation = Readonly<{
  risk_adaptation_simulation_version: "risk-adaptation-simulation/v1";
  api_surface: RiskAdaptationSimulationApiSurface;
  result: RiskAdaptationSimulationResult;
}>;
