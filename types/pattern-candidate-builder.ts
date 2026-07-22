import type { PatternContractResult, PatternType } from "@/types/pattern-intelligence-contract";

export type PatternCandidateState = "DISCOVERED" | "AGGREGATED" | "GROUPED" | "RECURRENCE_VERIFIED" | "REGISTERED" | "READY_FOR_VALIDATION" | "FAILED" | "PENDING_EVIDENCE";
export type PatternCandidateWindowType = "FIXED_WINDOW" | "TIME_WINDOW" | "MISSION_WINDOW" | "CAMPAIGN_WINDOW" | "GOVERNANCE_WINDOW" | "REPLAY_WINDOW";
export type HistoricalRecordSource = "DECISION_HISTORY" | "RECOMMENDATION_HISTORY" | "OUTCOME_INTELLIGENCE" | "GOVERNANCE_OUTCOMES" | "OPERATOR_ACTIVITY" | "EVIDENCE_LINEAGE" | "SIMULATION_RESULTS" | "REPLAY_HISTORY" | "ROLLBACK_HISTORY" | "TRUTH_LEDGER" | "PATTERN_LEDGER";

export type PatternCandidateFailure =
  | "PATTERN_CONTRACT_INVALID"
  | "UNCERTIFIED_HISTORICAL_RECORDS"
  | "INSUFFICIENT_HISTORY"
  | "RECURRENCE_THRESHOLD_NOT_MET"
  | "MANDATORY_EVIDENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_DIVERGENCE"
  | "TENANT_ISOLATION_VIOLATED"
  | "GOVERNANCE_BOUNDARY_VIOLATED"
  | "CONSTITUTIONAL_RESTRICTION_VIOLATED"
  | "UNSUPPORTED_HISTORICAL_SOURCE"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "CANDIDATE_IDENTITY_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "AUTONOMOUS_LEARNING_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternCandidateScenario =
  | "BASELINE"
  | "CONTRACT_INVALID"
  | "UNCERTIFIED_HISTORY"
  | "INSUFFICIENT_HISTORY"
  | "LOW_RECURRENCE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "REPLAY_DIVERGENCE"
  | "CROSS_TENANT"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "UNSUPPORTED_SOURCE"
  | "INVALID_TRANSITION"
  | "IDENTITY_MUTATION"
  | "REGISTRY_MUTATION"
  | "HASH_MISMATCH"
  | "AUTONOMOUS_LEARNING"
  | "FAIL_OPEN";

export type HistoricalAggregationRecord = Readonly<{
  aggregation_id: string;
  tenant_id: string;
  sources: readonly HistoricalRecordSource[];
  record_refs: readonly string[];
  normalized: true;
  certified_only: boolean;
  ordering_key: string;
  integrity_hash: string;
}>;

export type PatternWindow = Readonly<{
  window_id: string;
  window_type: PatternCandidateWindowType;
  window_start: string;
  window_end: string;
  record_limit: number;
  deterministic_boundaries: true;
  replayable: true;
  integrity_hash: string;
}>;

export type PatternCandidate = Readonly<{
  candidate_id: string;
  tenant_id: string;
  mission_scope: string;
  candidate_type: PatternType;
  candidate_summary: string;
  grouping_key: string;
  recurrence_count: number;
  recurrence_window: PatternWindow;
  supporting_decision_refs: readonly string[];
  supporting_recommendation_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  supporting_operator_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_simulation_refs: readonly string[];
  supporting_rollback_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  candidate_state: PatternCandidateState;
  immutable: true;
  advisory_only: true;
  validates_pattern_truth: false;
  actionable: false;
  integrity_hash: string;
}>;

export type PatternCandidateRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  candidate_refs: readonly string[];
  grouping_index: Readonly<Record<string, readonly string[]>>;
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternCandidateValidation = Readonly<{
  validation_id: string;
  state: PatternCandidateState;
  valid: boolean;
  failures: readonly PatternCandidateFailure[];
  contract_valid: boolean;
  aggregation_complete: boolean;
  grouping_deterministic: boolean;
  recurrence_threshold_met: boolean;
  evidence_sufficient: boolean;
  replay_validated: boolean;
  governance_preserved: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_autonomous_learning: boolean;
  integrity_hash: string;
}>;

export type PatternCandidateApiSurface = Readonly<{
  api_id: string;
  build_candidates: "POST /pattern-candidate-builder/build";
  aggregate_history: "POST /pattern-candidate-builder/aggregate";
  manage_windows: "POST /pattern-candidate-builder/windows";
  retrieve_registry: "POST /pattern-candidate-builder/registry";
  replay_candidates: "POST /pattern-candidate-builder/replay";
  verify_identity: "POST /pattern-candidate-builder/identity";
  retrieve_contract: "GET /pattern-candidate-builder/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  pattern_truth_validation_supported: false;
  integrity_hash: string;
}>;

export type PatternCandidateInput = Readonly<{
  contract_result?: PatternContractResult;
  pattern_type?: PatternType;
  scenario?: PatternCandidateScenario;
}>;

export type PatternCandidateBuilderResult = Readonly<{
  pattern_candidate_builder_version: "pattern-candidate-builder/v1";
  contract_result: PatternContractResult;
  api_surface: PatternCandidateApiSurface;
  aggregation: HistoricalAggregationRecord;
  window: PatternWindow;
  candidates: readonly PatternCandidate[];
  registry: PatternCandidateRegistry;
  validation: PatternCandidateValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_aware: true;
  adaptive_learning: false;
  validates_pattern_truth: false;
  modifies_recommendations: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternCandidateBuilderFoundation = Readonly<{
  pattern_candidate_builder_version: "pattern-candidate-builder/v1";
  supported_windows: readonly PatternCandidateWindowType[];
  supported_sources: readonly HistoricalRecordSource[];
  api_surface: PatternCandidateApiSurface;
  result: PatternCandidateBuilderResult;
}>;
