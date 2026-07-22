import type { GovernanceConstitutionalStrategyReviewResult } from "@/types/governance-constitutional-strategy-review";

export type StrategySimulationScenarioType =
  | "HISTORICAL_REPLAY"
  | "COUNTERFACTUAL_REPLAY"
  | "MISSION_SUCCESS_OPTIMIZATION"
  | "MISSION_FAILURE_RECOVERY"
  | "RISK_ESCALATION"
  | "GOVERNANCE_STRESS"
  | "EVIDENCE_DEGRADATION"
  | "OPERATOR_WORKFLOW"
  | "ROLLBACK_RECOVERY"
  | "ADVERSARIAL_CONDITIONS";

export type StrategySimulationReadinessStatus = "READY_FOR_SIMULATION" | "FAILED_VALIDATION" | "REQUIRES_REVISION";
export type StrategySimulationLifecycleState = "BOUND" | "READY_FOR_SIMULATION" | "SIMULATION_EXECUTED" | "COMPARATIVE_ANALYSIS_COMPLETE" | "RESULTS_VALIDATED" | "RECORDED" | "FAILED_VALIDATION" | "REQUIRES_REVISION";
export type StrategySimulationValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_SIMULATION_INPUTS";

export type StrategySimulationBindingFailure =
  | "GOVERNANCE_REVIEW_UNCERTIFIED"
  | "SIMULATION_SCENARIO_NOT_ASSIGNED"
  | "HISTORICAL_REPLAY_UNAVAILABLE"
  | "COUNTERFACTUAL_ANALYSIS_OMITTED"
  | "STRESS_TESTING_OMITTED"
  | "COMPARATIVE_ANALYSIS_INCOMPLETE"
  | "EXPECTED_BENEFITS_NOT_MEASURED"
  | "EXPECTED_RISKS_NOT_EVALUATED"
  | "UNINTENDED_CONSEQUENCES_NOT_ANALYZED"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "ROLLBACK_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "REGISTRY_MUTATION_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategySimulationBindingScenario =
  | "BASELINE"
  | "READY"
  | "REQUIRES_REVISION"
  | "FAILED_VALIDATION"
  | "UNCERTIFIED_REVIEW"
  | "MISSING_SCENARIO"
  | "MISSING_HISTORICAL_REPLAY"
  | "MISSING_COUNTERFACTUAL"
  | "MISSING_STRESS"
  | "MISSING_COMPARATIVE"
  | "MISSING_BENEFITS"
  | "MISSING_RISKS"
  | "MISSING_CONSEQUENCES"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "REGISTRY_MUTATION"
  | "SIMULATION_BYPASS"
  | "ADVISORY_VIOLATION"
  | "FAIL_OPEN";

export type StrategySimulationBinding = Readonly<{
  simulation_binding_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  simulation_scenarios: readonly StrategySimulationScenarioType[];
  historical_replay_refs: readonly string[];
  counterfactual_refs: readonly string[];
  stress_test_refs: readonly string[];
  governance_validation_refs: readonly string[];
  comparative_baseline_refs: readonly string[];
  expected_benefits: readonly string[];
  expected_risks: readonly string[];
  unintended_consequence_summary: string;
  simulation_readiness_status: StrategySimulationReadinessStatus;
  replay_refs: readonly string[];
  rollback_refs: readonly string[];
  lifecycle_state: StrategySimulationLifecycleState;
  simulation_execution_authorized: false;
  advisory_only: true;
  mutates_strategy: false;
  integrity_hash: string;
}>;

export type StrategySimulationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  simulation_binding_refs: readonly string[];
  readiness_index: Readonly<Record<StrategySimulationReadinessStatus, readonly string[]>>;
  scenario_index: Readonly<Record<StrategySimulationScenarioType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategySimulationValidation = Readonly<{
  validation_id: string;
  state: StrategySimulationValidationState;
  certified: boolean;
  failures: readonly StrategySimulationBindingFailure[];
  governance_review_certified: boolean;
  scenario_assigned: boolean;
  historical_replay_available: boolean;
  counterfactual_complete: boolean;
  stress_testing_complete: boolean;
  comparative_analysis_complete: boolean;
  benefits_measured: boolean;
  risks_evaluated: boolean;
  unintended_consequences_analyzed: boolean;
  governance_validation_complete: boolean;
  replay_complete: boolean;
  rollback_complete: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  simulation_bypass_prevented: boolean;
  advisory_only: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type StrategySimulationApiSurface = Readonly<{
  api_id: string;
  bind_simulation: "POST /strategy-simulation-binding-engine/bind";
  retrieve_bindings: "POST /strategy-simulation-binding-engine/bindings";
  retrieve_scenarios: "POST /strategy-simulation-binding-engine/scenarios";
  retrieve_historical_replay: "POST /strategy-simulation-binding-engine/historical-replay";
  retrieve_counterfactual: "POST /strategy-simulation-binding-engine/counterfactual";
  retrieve_stress: "POST /strategy-simulation-binding-engine/stress";
  retrieve_comparative: "POST /strategy-simulation-binding-engine/comparative";
  retrieve_risk: "POST /strategy-simulation-binding-engine/risk";
  retrieve_governance: "POST /strategy-simulation-binding-engine/governance";
  replay_binding: "POST /strategy-simulation-binding-engine/replay";
  retrieve_registry: "POST /strategy-simulation-binding-engine/registry";
  retrieve_contract: "GET /strategy-simulation-binding-engine/contract";
  update_supported: false;
  delete_supported: false;
  simulation_bypass_supported: false;
  adoption_authorization_supported: false;
  integrity_hash: string;
}>;

export type StrategySimulationBindingInput = Readonly<{
  review_result?: GovernanceConstitutionalStrategyReviewResult;
  scenario?: StrategySimulationBindingScenario;
}>;

export type StrategySimulationBindingResult = Readonly<{
  strategy_simulation_binding_engine_version: "strategy-simulation-binding-engine/v1";
  review_result: GovernanceConstitutionalStrategyReviewResult;
  api_surface: StrategySimulationApiSurface;
  bindings: readonly StrategySimulationBinding[];
  registry: StrategySimulationRegistry;
  validation: StrategySimulationValidation;
  deterministic: true;
  replayable: true;
  simulation_mandatory: true;
  simulation_ready: boolean;
  tenant_isolated: boolean;
  governance_validated: boolean;
  advisory_only: boolean;
  mutates_strategy: false;
  authorizes_adoption: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategySimulationBindingFoundation = Readonly<{
  strategy_simulation_binding_engine_version: "strategy-simulation-binding-engine/v1";
  api_surface: StrategySimulationApiSurface;
  result: StrategySimulationBindingResult;
}>;
