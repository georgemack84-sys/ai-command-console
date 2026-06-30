import type { MissionControlOperationalDashboardReport } from "@/types/mission-control-operational-dashboard";

export type MissionControlGraphType = "PLANNING_GRAPH" | "DELEGATION_GRAPH" | "EXECUTION_GRAPH" | "LINEAGE_GRAPH" | "GOVERNANCE_GRAPH";
export type MissionControlGraphState = "INITIALIZED" | "BUILDING" | "VALIDATED" | "READY" | "REPLAYING" | "ARCHIVED" | "ERROR";
export type GraphLayoutType = "HIERARCHICAL" | "DAG" | "TIMELINE" | "FORCE_DIRECTED" | "TREE";
export type GraphReplayMode = "LIVE" | "SNAPSHOT" | "HISTORICAL" | "STEP_BY_STEP" | "FORENSIC";
export type GraphValidationOutcome = "VALID" | "WARNING" | "INVALID" | "BLOCKED";

export type PlanningGraphNodeType = "MISSION" | "OBJECTIVE" | "PLAN" | "SUBPLAN" | "TASK" | "DEPENDENCY" | "ALTERNATIVE" | "BRANCH" | "CONTINGENCY" | "CHECKPOINT";
export type DelegationGraphNodeType = "MISSION" | "TASK" | "AGENT" | "OPERATOR" | "EXTERNAL_SYSTEM" | "QUEUE" | "EXECUTION_UNIT";
export type ExecutionGraphNodeType = "MISSION" | "WORKFLOW" | "TASK" | "STEP" | "CHECKPOINT" | "FAILURE" | "ROLLBACK" | "RECOVERY";
export type LineageGraphNodeType = "MISSION" | "PLAN" | "EXECUTION" | "INTERVENTION" | "REPLAY" | "EVIDENCE" | "DECISION";
export type GovernanceGraphNodeType = "CONSTITUTION" | "POLICY" | "AUTHORITY" | "SUPERVISION" | "INTERVENTION" | "DECISION" | "PLAN" | "EXECUTION";
export type GraphNodeType = PlanningGraphNodeType | DelegationGraphNodeType | ExecutionGraphNodeType | LineageGraphNodeType | GovernanceGraphNodeType;

export type GraphEdgeType =
  | "DECOMPOSES_TO" | "DEPENDS_ON" | "ALTERNATIVE_TO" | "BRANCHES_TO" | "BLOCKS" | "ENABLES" | "FALLBACK_FOR"
  | "ASSIGNED_TO" | "OWNED_BY" | "ROUTED_TO" | "ESCALATED_TO" | "MONITORED_BY" | "REPORTED_TO"
  | "EXECUTES" | "FOLLOWS" | "CHECKPOINT_AFTER" | "ROLLBACK_TO" | "RECOVERS_FROM"
  | "PARENT_OF" | "CHILD_OF" | "DERIVED_FROM" | "REPLAY_OF" | "INTERVENED_IN" | "SUPPORTED_BY"
  | "AUTHORIZED" | "RESTRICTED" | "BLOCKED" | "APPROVED" | "RECOMMENDED" | "ESCALATED" | "INFLUENCED";

export type MissionControlGraphScenario =
  | "BASELINE"
  | "NONDETERMINISTIC_STRUCTURE"
  | "INCONSISTENT_RELATIONSHIP"
  | "MISSING_DEPENDENCY"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_GAP"
  | "MISSING_GOVERNANCE_INFLUENCE"
  | "HIDDEN_RELATIONSHIP"
  | "CROSS_TENANT_NODE"
  | "MISSING_INTEGRITY_HASH"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_EVIDENCE_REFERENCE"
  | "EXECUTION_AUTHORITY_EXPOSED"
  | "UNAUTHORIZED_GRAPH_ACCESS";

export type GraphVisualizationFailure =
  | "GRAPH_STRUCTURE_NONDETERMINISTIC"
  | "NODE_RELATIONSHIP_INCONSISTENT"
  | "DEPENDENCY_MISSING"
  | "REPLAY_RECONSTRUCTION_DIVERGED"
  | "LINEAGE_GAP_DETECTED"
  | "GOVERNANCE_INFLUENCE_NOT_TRACEABLE"
  | "HIDDEN_AUTONOMOUS_RELATIONSHIP_VISIBLE"
  | "CROSS_TENANT_NODE_VISIBLE"
  | "INTEGRITY_HASH_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "EVIDENCE_REFERENCE_MISSING"
  | "GRAPH_EXECUTION_AUTHORITY_EXPOSED"
  | "UNAUTHORIZED_GRAPH_ACCESS";

export type GraphNode = Readonly<{
  node_id: string;
  graph_type: MissionControlGraphType;
  tenant_id: string;
  mission_id: string;
  node_type: GraphNodeType;
  label: string;
  parent_node: string | null;
  status: string;
  confidence: number;
  risk_score: number;
  authority_level: string;
  timestamp: string;
  immutable_id: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_references: readonly string[];
  governance_references: readonly string[];
  position: Readonly<{ x: number; y: number }>;
  node_hash: string;
}>;

export type GraphEdge = Readonly<{
  edge_id: string;
  graph_type: MissionControlGraphType;
  source_node_id: string;
  target_node_id: string;
  edge_type: GraphEdgeType;
  relationship_origin: string;
  timestamp: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_references: readonly string[];
  edge_hash: string;
}>;

export type GraphLayoutRecord = Readonly<{
  layout_id: string;
  layout_type: GraphLayoutType;
  layout_version: string;
  node_positions_preserved: boolean;
  edge_order_preserved: boolean;
  filtering_preserves_structure: boolean;
  evidence_overlay_enabled: boolean;
  integrity_overlay_enabled: boolean;
  layout_hash: string;
}>;

export type GraphReplayRecord = Readonly<{
  replay_id: string;
  replay_mode: GraphReplayMode;
  historical_reconstruction_enabled: boolean;
  node_evolution_enabled: boolean;
  edge_evolution_enabled: boolean;
  checkpoint_navigation_enabled: boolean;
  replay_reference: string;
  replay_hash: string;
}>;

export type MissionControlGraph = Readonly<{
  graph_id: string;
  graph_type: MissionControlGraphType;
  tenant_id: string;
  mission_id: string;
  graph_version: string;
  graph_state: MissionControlGraphState;
  root_node: string;
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  layout_version: string;
  render_order: readonly string[];
  created_at: string;
  updated_at: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  graph_hash: string;
}>;

export type GraphValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: GraphVisualizationFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type MissionControlGraphVisualizationReport = Readonly<{
  phase_version: "8J.3";
  schema_version: "mission-control-graph-visualization-engine/v8J.3";
  engine_id: string;
  tenant_id: string;
  mission_id: string;
  validation_outcome: GraphValidationOutcome;
  operational_dashboard: MissionControlOperationalDashboardReport;
  graphs: readonly MissionControlGraph[];
  layout_record: GraphLayoutRecord;
  replay_record: GraphReplayRecord;
  validation_tests: readonly GraphValidationTest[];
  failures: readonly GraphVisualizationFailure[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authority_granted: false;
  engine_hash: string;
}>;

export type MissionControlGraphVisualizationInput = Readonly<{
  scenario?: MissionControlGraphScenario;
  replay_mode?: GraphReplayMode;
  layout_type?: GraphLayoutType;
}>;

export type MissionControlGraphVisualizationValidationResult = Readonly<{
  engine_id: string | null;
  valid: boolean;
  validation_outcome: GraphValidationOutcome;
  failures: readonly GraphVisualizationFailure[];
  engine_hash_valid: boolean;
  advisory_only: boolean;
  validation_hash: string;
}>;

export type MissionControlGraphVisualizationObservabilitySurface = Readonly<{
  engine_id: string;
  validation_outcome: GraphValidationOutcome;
  graph_count: number;
  node_count: number;
  edge_count: number;
  layout_type: GraphLayoutType;
  replay_mode: GraphReplayMode;
  failed_tests: number;
  failures: readonly GraphVisualizationFailure[];
  advisory_only: boolean;
  execution_authority_granted: boolean;
  engine_hash: string;
}>;
