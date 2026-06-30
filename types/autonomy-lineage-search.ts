import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";
import type { ReplayHistoricalReconstructionResponse } from "@/types/replay-historical-reconstruction-query";

export type AutonomyLineageSearchType = "LINEAGE_SEARCH" | "INFLUENCE_CHAIN" | "BROKEN_LINEAGE" | "REFERENCE_INDEX" | "RELATIONSHIP_LOOKUP";
export type LineageRelationshipType = "DERIVED_FROM" | "DEPENDS_ON" | "BLOCKED_BY" | "AUTHORIZED_BY" | "REJECTED_BY" | "SUPERVISED_BY" | "INTERVENED_BY" | "REPLAYED_BY" | "VERIFIED_BY" | "SUPERSEDED_BY";
export type LineageObjectType = "OBJECTIVE" | "PLAN" | "DECISION" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "INTERVENTION" | "ROLLBACK" | "RECOVERY" | "REPLAY" | "INTEGRITY" | "GOVERNANCE" | "POLICY" | "BOUNDARY";

export type AutonomyLineageSearchErrorState =
  | "INVALID_LINEAGE_REQUEST"
  | "LINEAGE_NOT_FOUND"
  | "BROKEN_LINEAGE"
  | "ORPHANED_REFERENCE"
  | "CIRCULAR_REFERENCE"
  | "INVALID_RELATIONSHIP"
  | "INVALID_REPLAY_REFERENCE"
  | "INVALID_INTEGRITY_REFERENCE"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE";

export type AutonomyLineageSearchState = "LOOKUP_RETURNED" | "NO_RESULTS" | AutonomyLineageSearchErrorState;

export type AutonomyLineageSearchScenario =
  | "BASELINE"
  | "LINEAGE_SEARCH"
  | "INFLUENCE_CHAIN"
  | "BROKEN_LINEAGE"
  | "REFERENCE_INDEX"
  | "RELATIONSHIP_LOOKUP"
  | "LINEAGE_NOT_FOUND"
  | "ORPHANED_REFERENCE"
  | "CIRCULAR_REFERENCE"
  | "INVALID_RELATIONSHIP"
  | "INVALID_REPLAY_REFERENCE"
  | "INVALID_INTEGRITY_REFERENCE"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "MUTATION_ATTEMPT";

export type LineageRecord = Readonly<{
  lineage_id: string;
  tenant_id: string;
  mission_id: string;
  source_object_id: string;
  source_object_type: LineageObjectType;
  relationship_type: LineageRelationshipType;
  target_object_id: string;
  target_object_type: LineageObjectType;
  replay_reference: string;
  governance_reference: string;
  policy_reference: string;
  integrity_hash: string;
  lineage_timestamp: string;
  autonomy_event_sequence: number;
  lineage_hash: string;
}>;

export type LineageIndexEntry = Readonly<{
  lineage_reference: string;
  parent_reference: string;
  child_reference: string;
  relationship_type: LineageRelationshipType;
  object_type: LineageObjectType;
  replay_reference: string;
  integrity_hash: string;
  index_hash: string;
}>;

export type InfluenceChainNode = Readonly<{
  node_id: string;
  object_id: string;
  object_type: LineageObjectType;
  label: string;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type BrokenLineageFinding = Readonly<{
  finding_id: string;
  finding_type: "MISSING_LINEAGE" | "INVALID_REFERENCE" | "CIRCULAR_DEPENDENCY" | "REPLAY_DIVERGENCE" | "INTEGRITY_MISMATCH" | "ORPHANED_HISTORY" | "DUPLICATED_REFERENCE";
  affected_reference: string;
  detection_reason: string;
  repair_attempted: false;
  replay_reference: string;
  integrity_hash: string;
  finding_hash: string;
}>;

export type InfluenceChainView = Readonly<{
  influence_chain_id: string;
  root_object_id: string;
  terminal_object_id: string;
  nodes: readonly InfluenceChainNode[];
  relationships: readonly LineageRecord[];
  replay_reference: string;
  integrity_hash: string;
  chain_hash: string;
}>;

export type AutonomyLineageSearchAuditRecord = Readonly<{
  audit_id: string;
  lineage_query_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  lineage_scope: AutonomyLineageSearchType;
  returned_relationship_count: number;
  authorization_result: "APPROVED" | "REJECTED";
  result_hash: string;
  replay_reference: string;
  integrity_hash: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type AutonomyLineageSearchResponse = Readonly<{
  phase_version: "8I.7";
  schema_version: "autonomy-lineage-search/v8I.7";
  lineage_query_id: string;
  search_type: AutonomyLineageSearchType;
  search_state: AutonomyLineageSearchState;
  tenant_id: string;
  mission_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  reconstruction_response: ReplayHistoricalReconstructionResponse | null;
  lineage_records: readonly LineageRecord[];
  lineage_index: readonly LineageIndexEntry[];
  influence_chain: InfluenceChainView | null;
  broken_lineage_findings: readonly BrokenLineageFinding[];
  audit_record: AutonomyLineageSearchAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  integrity_hash: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Autonomy lineage search is deterministic, read-only, replay-compatible, and never repairs or rewrites lineage.";
}>;

export type AutonomyLineageSearchInput = Readonly<{
  scenario?: AutonomyLineageSearchScenario;
  search_type?: AutonomyLineageSearchType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
}>;

export type AutonomyLineageSearchObservabilitySurface = Readonly<{
  lineage_query_id: string;
  search_type: AutonomyLineageSearchType;
  search_state: AutonomyLineageSearchState;
  tenant_id: string;
  mission_id: string;
  relationship_count: number;
  index_count: number;
  influence_chain_nodes: number;
  broken_findings: number;
  errors: readonly AutonomyLineageSearchErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
