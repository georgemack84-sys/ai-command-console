export type CrossMissionGraphStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type GraphNodeKind = "MISSION" | "ENTITY" | "STRATEGY" | "EVIDENCE" | "PATTERN" | "TEMPORAL_EVENT";
export type GraphEdgeKind = "RELATED_TO" | "PARTICIPATES_IN" | "GOVERNED_BY" | "EVOLVED_FROM" | "SUPPORTS" | "CONTRADICTS" | "RECURRING_PATTERN" | "CAUSAL_SEQUENCE" | "SUPERSEDES";
export type GraphDomain = "MISSION_GRAPH" | "ENTITY_RELATIONSHIPS" | "STRATEGY_RELATIONSHIPS" | "EVIDENCE_RELATIONSHIPS" | "PATTERN_RELATIONSHIPS" | "TEMPORAL_RELATIONSHIPS";
export type CrossMissionGraphFailure =
  | "INSTITUTIONAL_MEMORY_NOT_CERTIFIED"
  | "GRAPH_CONTRACT_INVALID"
  | "NODE_IDENTITY_NONDETERMINISTIC"
  | "EDGE_IDENTITY_NONDETERMINISTIC"
  | "MISSION_GRAPH_INVALID"
  | "ENTITY_RELATIONSHIP_INVALID"
  | "STRATEGY_RELATIONSHIP_INVALID"
  | "EVIDENCE_RELATIONSHIP_INVALID"
  | "PATTERN_RELATIONSHIP_INVALID"
  | "TEMPORAL_RELATIONSHIP_INVALID"
  | "SEARCH_NONDETERMINISTIC"
  | "TRAVERSAL_NONDETERMINISTIC"
  | "CLUSTERING_NONDETERMINISTIC"
  | "GRAPH_INCONSISTENT"
  | "CONFIDENCE_THRESHOLD_BYPASS"
  | "QUALIFICATION_BYPASS"
  | "LINEAGE_CORRUPTION"
  | "VERSION_HISTORY_MISSING"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "TENANT_ISOLATION_BREACH"
  | "CROSS_TENANT_RELATIONSHIP_UNAUTHORIZED"
  | "SECURITY_CONTROL_FAILURE"
  | "OBSERVABILITY_INCOMPLETE"
  | "PERFORMANCE_THRESHOLD_MISSED"
  | "INTEGRITY_HASH_MISMATCH";
export type CrossMissionGraphScenario = "BASELINE" | CrossMissionGraphFailure;

export type CrossMissionGraphContract = Readonly<{
  contract_id: string;
  lifecycle: readonly ("QUALIFIED_INTELLIGENCE" | "GRAPH_QUALIFICATION" | "NODE_BUILDER" | "RELATIONSHIP_DISCOVERY" | "RELATIONSHIP_QUALIFICATION" | "GRAPH_VALIDATION" | "IMMUTABLE_GRAPH_LEDGER" | "SEMANTIC_QUERY_ENGINE" | "CROSS_MISSION_INTELLIGENCE_APIS")[];
  domains: readonly GraphDomain[];
  node_identity_deterministic: boolean;
  edge_identity_deterministic: boolean;
  qualification_only: boolean;
  governance_required: boolean;
  constitutional_required: boolean;
  tenant_isolation_required: boolean;
  replay_required: boolean;
  confidence_threshold: number;
  integrity_hash: string;
}>;

export type GraphNode = Readonly<{
  node_id: string;
  kind: GraphNodeKind;
  tenant_id: string;
  source_ref: string;
  version_ref: string;
  qualification_ref: string;
  lineage_refs: readonly string[];
  confidence: number;
  integrity_hash: string;
}>;

export type GraphEdge = Readonly<{
  edge_id: string;
  kind: GraphEdgeKind;
  from_node_id: string;
  to_node_id: string;
  domain: GraphDomain;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  lineage_refs: readonly string[];
  confidence: number;
  version: string;
  tenant_id: string;
  integrity_hash: string;
}>;

export type GraphDomainRecord = Readonly<{
  domain: GraphDomain;
  node_refs: readonly string[];
  edge_refs: readonly string[];
  validated: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type SemanticSearchResult = Readonly<{
  search_id: string;
  query: string;
  result_node_refs: readonly string[];
  explanation_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type TraversalRecord = Readonly<{
  traversal_id: string;
  start_node_id: string;
  path: readonly string[];
  relationship_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type HistoricalClusterRecord = Readonly<{
  cluster_id: string;
  label: string;
  node_refs: readonly string[];
  edge_refs: readonly string[];
  reproducible: boolean;
  integrity_hash: string;
}>;

export type GraphReplay = Readonly<{
  replay_id: string;
  node_reconstruction: boolean;
  edge_reconstruction: boolean;
  search_replay: boolean;
  traversal_replay: boolean;
  clustering_replay: boolean;
  lineage_replay: boolean;
  divergence_detected: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GraphLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "GRAPH_QUALIFIED" | "NODE_CREATED" | "EDGE_CREATED" | "RELATIONSHIP_QUALIFIED" | "GRAPH_VALIDATED" | "SEARCH_INDEXED" | "REPLAY_CERTIFIED" | "GRAPH_CERTIFIED";
  node_refs: readonly string[];
  edge_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type GraphObservability = Readonly<{
  observability_id: string;
  graph_growth_nodes: number;
  graph_growth_edges: number;
  orphan_nodes: number;
  broken_edges: number;
  stale_intelligence: number;
  duplicate_relationships: number;
  qualification_failures: number;
  replay_divergence: number;
  traversal_latency_ms: number;
  graph_consistency: number;
  lineage_completeness: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type CrossMissionGraphCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: CrossMissionGraphFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type CrossMissionGraphCertification = Readonly<{
  certification_id: string;
  status: CrossMissionGraphStatus;
  available_for_graph_intelligence: boolean;
  failures: readonly CrossMissionGraphFailure[];
  tests: readonly CrossMissionGraphCertificationTest[];
  integrity_hash: string;
}>;

export type CrossMissionGraphInput = Readonly<{ scenario?: CrossMissionGraphScenario; tenant_id?: string }>;

export type CrossMissionGraphResult = Readonly<{
  graph_version: "cross-mission-intelligence-graph/v11.4";
  graph_identifier: "CrossMissionIntelligenceGraph";
  institutional_memory_certified: boolean;
  contract: CrossMissionGraphContract;
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  domains: readonly GraphDomainRecord[];
  search: SemanticSearchResult;
  traversal: TraversalRecord;
  clusters: readonly HistoricalClusterRecord[];
  replay: GraphReplay;
  ledger: readonly GraphLedgerEntry[];
  observability: GraphObservability;
  certification: CrossMissionGraphCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CrossMissionGraphValidation = Readonly<{
  graph_id: string | null;
  valid: boolean;
  status: CrossMissionGraphStatus;
  available_for_graph_intelligence: boolean;
  failures: readonly CrossMissionGraphFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type CrossMissionGraphContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "cross-mission-intelligence-graph/v11.4";
    graph_is_adaptive_memory: false;
    graph_is_institutional_memory_store: false;
    qualification_only: true;
    confidence_qualified_edges: true;
    domains: readonly GraphDomain[];
  }>;
  result: CrossMissionGraphResult;
  validation: CrossMissionGraphValidation;
  observability: GraphObservability;
}>;
