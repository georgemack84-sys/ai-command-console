import type { DecisionTimelineResult } from "@/types/decision-timeline-visualization";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type DecisionConflictType =
  | "RECOMMENDATION_CONFLICT"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_CONFLICT"
  | "EVIDENCE_CONFLICT"
  | "PRIORITY_CONFLICT"
  | "RISK_CONFIDENCE_CONFLICT"
  | "DEPENDENCY_CONFLICT"
  | "MISSION_OBJECTIVE_CONFLICT"
  | "TIMING_CONFLICT"
  | "RESOURCE_CONFLICT"
  | "TENANT_BOUNDARY_CONFLICT"
  | "CERTIFICATION_CONFLICT";

export type DependencyRelationshipType = "REQUIRES" | "BLOCKS" | "SUPPORTS" | "CONFLICTS_WITH" | "DEPENDS_ON" | "SUPERSEDES" | "DERIVED_FROM" | "ESCALATES_TO" | "GOVERNED_BY" | "CERTIFIED_BY";
export type ArbitrationState = "NOT_REQUIRED" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "ESCALATED" | "REJECTED" | "ARCHIVED";
export type BlockerType = "MISSING_DEPENDENCY" | "UNRESOLVED_CONFLICT" | "MISSING_EVIDENCE" | "LOW_CONFIDENCE" | "HIGH_RISK" | "GOVERNANCE_RESTRICTION" | "CONSTITUTIONAL_VIOLATION" | "MISSING_AUTHORITY" | "MISSING_OPERATOR_APPROVAL" | "FAILED_REPLAY" | "FAILED_CERTIFICATION";
export type ConflictSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ConflictDependencyVisualizationFailure =
  | "CONFLICTS_HIDDEN"
  | "DEPENDENCIES_HIDDEN"
  | "BLOCKERS_HIDDEN"
  | "ARBITRATION_OUTCOME_MISSING"
  | "RELATIONSHIP_EXPLORER_INCOMPLETE"
  | "CONFLICT_LEDGER_INCOMPLETE"
  | "GRAPH_ORDER_NONDETERMINISTIC"
  | "CIRCULAR_DEPENDENCY_UNDETECTED"
  | "GOVERNANCE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "CROSS_TENANT_GRAPH_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "GRAPH_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type ConflictRecord = Readonly<{
  conflict_id: string;
  conflict_type: DecisionConflictType;
  decision_refs: readonly string[];
  conflict_refs: readonly string[];
  severity: ConflictSeverity;
  arbitration_state: ArbitrationState;
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  tenant_id: string;
  integrity_hash: string;
}>;

export type DependencyNode = Readonly<{
  node_id: string;
  decision_ref: string;
  node_type: "DECISION" | "EVIDENCE" | "GOVERNANCE" | "OPERATOR" | "REPLAY" | "CERTIFICATION";
  tenant_id: string;
  state: "READY" | "BLOCKED" | "RESOLVED" | "ESCALATED";
  integrity_hash: string;
}>;

export type DependencyEdge = Readonly<{
  edge_id: string;
  source_ref: string;
  target_ref: string;
  relationship_type: DependencyRelationshipType;
  blocker: boolean;
  conflict_ref: string | null;
  rendering_order: number;
  integrity_hash: string;
}>;

export type ConflictMap = Readonly<{
  conflict_map_id: string;
  tenant_id: string;
  mission_id: string;
  decision_refs: readonly string[];
  conflict_refs: readonly string[];
  conflict_clusters: readonly string[];
  severity_summary: readonly ConflictSeverity[];
  arbitration_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DependencyGraphView = Readonly<{
  graph_view_id: string;
  dependency_graph_id: string;
  tenant_id: string;
  mission_id: string;
  node_refs: readonly string[];
  edge_refs: readonly string[];
  blocker_refs: readonly string[];
  conflict_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  rendering_order: readonly string[];
  cycle_detected: boolean;
  integrity_hash: string;
}>;

export type ArbitrationView = Readonly<{
  arbitration_view_id: string;
  arbitration_id: string;
  conflict_refs: readonly string[];
  decision_refs: readonly string[];
  selected_outcome: string;
  rejected_outcomes: readonly string[];
  tradeoff_summary: string;
  governance_state: string;
  constitutional_state: string;
  operator_required: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type BlockerView = Readonly<{
  blocker_view_id: string;
  blocker_id: string;
  blocked_decision_ref: string;
  blocking_decision_refs: readonly string[];
  blocker_type: BlockerType;
  blocker_severity: ConflictSeverity;
  resolution_requirement: string;
  escalation_path: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RelationshipExplorer = Readonly<{
  explorer_id: string;
  tenant_id: string;
  mission_id: string;
  root_decision_ref: string;
  relationship_depth: number;
  relationship_filters: readonly string[];
  visible_nodes: readonly string[];
  visible_edges: readonly string[];
  governance_overlays: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConflictLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type:
    | "CONFLICT_DETECTED"
    | "CONFLICT_CLASSIFIED"
    | "BLOCKER_DETECTED"
    | "DEPENDENCY_RESOLVED"
    | "ARBITRATION_INITIATED"
    | "ARBITRATION_RESOLVED"
    | "GOVERNANCE_ESCALATION_CREATED"
    | "OPERATOR_REVIEW_REQUIRED"
    | "REPLAY_VERIFIED"
    | "CONFLICT_ARCHIVED";
  evidence_ref: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ConflictDependencyVisualizationMetrics = Readonly<{
  conflict_count: number;
  dependency_count: number;
  blocker_count: number;
  critical_conflicts: number;
  arbitration_resolved: number;
  governance_overlays: number;
  replay_linked_items: number;
  integrity_hash: string;
}>;

export type ConflictDependencyVisualizationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  conflicts_visible: boolean;
  dependencies_visible: boolean;
  blockers_visible: boolean;
  arbitration_complete: boolean;
  relationship_explorer_complete: boolean;
  ledger_complete: boolean;
  deterministic_rendering: boolean;
  circular_dependencies_detected: boolean;
  governance_refs_present: boolean;
  replay_refs_present: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly ConflictDependencyVisualizationFailure[];
  integrity_hash: string;
}>;

export type ConflictDependencyVisualizationInput = Readonly<{
  timeline_result?: DecisionTimelineResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "HIDE_CONFLICTS"
    | "HIDE_DEPENDENCIES"
    | "HIDE_BLOCKERS"
    | "MISSING_ARBITRATION"
    | "INCOMPLETE_EXPLORER"
    | "INCOMPLETE_LEDGER"
    | "NONDETERMINISTIC_GRAPH"
    | "CYCLE_UNDETECTED"
    | "MISSING_GOVERNANCE_REFS"
    | "MISSING_REPLAY_REFS"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ConflictDependencyVisualizationResult = Readonly<{
  visualization_version: "decision-conflict-dependency-visualization/v1";
  timeline_result: DecisionTimelineResult;
  conflicts: readonly ConflictRecord[];
  dependency_nodes: readonly DependencyNode[];
  dependency_edges: readonly DependencyEdge[];
  conflict_map: ConflictMap;
  dependency_graph: DependencyGraphView;
  arbitration_view: ArbitrationView;
  blocker_views: readonly BlockerView[];
  relationship_explorer: RelationshipExplorer;
  conflict_ledger: readonly ConflictLedgerEntry[];
  metrics: ConflictDependencyVisualizationMetrics;
  validation: ConflictDependencyVisualizationValidation;
  deterministic: true;
  advisory_only: true;
  mutates_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConflictDependencyVisualizationFoundation = Readonly<{
  visualization_version: "decision-conflict-dependency-visualization/v1";
  conflict_types: readonly DecisionConflictType[];
  relationship_types: readonly DependencyRelationshipType[];
  arbitration_states: readonly ArbitrationState[];
  blocker_types: readonly BlockerType[];
  result: ConflictDependencyVisualizationResult;
}>;
