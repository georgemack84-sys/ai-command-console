import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { TruthLedgerBindingEngineResult } from "@/types/truth-ledger-binding-engine";

export type LineageNodeType = "DECISION" | "RECOMMENDATION" | "DECISION_PACKAGE" | "OPERATOR_ACTION" | "EXECUTION" | "OBSERVED_OUTCOME" | "TRUTH_LEDGER" | "ADAPTIVE_HISTORY";

export type LineageRelationshipType =
  | "originated_from"
  | "resulted_from"
  | "approved_by"
  | "governed_by"
  | "replayed_by"
  | "certified_by"
  | "supersedes"
  | "corrected_by"
  | "references"
  | "influenced_by";

export type DependencyType = "EXECUTION" | "GOVERNANCE" | "EVIDENCE" | "OPERATOR" | "REPLAY" | "ADAPTIVE";

export type OutcomeLineageGraphState = "VALID" | "BLOCKED" | "ORPHAN_DETECTED" | "CYCLE_DETECTED";

export type OutcomeLineageCheck =
  | "BINDING_VALIDATION"
  | "NODE_CREATION"
  | "RELATIONSHIP_CREATION"
  | "DEPENDENCY_MAPPING"
  | "GRAPH_TOPOLOGY"
  | "ORPHAN_DETECTION"
  | "CYCLE_DETECTION"
  | "REPLAY_RECONSTRUCTION"
  | "RELATIONSHIP_REGISTRY"
  | "TENANT_ISOLATION"
  | "MISSION_CONSISTENCY"
  | "INTEGRITY_VALIDATION";

export type OutcomeLineageFailure =
  | "TRUTH_BINDING_NOT_VALIDATED"
  | "MISSING_DECISION_NODE_REJECTED"
  | "MISSING_RECOMMENDATION_NODE_REJECTED"
  | "MISSING_DECISION_PACKAGE_NODE_REJECTED"
  | "MISSING_OPERATOR_ACTION_NODE_REJECTED"
  | "MISSING_EXECUTION_NODE_REJECTED"
  | "MISSING_OBSERVED_OUTCOME_NODE_REJECTED"
  | "MISSING_TRUTH_LEDGER_NODE_REJECTED"
  | "MISSING_ADAPTIVE_HISTORY_NODE_REJECTED"
  | "INVALID_RELATIONSHIP_TYPE_REJECTED"
  | "ORPHAN_OUTCOME_REJECTED"
  | "LINEAGE_CYCLE_REJECTED"
  | "CROSS_TENANT_LINEAGE_REJECTED"
  | "MISSION_MISMATCH_REJECTED"
  | "RELATIONSHIP_REGISTRY_APPEND_ONLY_VIOLATED"
  | "LINEAGE_REORDERING_REJECTED"
  | "REPLAY_RECONSTRUCTION_DIFFERED"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "HISTORICAL_RELATIONSHIP_MUTATION_REJECTED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_LINEAGE_MAPPING_BEHAVIOR";

export type LineageNode = Readonly<{
  node_id: string;
  node_type: LineageNodeType;
  source_record_id: string;
  tenant_id: string;
  mission_id: string;
  timestamp: string;
  node_version: "10.2.4";
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type LineageRelationship = Readonly<{
  relationship_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: LineageRelationshipType;
  relationship_version: "10.2.4";
  relationship_timestamp: string;
  replay_refs: readonly string[];
  append_only: true;
  integrity_hash: string;
}>;

export type HistoricalDependencyRecord = Readonly<{
  dependency_id: string;
  lineage_graph_id: string;
  parent_node_id: string;
  child_node_id: string;
  dependency_type: DependencyType;
  dependency_strength: "DIRECT" | "INDIRECT";
  dependency_reason: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeLineageGraph = Readonly<{
  lineage_graph_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  graph_version: "10.2.4";
  root_node_id: string;
  node_refs: readonly string[];
  relationship_refs: readonly string[];
  replay_refs: readonly string[];
  graph_state: OutcomeLineageGraphState;
  integrity_hash: string;
}>;

export type LineageQueryResult = Readonly<{
  query_id: string;
  supported_queries: readonly ("OUTCOME" | "DECISION" | "RECOMMENDATION" | "OPERATOR" | "GOVERNANCE" | "MISSION" | "REPLAY" | "ADAPTIVE_HISTORY")[];
  traversal_order: readonly string[];
  matched_node_refs: readonly string[];
  query_mutated_graph: false;
  traversal_latency_ms: number;
  integrity_hash: string;
}>;

export type LineageValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  one_root_node: boolean;
  complete_parent_chain: boolean;
  complete_child_chain: boolean;
  relationship_types_valid: boolean;
  replay_references_valid: boolean;
  integrity_hashes_valid: boolean;
  tenant_consistent: boolean;
  mission_consistent: boolean;
  acyclic: boolean;
  relationship_registry_append_only: boolean;
  failures: readonly OutcomeLineageFailure[];
  integrity_hash: string;
}>;

export type LineageReplayReport = Readonly<{
  replay_report_id: string;
  graph_hash: string;
  node_hashes: readonly string[];
  relationship_hashes: readonly string[];
  dependency_hashes: readonly string[];
  topology_hash: string;
  replay_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  integrity_hash: string;
}>;

export type LineageMetrics = Readonly<{
  metrics_id: string;
  lineage_graphs_created: number;
  graph_depth: number;
  node_count: number;
  relationship_count: number;
  orphan_detection_failures: number;
  graph_validation_failures: number;
  replay_consistency: number;
  graph_traversal_latency_ms: number;
  dependency_resolution_time_ms: number;
  tenant_isolation_violations: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type LineageAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeLineageCheck[];
  lineage_graph_operational: boolean;
  relationship_registry_operational: boolean;
  dependency_mapper_operational: boolean;
  query_engine_operational: boolean;
  minimum_chain_complete: boolean;
  graph_directed_acyclic: boolean;
  orphan_outcomes_rejected: boolean;
  immutable_relationships_verified: boolean;
  replay_reconstruction_identical: boolean;
  failure_analysis: readonly OutcomeLineageFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type LineageApiSurface = Readonly<{
  api_id: string;
  build_lineage_graph: "POST /lineage/build";
  validate_lineage: "POST /lineage/validate";
  retrieve_lineage: "GET /lineage/{normalized_outcome_id}";
  retrieve_dependencies: "GET /lineage/{normalized_outcome_id}/dependencies";
  search_lineage: "GET /lineage/search";
  update_supported: false;
  delete_supported: false;
  deterministic_access: true;
  integrity_hash: string;
}>;

export type OutcomeLineageMapperInput = Readonly<{
  truth_binding?: TruthLedgerBindingEngineResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_DECISION"
    | "MISSING_RECOMMENDATION"
    | "MISSING_DECISION_PACKAGE"
    | "MISSING_OPERATOR_ACTION"
    | "MISSING_EXECUTION"
    | "MISSING_OBSERVED_OUTCOME"
    | "MISSING_TRUTH_LEDGER"
    | "MISSING_ADAPTIVE_HISTORY"
    | "INVALID_RELATIONSHIP"
    | "ORPHAN_OUTCOME"
    | "CYCLE"
    | "CROSS_TENANT"
    | "MISSION_MISMATCH"
    | "APPEND_ONLY_VIOLATION"
    | "LINEAGE_REORDERING"
    | "REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "HISTORICAL_MUTATION"
    | "INVALID_BINDING"
    | "FAIL_OPEN";
}>;

export type OutcomeLineageMapperResult = Readonly<{
  outcome_lineage_mapper_version: "outcome-lineage-mapper/v1";
  truth_binding: TruthLedgerBindingEngineResult;
  api_surface: LineageApiSurface;
  nodes: readonly LineageNode[];
  relationships: readonly LineageRelationship[];
  dependencies: readonly HistoricalDependencyRecord[];
  lineage_graph: OutcomeLineageGraph;
  query_result: LineageQueryResult;
  validation: LineageValidation;
  replay_report: LineageReplayReport;
  metrics: LineageMetrics;
  audit_report: LineageAuditReport;
  deterministic: true;
  replayable: true;
  records_relationships_only: true;
  modifies_decisions: false;
  modifies_recommendations: false;
  modifies_evidence: false;
  modifies_truth_ledger_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeLineageMapperFoundation = Readonly<{
  outcome_lineage_mapper_version: "outcome-lineage-mapper/v1";
  checks: readonly OutcomeLineageCheck[];
  api_surface: LineageApiSurface;
  result: OutcomeLineageMapperResult;
}>;
