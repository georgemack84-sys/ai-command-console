import type { HistoricalReplayHarnessResult } from "@/types/historical-replay-test-harness";

export type CounterfactualSimulationOutcome =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL"
  | "INCONCLUSIVE"
  | "REQUIRES_MORE_EVIDENCE"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_REVIEW";

export type CounterfactualSimulationScope =
  | "ALTERNATE_RECOMMENDATION_PATHS"
  | "ALTERNATE_CONFIDENCE_SCORES"
  | "ALTERNATE_RISK_ASSESSMENTS"
  | "ALTERNATE_PRIORITIZATION"
  | "ALTERNATE_GOVERNANCE_ROUTING"
  | "ALTERNATE_ESCALATION_BEHAVIOR";

export type CounterfactualMeasurementDimension =
  | "IMPROVEMENT"
  | "DEGRADATION"
  | "UNINTENDED_CONSEQUENCES"
  | "MISSED_OPPORTUNITIES"
  | "INCREASED_RISK"
  | "GOVERNANCE_VIOLATIONS"
  | "OPERATOR_IMPACT";

export type CounterfactualSimulationFailure =
  | "HISTORICAL_REPLAY_BASELINE_UNAVAILABLE"
  | "NONDETERMINISTIC_SIMULATION"
  | "INCONSISTENT_REPLAY"
  | "UNEXPLAINED_BEHAVIORAL_CHANGES"
  | "RECOMMENDATION_INSTABILITY"
  | "CONFIDENCE_INSTABILITY"
  | "RISK_INSTABILITY"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "APPROVAL_WORKFLOW_BYPASS"
  | "UNAUTHORIZED_ESCALATION"
  | "TENANT_ISOLATION_BREACH"
  | "MISSING_EVIDENCE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "SIMULATION_STATE_CORRUPTION"
  | "MULTIPLE_VARIABLES_CHANGED"
  | "HISTORICAL_TRUTH_MUTATION_ATTEMPT"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "IMPLEMENTATION_AUTHORIZATION_ATTEMPT";

export type CounterfactualSimulationScenario =
  | "BASELINE"
  | "CONDITIONAL_EVIDENCE"
  | "INCONCLUSIVE"
  | "NONDETERMINISTIC"
  | "INCONSISTENT_REPLAY"
  | "UNEXPLAINED_CHANGE"
  | "RECOMMENDATION_INSTABILITY"
  | "CONFIDENCE_INSTABILITY"
  | "RISK_INSTABILITY"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "APPROVAL_WORKFLOW_BYPASS"
  | "UNAUTHORIZED_ESCALATION"
  | "TENANT_ISOLATION_BREACH"
  | "MISSING_EVIDENCE"
  | "INTEGRITY_FAILURE"
  | "SIMULATION_STATE_CORRUPTION"
  | "MULTIPLE_VARIABLES_CHANGED"
  | "HISTORICAL_TRUTH_MUTATION"
  | "PRODUCTION_MUTATION"
  | "IMPLEMENTATION_AUTHORIZATION";

export type CounterfactualMeasurement = Readonly<{
  dimension: CounterfactualMeasurementDimension;
  measures: readonly string[];
  score: number;
  explanation: string;
  failures: readonly CounterfactualSimulationFailure[];
  integrity_hash: string;
}>;

export type CounterfactualSimulationRecord = Readonly<{
  simulation_id: string;
  proposal_id: string;
  tenant_id: string;
  historical_replay_reference: string;
  simulation_scope: readonly CounterfactualSimulationScope[];
  adaptation_version: string;
  alternate_recommendations: readonly string[];
  alternate_confidence: readonly string[];
  alternate_risk: readonly string[];
  alternate_prioritization: readonly string[];
  alternate_governance: readonly string[];
  alternate_escalation: readonly string[];
  improvement_metrics: CounterfactualMeasurement;
  degradation_metrics: CounterfactualMeasurement;
  unintended_consequences: CounterfactualMeasurement;
  missed_opportunities: CounterfactualMeasurement;
  governance_impact: CounterfactualMeasurement;
  operator_impact: CounterfactualMeasurement;
  replay_reproducible: boolean;
  simulation_result: CounterfactualSimulationOutcome;
  explanation: string;
  integrity_hash: string;
}>;

export type CounterfactualSimulationMetrics = Readonly<{
  simulation_scopes_evaluated: number;
  measurement_dimensions_evaluated: number;
  deterministic_replay_rate: number;
  adaptation_single_variable_preserved: boolean;
  improvement_score: number;
  degradation_score: number;
  unintended_consequence_score: number;
  missed_opportunity_score: number;
  increased_risk_score: number;
  governance_preservation_rate: number;
  operator_preservation_rate: number;
  explanation_completeness_rate: number;
  failures: readonly CounterfactualSimulationFailure[];
  integrity_hash: string;
}>;

export type CounterfactualSimulationApiSurface = Readonly<{
  api_id: string;
  simulate_counterfactual: "POST /counterfactual-adaptation-simulator/simulate";
  retrieve_scopes: "POST /counterfactual-adaptation-simulator/scopes";
  retrieve_measurements: "POST /counterfactual-adaptation-simulator/measurements";
  retrieve_metrics: "POST /counterfactual-adaptation-simulator/metrics";
  replay_simulation: "POST /counterfactual-adaptation-simulator/replay";
  inspect_simulator: "POST /counterfactual-adaptation-simulator/inspect";
  retrieve_contract: "GET /counterfactual-adaptation-simulator/contract";
  historical_truth_mutation_supported: false;
  production_mutation_supported: false;
  implementation_authorization_supported: false;
  autonomous_optimization_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type CounterfactualSimulationInput = Readonly<{
  scenario?: CounterfactualSimulationScenario;
  proposal_id?: string;
  tenant_id?: string;
  adaptation_version?: string;
  historical_replay?: HistoricalReplayHarnessResult;
}>;

export type CounterfactualSimulationResult = Readonly<{
  counterfactual_adaptation_simulator_version: "counterfactual-adaptation-simulator/v1";
  simulator_identifier: "CounterfactualAdaptationSimulator";
  api_surface: CounterfactualSimulationApiSurface;
  historical_replay: HistoricalReplayHarnessResult;
  supported_scopes: readonly CounterfactualSimulationScope[];
  measurement_dimensions: readonly CounterfactualMeasurementDimension[];
  simulation_record: CounterfactualSimulationRecord;
  measurements: readonly CounterfactualMeasurement[];
  metrics: CounterfactualSimulationMetrics;
  outcome: CounterfactualSimulationOutcome;
  failures: readonly CounterfactualSimulationFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  single_variable_preserved: boolean;
  immutable_history_preserved: true;
  isolated_simulation_environment: true;
  tenant_isolated: boolean;
  governance_preserved: boolean;
  constitutional_behavior_preserved: boolean;
  operator_authority_preserved: boolean;
  advisory_only: true;
  modifies_historical_truth: false;
  modifies_production_state: false;
  authorizes_implementation: false;
  counterfactual_replay_package_hash: string;
  improvement_analysis_report_hash: string;
  side_effect_analysis_report_hash: string;
  governance_impact_report_hash: string;
  operator_impact_report_hash: string;
  simulation_validation_ledger_entry_hash: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CounterfactualSimulationFoundation = Readonly<{
  counterfactual_adaptation_simulator_version: "counterfactual-adaptation-simulator/v1";
  supported_scopes: readonly CounterfactualSimulationScope[];
  measurement_dimensions: readonly CounterfactualMeasurementDimension[];
  api_surface: CounterfactualSimulationApiSurface;
  result: CounterfactualSimulationResult;
}>;
