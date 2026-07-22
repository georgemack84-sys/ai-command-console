import type { StrategySimulationBindingResult } from "@/types/strategy-simulation-binding-engine";

export type StrategyReplayType =
  | "OUTCOME"
  | "DECISION"
  | "RECOMMENDATION"
  | "PATTERN"
  | "PROPOSAL"
  | "GOVERNANCE"
  | "SIMULATION"
  | "OPERATOR"
  | "FULL_STRATEGY";

export type StrategyReplayValidationStatus = "VALIDATED" | "FAILED" | "INCOMPLETE";
export type StrategyReplayLifecycleState = "REQUESTED" | "REFERENCES_RESOLVED" | "RECONSTRUCTED" | "VALIDATED" | "EXPLAINED" | "CERTIFIED" | "FAILED" | "INCOMPLETE";
export type StrategyReplayValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_REPLAY_REFERENCES";

export type StrategyReplayExplainabilityFailure =
  | "SIMULATION_BINDING_UNCERTIFIED"
  | "OUTCOME_REPLAY_INCOMPLETE"
  | "DECISION_REPLAY_INCOMPLETE"
  | "RECOMMENDATION_REPLAY_MISSING"
  | "PATTERN_REPLAY_INCOMPLETE"
  | "PROPOSAL_REPLAY_INCOMPLETE"
  | "GOVERNANCE_REPLAY_INCOMPLETE"
  | "SIMULATION_REPLAY_INCOMPLETE"
  | "OPERATOR_REVIEW_HISTORY_MISSING"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_NONDETERMINISTIC"
  | "HIDDEN_REASONING_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "REGISTRY_MUTATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategyReplayExplainabilityScenario =
  | "BASELINE"
  | "OUTCOME_REPLAY"
  | "DECISION_REPLAY"
  | "RECOMMENDATION_REPLAY"
  | "PATTERN_REPLAY"
  | "PROPOSAL_REPLAY"
  | "GOVERNANCE_REPLAY"
  | "SIMULATION_REPLAY"
  | "OPERATOR_REPLAY"
  | "UNCERTIFIED_SIMULATION"
  | "MISSING_OUTCOME"
  | "MISSING_DECISION"
  | "MISSING_RECOMMENDATION"
  | "MISSING_PATTERN"
  | "MISSING_PROPOSAL"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_OPERATOR"
  | "MISSING_EVIDENCE"
  | "NONDETERMINISTIC_RECONSTRUCTION"
  | "HIDDEN_REASONING"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "REGISTRY_MUTATION"
  | "ADVISORY_VIOLATION"
  | "FAIL_OPEN";

export type StrategyReplayRecord = Readonly<{
  replay_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  replay_type: StrategyReplayType;
  outcome_refs: readonly string[];
  decision_refs: readonly string[];
  recommendation_refs: readonly string[];
  pattern_refs: readonly string[];
  proposal_refs: readonly string[];
  governance_refs: readonly string[];
  simulation_refs: readonly string[];
  operator_review_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_validation_status: StrategyReplayValidationStatus;
  explainability_summary: string;
  lineage_refs: readonly string[];
  decision_trace_refs: readonly string[];
  hidden_reasoning_detected: boolean;
  lifecycle_state: StrategyReplayLifecycleState;
  advisory_only: true;
  mutates_strategy: false;
  integrity_hash: string;
}>;

export type StrategyReplayRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  replay_refs: readonly string[];
  proposal_index: Readonly<Record<string, readonly string[]>>;
  replay_type_index: Readonly<Record<StrategyReplayType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyReplayValidation = Readonly<{
  validation_id: string;
  state: StrategyReplayValidationState;
  certified: boolean;
  failures: readonly StrategyReplayExplainabilityFailure[];
  simulation_binding_certified: boolean;
  outcome_replay_complete: boolean;
  decision_replay_complete: boolean;
  recommendation_replay_complete: boolean;
  pattern_replay_complete: boolean;
  proposal_replay_complete: boolean;
  governance_replay_complete: boolean;
  simulation_replay_complete: boolean;
  operator_review_complete: boolean;
  evidence_lineage_complete: boolean;
  reconstruction_deterministic: boolean;
  hidden_reasoning_absent: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type StrategyReplayApiSurface = Readonly<{
  api_id: string;
  replay_strategy: "POST /strategy-replay-explainability-engine/replay";
  retrieve_records: "POST /strategy-replay-explainability-engine/records";
  retrieve_explanation: "POST /strategy-replay-explainability-engine/explanation";
  retrieve_lineage: "POST /strategy-replay-explainability-engine/lineage";
  retrieve_trace: "POST /strategy-replay-explainability-engine/trace";
  retrieve_evidence: "POST /strategy-replay-explainability-engine/evidence";
  retrieve_governance: "POST /strategy-replay-explainability-engine/governance";
  retrieve_simulation: "POST /strategy-replay-explainability-engine/simulation";
  retrieve_operator: "POST /strategy-replay-explainability-engine/operator";
  retrieve_registry: "POST /strategy-replay-explainability-engine/registry";
  retrieve_contract: "GET /strategy-replay-explainability-engine/contract";
  update_supported: false;
  delete_supported: false;
  strategy_mutation_supported: false;
  adoption_authorization_supported: false;
  integrity_hash: string;
}>;

export type StrategyReplayExplainabilityInput = Readonly<{
  simulation_result?: StrategySimulationBindingResult;
  scenario?: StrategyReplayExplainabilityScenario;
}>;

export type StrategyReplayExplainabilityResult = Readonly<{
  strategy_replay_explainability_engine_version: "strategy-replay-explainability-engine/v1";
  simulation_result: StrategySimulationBindingResult;
  api_surface: StrategyReplayApiSurface;
  replay_records: readonly StrategyReplayRecord[];
  registry: StrategyReplayRegistry;
  validation: StrategyReplayValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_lineage_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  mutates_strategy: false;
  authorizes_adoption: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyReplayExplainabilityFoundation = Readonly<{
  strategy_replay_explainability_engine_version: "strategy-replay-explainability-engine/v1";
  api_surface: StrategyReplayApiSurface;
  result: StrategyReplayExplainabilityResult;
}>;
