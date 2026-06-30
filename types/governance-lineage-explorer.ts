import type { GovernanceCorrelationRelationshipType } from "@/types/governance-cross-ledger-correlation";
import type { GovernanceSearchDomain } from "@/types/governance-search-engine";

export type GovernanceLineageExplorerState = "COMPLETE" | "PARTIAL" | "BROKEN" | "RESTRICTED";
export type GovernanceLineageExplorerAction =
  | "MODIFY_LINEAGE"
  | "CREATE_RELATIONSHIP"
  | "DELETE_RELATIONSHIP"
  | "ALTER_HISTORY"
  | "OVERRIDE_GOVERNANCE"
  | "REASSIGN_PARENT";

export type GovernanceLineageExplorerInput = Readonly<{
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
  selected_node_id?: string;
  state?: GovernanceLineageExplorerState;
}>;

export type GovernanceLineageNode = Readonly<{
  node_id: string;
  object_ref: string;
  node_type: GovernanceSearchDomain;
  label: string;
  lineage_depth: number;
  integrity_state: "VERIFIED" | "PARTIAL" | "BROKEN" | "RESTRICTED";
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  node_hash: string;
}>;

export type GovernanceLineageEdge = Readonly<{
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: GovernanceCorrelationRelationshipType;
  evidence_refs: readonly string[];
  lineage_ref: string;
  replay_ref: string;
  edge_hash: string;
}>;

export type GovernanceLineagePath = Readonly<{
  path_id: string;
  path_type: "FORWARD" | "BACKWARD" | "ROOT" | "DEPENDENCY" | "INFLUENCE" | "SUPERSESSION";
  nodes: readonly string[];
  edges: readonly string[];
  complete: boolean;
  explanation: string;
  path_hash: string;
}>;

export type GovernanceLineageTimelineEvent = Readonly<{
  event_id: string;
  timestamp: string;
  node_id: string;
  event_type: "POLICY_CHANGE" | "EVIDENCE_COLLECTION" | "RISK_DEVELOPMENT" | "COMPLIANCE_EVALUATION" | "RECOMMENDATION_GENERATION" | "ESCALATION_PROGRESSION" | "CERTIFICATION_MILESTONE";
  summary: string;
  event_hash: string;
}>;

export type GovernanceLineageExplorerView = Readonly<{
  explorer_id: string;
  schema_version: "governance-lineage-explorer/v7K.3";
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  selected_node_id: string;
  explorer_state: GovernanceLineageExplorerState;
  explorer_version: "governance-lineage-view/v7K.3";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  relationship_creation_allowed: false;
  mutation_allowed: false;
  tenant_isolated: boolean;
  authorization_enforced: boolean;
  graph_hash: string | null;
  replay_consistent: boolean;
  lineage_verified: boolean;
  nodes: readonly GovernanceLineageNode[];
  edges: readonly GovernanceLineageEdge[];
  parent_chain: readonly GovernanceLineagePath[];
  child_chain: readonly GovernanceLineagePath[];
  root_lineage: readonly GovernanceLineagePath[];
  dependency_chains: readonly GovernanceLineagePath[];
  influence_paths: readonly GovernanceLineagePath[];
  supersession_history: readonly GovernanceLineagePath[];
  timeline: readonly GovernanceLineageTimelineEvent[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  missing_dependencies: readonly string[];
  circular_dependencies: readonly string[];
  explorer_hash: string;
}>;

export type GovernanceLineageExplorerObservabilitySurface = Readonly<{
  explorer_id: string;
  explorer_state: GovernanceLineageExplorerState;
  node_count: number;
  edge_count: number;
  lineage_verified: boolean;
  replay_consistent: boolean;
  read_only: true;
  explorer_hash: string;
}>;
