import type { DecisionNarrative } from "@/types/decision-narrative-engine";
import type { ExplanationRecord, ExplanationType } from "@/types/explainability-contract";

export type ReasoningGraphType = "EVIDENCE_CHAIN" | "POLICY_INFLUENCE" | "CONSTITUTIONAL_REASONING" | "AUTHORITY_LINEAGE" | "EXPLANATION_GRAPH" | "REPLAY_LINEAGE" | "TRUTH_LEDGER_REFERENCE";
export type GraphNodeCategory = "MISSION" | "OBJECTIVE" | "OBSERVATION" | "EVIDENCE" | "PLAN" | "DECISION" | "RECOMMENDATION" | "POLICY" | "CONSTITUTION" | "AUTHORITY" | "APPROVAL" | "EXECUTION" | "SUPERVISION" | "INTERVENTION" | "REPLAY" | "TRUTH_LEDGER" | "CONFIDENCE" | "RISK" | "NARRATIVE";
export type GraphRelationshipType = "causes" | "supports" | "validates" | "approves" | "constrains" | "depends_on" | "generated_by" | "references" | "reconstructs" | "governs" | "influences" | "verifies" | "derived_from" | "contradicts" | "supersedes" | "enforced_by" | "overrides" | "rejects" | "requires" | "inherited_from" | "approved_by" | "delegated_to" | "rejected_by" | "escalated_to";
export type EvidenceLifecycleState = "COLLECTED" | "REGISTERED" | "VALIDATED" | "LINKED" | "GOVERNANCE_VERIFIED" | "REPLAY_CERTIFIED" | "ARCHIVED" | "REJECTED";
export type PolicyEvaluationState = "NOT_EVALUATED" | "EVALUATING" | "COMPLIANT" | "NON_COMPLIANT" | "CONDITIONALLY_APPROVED" | "REJECTED" | "CERTIFIED";
export type AuthorityValidationState = "PENDING" | "VALIDATED" | "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "REVOKED";

export type ReasoningGraphScenario =
  | "BASELINE"
  | "MISSING_EVIDENCE"
  | "UNSUPPORTED_RELATIONSHIP"
  | "INCOMPLETE_POLICY_LINEAGE"
  | "MISSING_CONSTITUTIONAL_REFERENCES"
  | "INCOMPLETE_AUTHORITY_VALIDATION"
  | "DECISION_LINEAGE_GAP"
  | "INVALID_REPLAY_REFERENCE"
  | "NONDETERMINISTIC_TOPOLOGY"
  | "DUPLICATE_NODES"
  | "ORPHANED_RELATIONSHIP"
  | "CROSS_TENANT_RELATIONSHIP"
  | "INTEGRITY_FAILURE"
  | "FABRICATED_DEPENDENCY"
  | "ADVISORY_ONLY_VIOLATION";

export type ReasoningGraphFailure =
  | "EVIDENCE_MISSING"
  | "UNSUPPORTED_RELATIONSHIP_DETECTED"
  | "POLICY_LINEAGE_INCOMPLETE"
  | "CONSTITUTIONAL_REFERENCES_ABSENT"
  | "AUTHORITY_VALIDATION_INCOMPLETE"
  | "DECISION_LINEAGE_GAP_DETECTED"
  | "REPLAY_REFERENCE_INVALID"
  | "GRAPH_TOPOLOGY_NONDETERMINISTIC"
  | "DUPLICATE_NODE_DETECTED"
  | "ORPHANED_RELATIONSHIP_DETECTED"
  | "CROSS_TENANT_RELATIONSHIP_DETECTED"
  | "INTEGRITY_HASH_INVALID"
  | "FABRICATED_DEPENDENCY_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type ReasoningGraphNode = Readonly<{
  node_id: string;
  category: GraphNodeCategory;
  label: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  source_reference: string;
  truth_reference: string;
  replay_reference: string;
  lineage_reference: string;
  lifecycle_state: EvidenceLifecycleState | PolicyEvaluationState | AuthorityValidationState | "CERTIFIED";
  deterministic_order: number;
  integrity_hash: string;
}>;

export type ReasoningGraphEdge = Readonly<{
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  relationship: GraphRelationshipType | string;
  tenant_id: string;
  mission_id: string;
  evidence_reference: string;
  truth_reference: string;
  replay_reference: string;
  lineage_reference: string;
  deterministic_order: number;
  fabricated_dependency: boolean;
  integrity_hash: string;
}>;

export type ReasoningGraph = Readonly<{
  graph_id: string;
  graph_type: ReasoningGraphType;
  graph_version: "reasoning-graph/v8ALT.5.3";
  engine_version: "evidence-policy-reasoning-graph/v8ALT.5.3";
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  execution_id: string;
  explanation_id: string;
  narrative_id: string | null;
  source_explanation: ExplanationRecord;
  source_narrative: DecisionNarrative | null;
  nodes: readonly ReasoningGraphNode[];
  edges: readonly ReasoningGraphEdge[];
  replay_reference: string;
  lineage_reference: string;
  truth_reference: string;
  advisory_only: true;
  plan_modified: boolean;
  execution_modified: boolean;
  evidence_modified: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  graph_hash: string;
}>;

export type ReasoningGraphRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  graphs: readonly ReasoningGraph[];
  append_only: true;
  read_only: true;
  repository_hash: string;
}>;

export type ReasoningGraphInput = Readonly<{
  scenario?: ReasoningGraphScenario;
  tenant_id?: string;
  mission_id?: string;
  explanation?: ExplanationRecord;
  narrative?: DecisionNarrative;
}>;

export type ReasoningGraphQueryCriteria = Readonly<{
  mission_id?: string;
  execution_id?: string;
  plan_id?: string;
  decision_id?: string;
  authority?: string;
  policy?: string;
  constitution?: string;
  evidence?: string;
  replay_reference?: string;
  truth_reference?: string;
  node_category?: GraphNodeCategory;
  relationship?: GraphRelationshipType;
}>;

export type ReasoningGraphValidationResult = Readonly<{
  graph_id: string | null;
  valid: boolean;
  evidence_complete: boolean;
  policy_complete: boolean;
  constitutional_complete: boolean;
  authority_complete: boolean;
  lineage_complete: boolean;
  replay_valid: boolean;
  topology_deterministic: boolean;
  duplicate_free: boolean;
  orphan_free: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  fabricated_dependencies_rejected: boolean;
  advisory_only_enforced: boolean;
  failures: readonly ReasoningGraphFailure[];
  validation_hash: string;
}>;

export type ReasoningGraphReplayResult = Readonly<{
  replay_reference: string;
  graph_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  node_count: number;
  edge_count: number;
  replay_result_hash: string;
}>;

export type ReasoningGraphObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  graph_count: number;
  graph_types: readonly ReasoningGraphType[];
  node_count: number;
  edge_count: number;
  advisory_only: true;
  repository_hash: string;
}>;

export type ReasoningGraphContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "evidence-policy-reasoning-graph/v8ALT.5.3";
    principles: readonly string[];
    graph_types: readonly ReasoningGraphType[];
    node_categories: readonly GraphNodeCategory[];
    relationship_types: readonly GraphRelationshipType[];
    source_explanation_types: readonly ExplanationType[];
    advisory_only: true;
  }>;
  repository: ReasoningGraphRepository;
  validation: ReasoningGraphValidationResult;
  replay: ReasoningGraphReplayResult;
  observability: ReasoningGraphObservabilitySurface;
}>;
