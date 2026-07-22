import type { ImprovementOpportunityResult } from "@/types/improvement-opportunity-generator";

export type RecommendationPerformanceLedgerState = "RECORD_CREATED" | "REFERENCES_VALIDATED" | "LINEAGE_UPDATED" | "INTEGRITY_VERIFIED" | "REPLAY_VALIDATED" | "LEDGER_APPENDED" | "HISTORICAL_INDEX_UPDATED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type RecommendationPerformanceLedgerFailure =
  | "MUTATION_ATTEMPT_DETECTED"
  | "DELETE_ATTEMPT_DETECTED"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "RECOMMENDATION_IDENTITY_INVALID"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "EVIDENCE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "LINEAGE_GRAPH_INCOMPLETE"
  | "HASH_MISMATCH_DETECTED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "FAIL_OPEN_BEHAVIOR";

export type RecommendationPerformanceLedgerScenario =
  | "BASELINE"
  | "MISSING_REPLAY"
  | "MISSING_HASH"
  | "INCOMPLETE_LINEAGE"
  | "INVALID_RECOMMENDATION"
  | "MISSING_GOVERNANCE"
  | "MISSING_EVIDENCE"
  | "CROSS_TENANT"
  | "MUTATION_ATTEMPT"
  | "DELETE_ATTEMPT"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "INTEGRITY_FAILURE"
  | "LINEAGE_GRAPH_INCOMPLETE"
  | "HASH_MISMATCH"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "FAIL_OPEN";

export type RecommendationPerformanceRecord = Readonly<{
  performance_record_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  recommendation_version: string;
  recommendation_refs: readonly string[];
  outcome_refs: readonly string[];
  score_refs: readonly string[];
  operator_action_refs: readonly string[];
  failure_refs: readonly string[];
  improvement_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hashes: readonly string[];
  ledger_timestamp: string;
  immutable: true;
  append_only: true;
  deleted: boolean;
  mutation_supported: false;
  delete_supported: false;
  integrity_hash: string;
}>;

export type RecommendationHistoricalRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  recommendation_index: Readonly<Record<string, readonly string[]>>;
  mission_index: Readonly<Record<string, readonly string[]>>;
  decision_index: Readonly<Record<string, readonly string[]>>;
  evaluation_index: Readonly<Record<string, readonly string[]>>;
  governance_index: Readonly<Record<string, readonly string[]>>;
  replay_index: Readonly<Record<string, readonly string[]>>;
  improvement_index: Readonly<Record<string, readonly string[]>>;
  deterministic_lookup: true;
  read_only: true;
  integrity_hash: string;
}>;

export type RecommendationLineageEdge = Readonly<{
  edge_id: string;
  from_ref: string;
  to_ref: string;
  relationship: "RECOMMENDATION_EVIDENCE" | "RECOMMENDATION_DECISION" | "RECOMMENDATION_EVALUATION" | "RECOMMENDATION_OUTCOME" | "RECOMMENDATION_GOVERNANCE" | "RECOMMENDATION_REPLAY" | "RECOMMENDATION_IMPROVEMENT" | "RECOMMENDATION_OPERATOR_ACTION";
  immutable: true;
  replayable: true;
  integrity_hash: string;
}>;

export type RecommendationLineageGraph = Readonly<{
  graph_id: string;
  tenant_id: string;
  performance_record_id: string;
  edges: readonly RecommendationLineageEdge[];
  complete: boolean;
  immutable: true;
  replayable: true;
  integrity_hash: string;
}>;

export type RecommendationReplayRegistry = Readonly<{
  replay_registry_id: string;
  tenant_id: string;
  recommendation_replay_refs: readonly string[];
  evaluation_replay_refs: readonly string[];
  operator_replay_refs: readonly string[];
  governance_replay_refs: readonly string[];
  outcome_replay_refs: readonly string[];
  improvement_replay_refs: readonly string[];
  replay_dependencies_complete: boolean;
  integrity_hash: string;
}>;

export type RecommendationPerformanceLedgerValidation = Readonly<{
  validation_id: string;
  state: RecommendationPerformanceLedgerState;
  certified: boolean;
  failures: readonly RecommendationPerformanceLedgerFailure[];
  append_only: boolean;
  immutable: boolean;
  record_complete: boolean;
  historical_indexed: boolean;
  lineage_complete: boolean;
  replay_validated: boolean;
  governance_validated: boolean;
  evidence_referenced: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  read_operations_mutate_state: false;
  integrity_hash: string;
}>;

export type RecommendationPerformanceLedgerApiSurface = Readonly<{
  api_id: string;
  append_record: "POST /recommendation-performance-ledger/append";
  read_record: "POST /recommendation-performance-ledger/read";
  retrieve_registry: "POST /recommendation-performance-ledger/registry";
  retrieve_lineage: "POST /recommendation-performance-ledger/lineage";
  validate_integrity: "POST /recommendation-performance-ledger/integrity";
  validate_replay: "POST /recommendation-performance-ledger/replay";
  retrieve_contract: "GET /recommendation-performance-ledger/contract";
  update_supported: false;
  delete_supported: false;
  learning_supported: false;
  reporting_database_supported: false;
  integrity_hash: string;
}>;

export type RecommendationPerformanceLedgerInput = Readonly<{
  improvement_result?: ImprovementOpportunityResult;
  scenario?: RecommendationPerformanceLedgerScenario;
}>;

export type RecommendationPerformanceLedgerResult = Readonly<{
  recommendation_performance_ledger_version: "recommendation-performance-ledger/v1";
  improvement_result: ImprovementOpportunityResult;
  api_surface: RecommendationPerformanceLedgerApiSurface;
  performance_record: RecommendationPerformanceRecord;
  historical_registry: RecommendationHistoricalRegistry;
  lineage_graph: RecommendationLineageGraph;
  replay_registry: RecommendationReplayRegistry;
  validation: RecommendationPerformanceLedgerValidation;
  deterministic: true;
  replayable: true;
  append_only: true;
  immutable: true;
  advisory_only: true;
  learning_database: false;
  reporting_database: false;
  modifies_recommendations: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationPerformanceLedgerFoundation = Readonly<{
  recommendation_performance_ledger_version: "recommendation-performance-ledger/v1";
  api_surface: RecommendationPerformanceLedgerApiSurface;
  result: RecommendationPerformanceLedgerResult;
}>;
