import type { PolicyAnalysisPolicyType, PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";

export type PolicyGraphNodeType = "POLICY" | "AUTHORITY" | "CONSTRAINT" | "EXCEPTION" | "RECOMMENDATION" | "GOVERNANCE_DECISION" | "RUNTIME_CONTROL";

export type PolicyGraphRelationshipType = "DEPENDS_ON" | "SUPERSEDES" | "INHERITS" | "CONFLICTS_WITH" | "REFERENCES" | "EXTENDS" | "LIMITS" | "ENABLES" | "DISABLES" | "SUPPORTED_BY";

export type PolicyGraphState = "CREATED" | "NODES_RESOLVED" | "EDGES_RESOLVED" | "CONFLICTS_ANALYZED" | "VALIDATED" | "REPLAYABLE" | "RESTRICTED" | "SUPERSEDED" | "INVALID" | "ARCHIVED";

export type PolicyGraphRelationshipState = "CREATED" | "VALIDATED" | "CONFLICT_DETECTED" | "REPLAYABLE" | "RESTRICTED" | "SUPERSEDED" | "INVALID" | "ARCHIVED";

export type PolicyConflictType =
  | "CONTRADICTORY_PERMISSION"
  | "OVERLAPPING_AUTHORITY"
  | "INCOMPATIBLE_CONSTRAINT"
  | "CIRCULAR_INHERITANCE"
  | "RECURSIVE_DEPENDENCY_CHAIN"
  | "UNREACHABLE_POLICY"
  | "EXPIRED_EXCEPTION_ACTIVE"
  | "UNSUPPORTED_EXCEPTION"
  | "SUPERSESSION_CONFLICT"
  | "TENANT_SCOPE_CONFLICT"
  | "RUNTIME_BOUNDARY_CONFLICT";

export type PolicyConflictState = "DETECTED" | "CONFIRMED" | "RESTRICTED" | "SUPERSEDED" | "INVALID" | "ARCHIVED";

export type PolicyDependencyGraphFailureReason =
  | "POLICY_ANALYSIS_MISSING"
  | "POLICY_ANALYSIS_INVALID"
  | "POLICY_ANALYSIS_STATE_BLOCKED"
  | "POLICY_CORRELATION_MISSING"
  | "POLICY_CORRELATION_INVALID"
  | "POLICY_CORRELATION_STATE_BLOCKED"
  | "POLICY_NODE_MISSING"
  | "AUTHORITY_NODE_MISSING"
  | "CONSTRAINT_NODE_MISSING"
  | "EXCEPTION_NODE_INVALID"
  | "RECOMMENDATION_NODE_MISSING"
  | "GOVERNANCE_DECISION_NODE_MISSING"
  | "RUNTIME_CONTROL_NODE_MISSING"
  | "UNKNOWN_NODE_TYPE"
  | "UNSUPPORTED_RELATIONSHIP"
  | "EDGE_EVIDENCE_MISSING"
  | "EDGE_REPLAY_REFS_MISSING"
  | "TENANT_MISMATCH"
  | "CIRCULAR_INHERITANCE"
  | "RECURSIVE_DEPENDENCY_CHAIN"
  | "SUPERSESSION_CYCLE"
  | "UNREACHABLE_POLICY"
  | "CONFLICT_UNSUPPORTED"
  | "HISTORICAL_MUTATION"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_HASH_MISMATCH"
  | "GRAPH_HASH_MISMATCH"
  | "INVALID_GRAPH_STATE"
  | "INVALID_EDGE_STATE"
  | "INVALID_STATE_TRANSITION"
  | "AUTHORITY_EXPANSION"
  | "POLICY_MUTATION_ATTEMPT";

export type PolicyGraphScope = Readonly<{
  tenant_scope: string;
  mission_scope: string;
  policy_scope: string;
  governance_scope: string;
  runtime_scope: string;
  historical_window: string;
  visibility_scope: string;
}>;

export type PolicyDependencyNode = Readonly<{
  node_id: string;
  node_type: PolicyGraphNodeType;
  tenant_id: string;
  policy_id?: string;
  policy_version?: string;
  policy_type?: PolicyAnalysisPolicyType;
  authority_id?: string;
  authority_type?: string;
  constraint_id?: string;
  constraint_type?: string;
  constraint_expression?: string;
  exception_id?: string;
  condition?: string;
  allowed_behavior?: string;
  authority_required?: string;
  expiration_rule?: string;
  recommendation_id?: string;
  governance_decision_id?: string;
  decision_state?: string;
  runtime_control_id?: string;
  control_type?: string;
  mission_id?: string;
  source_policy_refs: readonly string[];
  source_correlation_refs: readonly string[];
  source_truth_records: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  node_hash: string;
}>;

export type PolicyDependencyEdge = Readonly<{
  edge_id: string;
  tenant_id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: PolicyGraphRelationshipType;
  source_policy_id: string;
  target_policy_id: string;
  source_policy_version: string;
  target_policy_version: string;
  evidence_refs: readonly string[];
  truth_refs: readonly string[];
  correlation_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  relationship_state: PolicyGraphRelationshipState;
  relationship_hash: string;
  created_timestamp: string;
}>;

export type PolicyConflictRecord = Readonly<{
  policy_conflict_id: string;
  tenant_id: string;
  graph_id: string;
  conflict_type: PolicyConflictType;
  conflict_state: PolicyConflictState;
  source_node_id: string;
  target_node_id: string;
  source_policy_id: string;
  target_policy_id: string;
  source_policy_version: string;
  target_policy_version: string;
  conflict_description: string;
  conflict_scope: string;
  affected_constraints: readonly string[];
  affected_permissions: readonly string[];
  affected_prohibitions: readonly string[];
  affected_authorities: readonly string[];
  evidence_refs: readonly string[];
  truth_refs: readonly string[];
  correlation_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  detected_timestamp: string;
  conflict_hash: string;
}>;

export type PolicyGraphReplayRefs = Readonly<{
  policy_analysis_snapshot_refs: readonly string[];
  policy_correlation_snapshot_refs: readonly string[];
  truth_ledger_snapshot_refs: readonly string[];
  graph_algorithm_version: "policy-dependency-graph/v7B.3";
  node_set_hash: string;
  edge_set_hash: string;
  conflict_set_hash: string;
  graph_output_hash: string;
  replay_execution_ref: string;
}>;

export type PolicyDependencyGraph = Readonly<{
  schema_version: "policy-dependency-graph/v7B.3";
  policy_graph_id: string;
  tenant_id: string;
  graph_version: string;
  graph_scope: PolicyGraphScope;
  node_set: readonly PolicyDependencyNode[];
  edge_set: readonly PolicyDependencyEdge[];
  policy_nodes: readonly PolicyDependencyNode[];
  authority_nodes: readonly PolicyDependencyNode[];
  constraint_nodes: readonly PolicyDependencyNode[];
  exception_nodes: readonly PolicyDependencyNode[];
  recommendation_nodes: readonly PolicyDependencyNode[];
  governance_decision_nodes: readonly PolicyDependencyNode[];
  runtime_control_nodes: readonly PolicyDependencyNode[];
  conflict_records: readonly PolicyConflictRecord[];
  dependency_records: readonly PolicyDependencyEdge[];
  inheritance_records: readonly PolicyDependencyEdge[];
  supersession_records: readonly PolicyDependencyEdge[];
  exception_records: readonly PolicyDependencyNode[];
  shared_authority_records: readonly PolicyDependencyNode[];
  source_policy_analysis_refs: readonly string[];
  source_policy_correlation_refs: readonly string[];
  source_truth_records: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: PolicyGraphReplayRefs;
  graph_state: PolicyGraphState;
  graph_hash: string;
  created_timestamp: string;
}>;

export type PolicyDependencyGraphDoctrine = Readonly<{
  principles: readonly ("advisory-only-graph" | "no-autonomous-conflict-resolution" | "immutable-historical-snapshot" | "replay-required" | "tenant-isolated" | "fail-closed" | "no-policy-mutation")[];
  prohibited_behaviors: readonly string[];
  supported_node_types: readonly PolicyGraphNodeType[];
  supported_relationship_types: readonly PolicyGraphRelationshipType[];
  acyclic_relationship_types: readonly PolicyGraphRelationshipType[];
  allowed_graph_transitions: Readonly<Record<PolicyGraphState, readonly PolicyGraphState[]>>;
}>;

export type PolicyDependencyGraphValidationFailure = Readonly<{
  failure_id: string;
  reason: PolicyDependencyGraphFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type PolicyDependencyGraphValidationResult = Readonly<{
  validation_id: string;
  policy_graph_id?: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly PolicyDependencyGraphValidationFailure[];
  graph_hash?: string;
  deterministic: true;
  replayable: boolean;
  tenant_scoped: boolean;
  advisory_only: true;
}>;

export type PolicyGraphSnapshot = Readonly<{
  snapshot_id: string;
  graph_id: string;
  graph_version: string;
  historical_window: string;
  source_policy_analysis_refs: readonly string[];
  source_policy_correlation_refs: readonly string[];
  graph_hash: string;
  immutable: true;
  created_timestamp: string;
}>;

export type PolicyGraphReplayResult = Readonly<{
  replay_id: string;
  policy_graph_id: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: PolicyDependencyGraphFailureReason | null;
  reconstructed_hash: string;
  expected_hash: string;
  final_state: PolicyGraphState;
}>;

export type PolicyGraphExplanation = Readonly<{
  explanation_id: string;
  headline: string;
  steps: readonly string[];
  evidence_refs: readonly string[];
  replay_status: "REPLAYABLE" | "NOT_REPLAYABLE";
}>;

export type PolicyGraphEngineResult = Readonly<{
  engine_id: string;
  policy_analyses: readonly PolicyAnalysisRecord[];
  policy_correlations: readonly PolicyCorrelationRecord[];
  graph: PolicyDependencyGraph;
  snapshot: PolicyGraphSnapshot;
  validation: PolicyDependencyGraphValidationResult;
}>;

export type PolicyGraphObservabilitySurface = Readonly<{
  graph_version: string;
  graph_scope: PolicyGraphScope;
  policy_nodes: readonly PolicyDependencyNode[];
  authority_nodes: readonly PolicyDependencyNode[];
  constraint_nodes: readonly PolicyDependencyNode[];
  exception_nodes: readonly PolicyDependencyNode[];
  recommendation_nodes: readonly PolicyDependencyNode[];
  governance_decision_nodes: readonly PolicyDependencyNode[];
  runtime_control_nodes: readonly PolicyDependencyNode[];
  relationship_edges: readonly PolicyDependencyEdge[];
  conflict_records: readonly PolicyConflictRecord[];
  dependency_paths: readonly string[][];
  inheritance_paths: readonly string[][];
  supersession_paths: readonly string[][];
  unreachable_policies: readonly string[];
  explanations: readonly PolicyGraphExplanation[];
  replay_status: "REPLAYABLE" | "NOT_REPLAYABLE";
  graph_state: PolicyGraphState;
  validation_failures: readonly PolicyDependencyGraphValidationFailure[];
}>;
