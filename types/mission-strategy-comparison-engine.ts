import type { StrategyEvolutionContractResult } from "@/types/strategy-evolution-contract";

export type MissionStrategySimilarityLevel = "IDENTICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";
export type MissionStrategyClassification = "BEST_PERFORMING" | "WEAKEST" | "REUSABLE" | "MISSION_SPECIFIC" | "OBSOLETE";
export type MissionStrategyComparisonLifecycleState = "COLLECTED" | "SIMILARITY_VALIDATED" | "COMPARED" | "ANALYZED" | "RANKED" | "CLASSIFIED" | "REGISTERED" | "REJECTED" | "SUPERSEDED" | "ARCHIVED";
export type MissionStrategyComparisonValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type MissionStrategyComparisonFailure =
  | "STRATEGY_CONTRACT_UNCERTIFIED"
  | "MISSION_SIMILARITY_BELOW_THRESHOLD"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "REPLAY_VERIFICATION_FAILED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "RANKING_NONDETERMINISTIC"
  | "TENANT_ISOLATION_VIOLATED"
  | "CLASSIFICATION_INCONSISTENT"
  | "INTEGRITY_HASH_MISMATCH"
  | "REGISTRY_MUTATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "STRATEGY_MUTATION_DETECTED"
  | "PROPOSAL_GENERATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type MissionStrategyComparisonScenario =
  | "BASELINE"
  | "BEST_PERFORMING"
  | "WEAKEST"
  | "REUSABLE"
  | "MISSION_SPECIFIC"
  | "OBSOLETE"
  | "IDENTICAL_SIMILARITY"
  | "HIGH_SIMILARITY"
  | "MODERATE_SIMILARITY"
  | "LOW_SIMILARITY"
  | "NO_SIMILARITY"
  | "UNCERTIFIED_CONTRACT"
  | "MISSING_EVIDENCE"
  | "REPLAY_FAILURE"
  | "MISSING_GOVERNANCE"
  | "NONDETERMINISTIC_RANKING"
  | "CROSS_TENANT"
  | "INCONSISTENT_CLASSIFICATION"
  | "HASH_MISMATCH"
  | "REGISTRY_MUTATION"
  | "ADVISORY_VIOLATION"
  | "STRATEGY_MUTATION"
  | "PROPOSAL_GENERATION"
  | "FAIL_OPEN";

export type MissionStrategyComparison = Readonly<{
  comparison_id: string;
  tenant_id: string;
  mission_scope: string;
  comparison_timestamp: string;
  mission_similarity_level: MissionStrategySimilarityLevel;
  mission_similarity_score: number;
  compared_strategy_refs: readonly string[];
  comparison_dimensions: readonly string[];
  objective_alignment_score: number;
  operator_alignment_score: number;
  governance_alignment_score: number;
  evidence_quality_score: number;
  risk_performance_score: number;
  confidence_accuracy_score: number;
  replay_consistency_score: number;
  comparative_effectiveness_score: number;
  strategy_classification: MissionStrategyClassification;
  ranking_position: number;
  supporting_outcome_refs: readonly string[];
  supporting_pattern_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  supporting_replay_refs: readonly string[];
  lifecycle_state: MissionStrategyComparisonLifecycleState;
  advisory_only: true;
  mutates_strategy: false;
  generates_proposals: false;
  integrity_hash: string;
}>;

export type MissionStrategyComparisonRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  comparison_refs: readonly string[];
  ranking_index: readonly string[];
  classification_index: Readonly<Record<MissionStrategyClassification, readonly string[]>>;
  similarity_index: Readonly<Record<MissionStrategySimilarityLevel, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type MissionStrategyComparisonValidation = Readonly<{
  validation_id: string;
  state: MissionStrategyComparisonValidationState;
  certified: boolean;
  failures: readonly MissionStrategyComparisonFailure[];
  contract_certified: boolean;
  similarity_threshold_met: boolean;
  evidence_complete: boolean;
  replay_verified: boolean;
  governance_referenced: boolean;
  ranking_deterministic: boolean;
  tenant_isolated: boolean;
  classification_consistent: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_strategy_mutation: boolean;
  no_proposal_generation: boolean;
  integrity_hash: string;
}>;

export type MissionStrategyComparisonApiSurface = Readonly<{
  api_id: string;
  compare_strategies: "POST /mission-strategy-comparison-engine/compare";
  retrieve_comparisons: "POST /mission-strategy-comparison-engine/comparisons";
  retrieve_similarity: "POST /mission-strategy-comparison-engine/similarity";
  retrieve_ranking: "POST /mission-strategy-comparison-engine/ranking";
  retrieve_classification: "POST /mission-strategy-comparison-engine/classification";
  retrieve_evidence: "POST /mission-strategy-comparison-engine/evidence";
  retrieve_governance: "POST /mission-strategy-comparison-engine/governance";
  replay_comparison: "POST /mission-strategy-comparison-engine/replay";
  retrieve_registry: "POST /mission-strategy-comparison-engine/registry";
  retrieve_contract: "GET /mission-strategy-comparison-engine/contract";
  update_supported: false;
  delete_supported: false;
  strategy_mutation_supported: false;
  proposal_generation_supported: false;
  integrity_hash: string;
}>;

export type MissionStrategyComparisonInput = Readonly<{
  strategy_contract?: StrategyEvolutionContractResult;
  scenario?: MissionStrategyComparisonScenario;
}>;

export type MissionStrategyComparisonResult = Readonly<{
  mission_strategy_comparison_engine_version: "mission-strategy-comparison-engine/v1";
  strategy_contract: StrategyEvolutionContractResult;
  api_surface: MissionStrategyComparisonApiSurface;
  comparisons: readonly MissionStrategyComparison[];
  registry: MissionStrategyComparisonRegistry;
  validation: MissionStrategyComparisonValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  governance_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_strategy: false;
  generates_proposals: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MissionStrategyComparisonFoundation = Readonly<{
  mission_strategy_comparison_engine_version: "mission-strategy-comparison-engine/v1";
  api_surface: MissionStrategyComparisonApiSurface;
  result: MissionStrategyComparisonResult;
}>;
