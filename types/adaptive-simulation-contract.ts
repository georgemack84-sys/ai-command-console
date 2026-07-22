import type { AdaptationProposalCertificationResult } from "@/types/adaptation-proposal-certification-gate";

export type AdaptiveSimulationLifecycleState =
  | "PROPOSAL_RECEIVED"
  | "VALIDATION_READY"
  | "SIMULATION_PREPARATION"
  | "SIMULATION_RUNNING"
  | "RESULT_ANALYSIS"
  | "REPLAY_VALIDATION"
  | "DIVERGENCE_ANALYSIS"
  | "CERTIFICATION_RECOMMENDATION"
  | "COMPLETE";

export type AdaptiveSimulationScope =
  | "HISTORICAL_REPLAY"
  | "COUNTERFACTUAL_REPLAY"
  | "ADAPTATION_VALIDATION"
  | "PROPOSAL_COMPARISON"
  | "GOVERNANCE_VALIDATION"
  | "RISK_SIMULATION"
  | "CONFIDENCE_SIMULATION"
  | "MISSION_SIMULATION"
  | "ROLLBACK_SIMULATION"
  | "ADVERSARIAL_SIMULATION";

export type AdaptiveSimulationContractStatus = "AUTHORITATIVE" | "FAIL_CLOSED";

export type AdaptiveSimulationContractFailure =
  | "PROPOSAL_CERTIFICATION_UNAVAILABLE"
  | "PROPOSAL_NOT_CERTIFIED"
  | "DETERMINISM_REQUIREMENT_UNSATISFIED"
  | "REPLAY_REQUIREMENT_UNSATISFIED"
  | "GOVERNANCE_REQUIREMENT_UNSATISFIED"
  | "CONSTITUTIONAL_REQUIREMENT_UNSATISFIED"
  | "AUTHORITY_REQUIREMENT_UNSATISFIED"
  | "OPERATOR_AUTHORITY_REQUIREMENT_UNSATISFIED"
  | "TENANT_ISOLATION_UNSATISFIED"
  | "ROLLBACK_VALIDATION_UNSATISFIED"
  | "IMMUTABLE_EVIDENCE_REQUIREMENT_UNSATISFIED"
  | "EXPLAINABILITY_REQUIREMENT_UNSATISFIED"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "EVIDENCE_REQUIREMENT_UNSATISFIED"
  | "INTEGRITY_VERIFICATION_UNSATISFIED"
  | "SIMULATION_STATE_CORRUPTION_DETECTED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "HISTORICAL_EVIDENCE_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "AUTHORITY_EXPANSION_ATTEMPT"
  | "AUTONOMOUS_DECISION_ATTEMPT"
  | "RISK_CONFIDENCE_MUTATION_ATTEMPT"
  | "TENANT_STATE_MUTATION_ATTEMPT";

export type AdaptiveSimulationContractScenario =
  | "BASELINE"
  | "CERTIFICATION_UNAVAILABLE"
  | "CERTIFICATION_FAIL"
  | "CERTIFICATION_CONDITIONAL"
  | "NONDETERMINISTIC"
  | "REPLAY_UNAVAILABLE"
  | "GOVERNANCE_UNSATISFIED"
  | "CONSTITUTIONAL_UNSATISFIED"
  | "AUTHORITY_UNSATISFIED"
  | "OPERATOR_AUTHORITY_UNSATISFIED"
  | "TENANT_VIOLATION"
  | "ROLLBACK_UNSATISFIED"
  | "EVIDENCE_IMMUTABILITY_FAILURE"
  | "UNEXPLAINED_DIVERGENCE"
  | "INCOMPLETE_AUDIT_TRAIL"
  | "MISSING_EVIDENCE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "SIMULATION_STATE_CORRUPTION"
  | "PRODUCTION_MUTATION"
  | "HISTORICAL_EVIDENCE_MUTATION"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_EXPANSION"
  | "AUTONOMOUS_DECISION"
  | "RISK_CONFIDENCE_MUTATION"
  | "TENANT_STATE_MUTATION";

export type AdaptiveSimulationLifecycleRequirement = Readonly<{
  state: AdaptiveSimulationLifecycleState;
  requirements: readonly string[];
  allowed_next_states: readonly AdaptiveSimulationLifecycleState[];
  integrity_hash: string;
}>;

export type AdaptiveSimulationBoundary = Readonly<{
  boundary_id: string;
  name: string;
  prohibited: boolean;
  rationale: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationInputContract = Readonly<{
  input_contract_id: string;
  required_inputs: readonly string[];
  proposal_certification_required: true;
  deterministic_seed_required: true;
  baseline_required: true;
  governance_policy_required: true;
  rollback_plan_required: true;
  tenant_context_required: true;
  replay_timeline_required: true;
  decision_graph_required: true;
  recommendation_graph_required: true;
  governance_graph_required: true;
  integrity_hash: string;
}>;

export type AdaptiveSimulationOutputContract = Readonly<{
  output_contract_id: string;
  required_outputs: readonly string[];
  immutable_evidence_required: true;
  replay_bundle_required: true;
  explainability_required: true;
  certification_recommendation_required: true;
  audit_package_required: true;
  impact_analysis_required: true;
  rollback_assessment_required: true;
  production_mutation_supported: false;
  autonomous_decision_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveSimulationContractMetrics = Readonly<{
  lifecycle_states_defined: number;
  simulation_scopes_defined: number;
  input_requirements_defined: number;
  output_requirements_defined: number;
  prohibited_boundaries_defined: number;
  determinism_guaranteed: boolean;
  replayability_guaranteed: boolean;
  governance_preserved: boolean;
  constitutional_governance_preserved: boolean;
  authority_preserved: boolean;
  tenant_isolation_preserved: boolean;
  advisory_only_preserved: boolean;
  explainability_guaranteed: boolean;
  audit_complete: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  rollback_validated: boolean;
  validation_failures: readonly AdaptiveSimulationContractFailure[];
  deterministic_replay_success: boolean;
  integrity_hash: string;
}>;

export type AdaptiveSimulationContractApiSurface = Readonly<{
  api_id: string;
  establish_contract: "POST /adaptive-simulation-contract/establish";
  retrieve_lifecycle: "POST /adaptive-simulation-contract/lifecycle";
  retrieve_boundaries: "POST /adaptive-simulation-contract/boundaries";
  retrieve_io_contract: "POST /adaptive-simulation-contract/io";
  retrieve_metrics: "POST /adaptive-simulation-contract/metrics";
  replay_contract: "POST /adaptive-simulation-contract/replay";
  inspect_contract: "POST /adaptive-simulation-contract/inspect";
  retrieve_contract: "GET /adaptive-simulation-contract/contract";
  production_mutation_supported: false;
  historical_evidence_mutation_supported: false;
  governance_override_supported: false;
  authority_expansion_supported: false;
  autonomous_decision_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveSimulationContractInput = Readonly<{
  scenario?: AdaptiveSimulationContractScenario;
  certification_result?: AdaptationProposalCertificationResult;
}>;

export type AdaptiveSimulationContractResult = Readonly<{
  adaptive_simulation_contract_version: "adaptive-simulation-contract/v1";
  contract_identifier: "AdaptiveSimulationContract";
  contract_status: AdaptiveSimulationContractStatus;
  contract_semver: "1.0";
  api_surface: AdaptiveSimulationContractApiSurface;
  certification_result: AdaptationProposalCertificationResult;
  lifecycle: readonly AdaptiveSimulationLifecycleRequirement[];
  supported_scopes: readonly AdaptiveSimulationScope[];
  boundaries: readonly AdaptiveSimulationBoundary[];
  input_contract: AdaptiveSimulationInputContract;
  output_contract: AdaptiveSimulationOutputContract;
  metrics: AdaptiveSimulationContractMetrics;
  failures: readonly AdaptiveSimulationContractFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  governance_preserved: boolean;
  constitutional_governance_preserved: boolean;
  operator_authority_preserved: boolean;
  advisory_only: true;
  modifies_production_behavior: false;
  modifies_historical_evidence: false;
  updates_production_models: false;
  updates_confidence: false;
  modifies_risk_calculations: false;
  changes_tenant_state: false;
  authorizes_implementation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationContractFoundation = Readonly<{
  adaptive_simulation_contract_version: "adaptive-simulation-contract/v1";
  lifecycle_states: readonly AdaptiveSimulationLifecycleState[];
  supported_scopes: readonly AdaptiveSimulationScope[];
  api_surface: AdaptiveSimulationContractApiSurface;
  result: AdaptiveSimulationContractResult;
}>;
