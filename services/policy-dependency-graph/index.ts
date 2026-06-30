import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildPolicyAnalysisRecord, validatePolicyAnalysisRecord } from "@/services/policy-analysis";
import { generatePolicyCorrelations, validatePolicyCorrelationRecord } from "@/services/policy-correlation";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type {
  PolicyConflictRecord,
  PolicyConflictType,
  PolicyDependencyEdge,
  PolicyDependencyGraph,
  PolicyDependencyGraphDoctrine,
  PolicyDependencyGraphFailureReason,
  PolicyDependencyGraphValidationFailure,
  PolicyDependencyGraphValidationResult,
  PolicyDependencyNode,
  PolicyGraphEngineResult,
  PolicyGraphExplanation,
  PolicyGraphNodeType,
  PolicyGraphObservabilitySurface,
  PolicyGraphRelationshipState,
  PolicyGraphRelationshipType,
  PolicyGraphReplayRefs,
  PolicyGraphReplayResult,
  PolicyGraphScope,
  PolicyGraphSnapshot,
  PolicyGraphState,
} from "@/types/policy-dependency-graph";

const NOW = "2026-06-25T06:00:00.000Z";
const ALGORITHM_VERSION = "policy-dependency-graph/v7B.3" as const;
const GRAPH_ID = "pg_tenant_alpha_policy_dependency_v7b3";
const ALLOWED_POLICY_ANALYSIS_STATES = ["VALIDATED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"] as const;
const ALLOWED_CORRELATION_STATES = ["CONSISTENCY_VERIFIED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"] as const;
export const POLICY_GRAPH_NODE_TYPES = ["POLICY", "AUTHORITY", "CONSTRAINT", "EXCEPTION", "RECOMMENDATION", "GOVERNANCE_DECISION", "RUNTIME_CONTROL"] as const;
export const POLICY_GRAPH_RELATIONSHIP_TYPES = ["DEPENDS_ON", "SUPERSEDES", "INHERITS", "CONFLICTS_WITH", "REFERENCES", "EXTENDS", "LIMITS", "ENABLES", "DISABLES", "SUPPORTED_BY"] as const;
export const POLICY_GRAPH_STATES = ["CREATED", "NODES_RESOLVED", "EDGES_RESOLVED", "CONFLICTS_ANALYZED", "VALIDATED", "REPLAYABLE", "RESTRICTED", "SUPERSEDED", "INVALID", "ARCHIVED"] as const;

const ALLOWED_GRAPH_TRANSITIONS: Readonly<Record<PolicyGraphState, readonly PolicyGraphState[]>> = Object.freeze({
  CREATED: Object.freeze(["NODES_RESOLVED", "INVALID"] as const),
  NODES_RESOLVED: Object.freeze(["EDGES_RESOLVED", "INVALID"] as const),
  EDGES_RESOLVED: Object.freeze(["CONFLICTS_ANALYZED", "INVALID"] as const),
  CONFLICTS_ANALYZED: Object.freeze(["VALIDATED", "INVALID"] as const),
  VALIDATED: Object.freeze(["REPLAYABLE", "INVALID"] as const),
  REPLAYABLE: Object.freeze(["RESTRICTED", "SUPERSEDED", "ARCHIVED"] as const),
  RESTRICTED: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  INVALID: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function uniq(items: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(items.filter(Boolean))].sort());
}

function validationFailure(reason: PolicyDependencyGraphFailureReason, field_path: string, message: string): PolicyDependencyGraphValidationFailure {
  return Object.freeze({
    failure_id: hashValue("policy-dependency-graph-validation-failure", { reason, field_path, message }),
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

export function buildPolicyDependencyGraphDoctrine(): PolicyDependencyGraphDoctrine {
  return Object.freeze({
    principles: Object.freeze(["advisory-only-graph", "no-autonomous-conflict-resolution", "immutable-historical-snapshot", "replay-required", "tenant-isolated", "fail-closed", "no-policy-mutation"] as const),
    prohibited_behaviors: Object.freeze(["policy mutation", "policy deletion", "silent conflict resolution", "authority expansion", "implicit inheritance", "unsupported dependency inference", "historical graph mutation", "replay mismatch acceptance"]),
    supported_node_types: Object.freeze([...POLICY_GRAPH_NODE_TYPES]),
    supported_relationship_types: Object.freeze([...POLICY_GRAPH_RELATIONSHIP_TYPES]),
    acyclic_relationship_types: Object.freeze(["INHERITS", "DEPENDS_ON", "SUPERSEDES", "EXTENDS"] as const),
    allowed_graph_transitions: ALLOWED_GRAPH_TRANSITIONS,
  });
}

export function buildDefaultPolicyGraphInputs(): { policy_analyses: readonly PolicyAnalysisRecord[]; policy_correlations: readonly PolicyCorrelationRecord[] } {
  const base = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" });
  const authority = buildPolicyAnalysisRecord({
    analysis_state: "VALIDATED",
    policy_analysis_id: "pa_tenant_alpha_policy_authority_000146",
    policy_id: "policy_runtime_authority_boundary",
    policy_version: "v1.1.0",
    policy_name: "Runtime Authority Boundary Policy",
    policy_type: "AUTHORITY_POLICY",
    permissions: [{ permission_id: "permission_authority_review", behavior: "review runtime authority", scope: "tenant_alpha", authority_ref: "Governance Control Layer" }],
    prohibitions: [{ prohibition_id: "prohibition_external_network", behavior: "external network access", scope: "tenant_alpha", fail_closed: true }],
    lineage_refs: { ...base.lineage_refs, related_policy_ids: [base.policy_id], dependency_refs: ["dependency_runtime_boundary"], lineage_hash: hashValue("policy-graph-lineage", "authority") },
  });
  const tenant = buildPolicyAnalysisRecord({
    analysis_state: "VALIDATED",
    policy_analysis_id: "pa_tenant_alpha_policy_tenant_000147",
    policy_id: "policy_tenant_isolation",
    policy_version: "v2.0.0",
    policy_name: "Tenant Isolation Policy",
    policy_type: "TENANT_POLICY",
    permissions: [{ permission_id: "permission_internal_network", behavior: "external network access", scope: "tenant_alpha", authority_ref: "Operator" }],
    prohibitions: [{ prohibition_id: "prohibition_cross_tenant", behavior: "access cross-tenant truth records", scope: "all", fail_closed: true }],
    lineage_refs: { ...base.lineage_refs, child_policy_ids: [base.policy_id], dependency_refs: ["dependency_tenant_isolation"], lineage_hash: hashValue("policy-graph-lineage", "tenant") },
  });
  return Object.freeze({
    policy_analyses: Object.freeze([base, authority, tenant]),
    policy_correlations: generatePolicyCorrelations(base),
  });
}

function nodeHash(source: Omit<PolicyDependencyNode, "node_hash">): string {
  return hashValue("policy-dependency-node", source);
}

function freezeNode(node: PolicyDependencyNode): PolicyDependencyNode {
  return Object.freeze({
    ...node,
    source_policy_refs: uniq(node.source_policy_refs),
    source_correlation_refs: uniq(node.source_correlation_refs),
    source_truth_records: uniq(node.source_truth_records),
    lineage_refs: uniq(node.lineage_refs),
    replay_refs: uniq(node.replay_refs),
  });
}

function makeNode(input: Omit<PolicyDependencyNode, "node_hash">): PolicyDependencyNode {
  return freezeNode({ ...input, node_hash: nodeHash(input) });
}

export function buildPolicyNode(policy: PolicyAnalysisRecord): PolicyDependencyNode {
  return makeNode({
    node_id: `node_policy_${policy.policy_id}_${policy.policy_version}`,
    node_type: "POLICY",
    tenant_id: policy.tenant_id,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    policy_type: policy.policy_type,
    source_policy_refs: [policy.policy_analysis_id],
    source_correlation_refs: [],
    source_truth_records: policy.source_truth_records.map((record) => record.truth_record_id),
    lineage_refs: [policy.lineage_refs.lineage_hash, ...policy.lineage_refs.dependency_refs],
    replay_refs: [policy.replay_refs.input_snapshot_ref, policy.replay_refs.policy_snapshot_ref, policy.replay_refs.output_hash],
  });
}

export function buildAuthorityNodes(policies: readonly PolicyAnalysisRecord[]): readonly PolicyDependencyNode[] {
  const authorities = new Map<string, PolicyDependencyNode>();
  for (const policy of policies) {
    for (const [authority_type, authority_id] of Object.entries({
      governing: policy.authority_scope.governing_authority,
      approval: policy.authority_scope.approval_authority,
      review: policy.authority_scope.review_authority,
      escalation: policy.authority_scope.escalation_authority,
    })) {
      const node_id = `node_authority_${authority_id.replaceAll(" ", "_").toLowerCase()}`;
      const existing = authorities.get(node_id);
      const source_policy_refs = [...(existing?.source_policy_refs ?? []), policy.policy_id];
      authorities.set(node_id, makeNode({
        node_id,
        node_type: "AUTHORITY",
        tenant_id: policy.tenant_id,
        authority_id,
        authority_type,
        source_policy_refs,
        source_correlation_refs: [],
        source_truth_records: policy.source_truth_records.map((record) => record.truth_record_id),
        lineage_refs: [policy.lineage_refs.lineage_hash],
        replay_refs: [policy.replay_refs.policy_snapshot_ref],
      }));
    }
  }
  return Object.freeze([...authorities.values()].sort((a, b) => a.node_id.localeCompare(b.node_id)));
}

export function buildConstraintNodes(policies: readonly PolicyAnalysisRecord[]): readonly PolicyDependencyNode[] {
  return Object.freeze(policies.flatMap((policy) => policy.constraints.map((constraint) => makeNode({
    node_id: `node_constraint_${policy.policy_id}_${constraint.constraint_id}`,
    node_type: "CONSTRAINT",
    tenant_id: policy.tenant_id,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    constraint_id: constraint.constraint_id,
    constraint_type: constraint.category,
    constraint_expression: constraint.rule,
    source_policy_refs: [policy.policy_id],
    source_correlation_refs: [],
    source_truth_records: [constraint.truth_reference],
    lineage_refs: [policy.lineage_refs.lineage_hash],
    replay_refs: [policy.replay_refs.policy_snapshot_ref],
  }))));
}

export function buildExceptionNodes(policies: readonly PolicyAnalysisRecord[]): readonly PolicyDependencyNode[] {
  return Object.freeze(policies.flatMap((policy) => policy.exceptions.map((exception) => makeNode({
    node_id: `node_exception_${policy.policy_id}_${exception.exception_id}`,
    node_type: "EXCEPTION",
    tenant_id: policy.tenant_id,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    exception_id: exception.exception_id,
    condition: exception.condition,
    allowed_behavior: exception.allowed_behavior,
    authority_required: exception.authority_required,
    expiration_rule: exception.expiration_rule,
    source_policy_refs: [policy.policy_id],
    source_correlation_refs: [],
    source_truth_records: [exception.truth_reference],
    lineage_refs: [policy.lineage_refs.lineage_hash],
    replay_refs: [exception.replay_reference],
  }))));
}

export function buildOperationalNodes(correlations: readonly PolicyCorrelationRecord[]): readonly PolicyDependencyNode[] {
  return Object.freeze(correlations.map((correlation) => {
    const node_type: PolicyGraphNodeType = correlation.relationship_type === "POLICY_TO_RECOMMENDATION"
      ? "RECOMMENDATION"
      : correlation.relationship_type === "POLICY_TO_RUNTIME"
        ? "RUNTIME_CONTROL"
        : "GOVERNANCE_DECISION";
    const target = correlation.target_record_refs[0] ?? correlation.policy_correlation_id;
    return makeNode({
      node_id: `node_${node_type.toLowerCase()}_${target}`,
      node_type,
      tenant_id: correlation.tenant_id,
      policy_id: correlation.policy_id,
      policy_version: correlation.policy_version,
      recommendation_id: node_type === "RECOMMENDATION" ? target : undefined,
      governance_decision_id: node_type === "GOVERNANCE_DECISION" ? target : undefined,
      runtime_control_id: node_type === "RUNTIME_CONTROL" ? target : undefined,
      decision_state: correlation.relationship_type,
      control_type: correlation.runtime_context.summary,
      mission_id: correlation.mission_context.summary,
      source_policy_refs: [correlation.policy_id],
      source_correlation_refs: [correlation.policy_correlation_id],
      source_truth_records: correlation.source_record_refs,
      lineage_refs: correlation.lineage_refs,
      replay_refs: [correlation.replay_refs.replay_execution_ref, ...correlation.replay_refs.ledger_snapshot_refs],
    });
  }));
}

export function resolvePolicyGraphNodes(policies: readonly PolicyAnalysisRecord[], correlations: readonly PolicyCorrelationRecord[]): readonly PolicyDependencyNode[] {
  const nodes = [
    ...policies.map(buildPolicyNode),
    ...buildAuthorityNodes(policies),
    ...buildConstraintNodes(policies),
    ...buildExceptionNodes(policies),
    ...buildOperationalNodes(correlations),
  ];
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  return Object.freeze([...byId.values()].sort((a, b) => a.node_id.localeCompare(b.node_id)));
}

function edgeHash(source: Omit<PolicyDependencyEdge, "relationship_hash">): string {
  return hashValue("policy-dependency-edge", source);
}

function makeEdge(input: Omit<PolicyDependencyEdge, "relationship_hash">): PolicyDependencyEdge {
  return Object.freeze({
    ...input,
    evidence_refs: uniq(input.evidence_refs),
    truth_refs: uniq(input.truth_refs),
    correlation_refs: uniq(input.correlation_refs),
    lineage_refs: uniq(input.lineage_refs),
    replay_refs: uniq(input.replay_refs),
    relationship_hash: edgeHash(input),
  });
}

function policyNodeId(policy: PolicyAnalysisRecord): string {
  return `node_policy_${policy.policy_id}_${policy.policy_version}`;
}

function edgeBase(graph_id: string, policy: PolicyAnalysisRecord, relationship_type: PolicyGraphRelationshipType, target_node_id: string, suffix: string, state: PolicyGraphRelationshipState = "REPLAYABLE") {
  return {
    edge_id: `edge_${relationship_type.toLowerCase()}_${policy.policy_id}_${suffix}`,
    tenant_id: policy.tenant_id,
    graph_id,
    source_node_id: policyNodeId(policy),
    target_node_id,
    relationship_type,
    source_policy_id: policy.policy_id,
    target_policy_id: policy.policy_id,
    source_policy_version: policy.policy_version,
    target_policy_version: policy.policy_version,
    evidence_refs: policy.source_truth_records.flatMap((record) => record.evidence_refs),
    truth_refs: policy.source_truth_records.map((record) => record.truth_record_id),
    correlation_refs: [] as string[],
    lineage_refs: [policy.lineage_refs.lineage_hash],
    replay_refs: [policy.replay_refs.policy_snapshot_ref, policy.replay_refs.output_hash],
    relationship_state: state,
    created_timestamp: NOW,
  };
}

export function buildPolicyDependencyEdges(policies: readonly PolicyAnalysisRecord[], correlations: readonly PolicyCorrelationRecord[], graph_id = GRAPH_ID): readonly PolicyDependencyEdge[] {
  const edges: PolicyDependencyEdge[] = [];
  for (const policy of policies) {
    for (const dependency of policy.lineage_refs.dependency_refs) {
      edges.push(makeEdge({ ...edgeBase(graph_id, policy, "DEPENDS_ON", `node_authority_governance_control_layer`, dependency), target_policy_id: dependency, correlation_refs: [] }));
    }
    for (const inherited of policy.inheritance.inherits_from) {
      edges.push(makeEdge({ ...edgeBase(graph_id, policy, "INHERITS", `node_policy_${inherited}_${policy.policy_version}`, inherited), target_policy_id: inherited }));
    }
    for (const superseded of policy.supersession.supersedes) {
      edges.push(makeEdge({ ...edgeBase(graph_id, policy, "SUPERSEDES", `node_policy_${superseded}_${policy.policy_version}`, superseded), target_policy_id: superseded }));
    }
    for (const constraint of policy.constraints) {
      edges.push(makeEdge(edgeBase(graph_id, policy, "LIMITS", `node_constraint_${policy.policy_id}_${constraint.constraint_id}`, constraint.constraint_id)));
    }
    for (const exception of policy.exceptions) {
      edges.push(makeEdge(edgeBase(graph_id, policy, "ENABLES", `node_exception_${policy.policy_id}_${exception.exception_id}`, exception.exception_id)));
    }
    edges.push(makeEdge(edgeBase(graph_id, policy, "REFERENCES", `node_authority_${policy.authority_scope.governing_authority.replaceAll(" ", "_").toLowerCase()}`, "governing_authority")));
  }
  for (const correlation of correlations) {
    const policy = policies.find((item) => item.policy_id === correlation.policy_id) ?? policies[0];
    if (!policy) continue;
    const targetNode = correlation.relationship_type === "POLICY_TO_RECOMMENDATION"
      ? `node_recommendation_${correlation.target_record_refs[0]}`
      : correlation.relationship_type === "POLICY_TO_RUNTIME"
        ? `node_runtime_control_${correlation.target_record_refs[0]}`
        : `node_governance_decision_${correlation.target_record_refs[0]}`;
    const relationship: PolicyGraphRelationshipType = correlation.relationship_type === "POLICY_TO_RUNTIME" ? "DISABLES" : correlation.relationship_type === "POLICY_TO_AUTHORITY" ? "EXTENDS" : "SUPPORTED_BY";
    edges.push(makeEdge({
      ...edgeBase(graph_id, policy, relationship, targetNode, correlation.policy_correlation_id),
      evidence_refs: correlation.evidence_refs,
      truth_refs: correlation.source_record_refs,
      correlation_refs: [correlation.policy_correlation_id],
      lineage_refs: correlation.lineage_refs,
      replay_refs: [correlation.replay_refs.replay_execution_ref, correlation.replay_refs.output_correlation_hash],
    }));
  }
  return Object.freeze(edges.sort((a, b) => a.edge_id.localeCompare(b.edge_id)));
}

function conflictHash(source: Omit<PolicyConflictRecord, "conflict_hash">): string {
  return hashValue("policy-conflict-record", source);
}

function makeConflict(input: Omit<PolicyConflictRecord, "conflict_hash">): PolicyConflictRecord {
  return Object.freeze({
    ...input,
    affected_constraints: uniq(input.affected_constraints),
    affected_permissions: uniq(input.affected_permissions),
    affected_prohibitions: uniq(input.affected_prohibitions),
    affected_authorities: uniq(input.affected_authorities),
    evidence_refs: uniq(input.evidence_refs),
    truth_refs: uniq(input.truth_refs),
    correlation_refs: uniq(input.correlation_refs),
    lineage_refs: uniq(input.lineage_refs),
    replay_refs: uniq(input.replay_refs),
    conflict_hash: conflictHash(input),
  });
}

function conflictBase(type: PolicyConflictType, graph_id: string, source: PolicyAnalysisRecord, target: PolicyAnalysisRecord, description: string): Omit<PolicyConflictRecord, "conflict_hash"> {
  return {
    policy_conflict_id: `conflict_${type.toLowerCase()}_${source.policy_id}_${target.policy_id}`,
    tenant_id: source.tenant_id,
    graph_id,
    conflict_type: type,
    conflict_state: "DETECTED",
    source_node_id: policyNodeId(source),
    target_node_id: policyNodeId(target),
    source_policy_id: source.policy_id,
    target_policy_id: target.policy_id,
    source_policy_version: source.policy_version,
    target_policy_version: target.policy_version,
    conflict_description: description,
    conflict_scope: source.governance_scope.mission_scope,
    affected_constraints: source.constraints.map((constraint) => constraint.constraint_id),
    affected_permissions: source.permissions.map((permission) => permission.permission_id),
    affected_prohibitions: target.prohibitions.map((prohibition) => prohibition.prohibition_id),
    affected_authorities: [source.authority_scope.approval_authority, target.authority_scope.approval_authority],
    evidence_refs: [...source.source_truth_records.flatMap((record) => record.evidence_refs), ...target.source_truth_records.flatMap((record) => record.evidence_refs)],
    truth_refs: [...source.source_truth_records.map((record) => record.truth_record_id), ...target.source_truth_records.map((record) => record.truth_record_id)],
    correlation_refs: [],
    lineage_refs: [source.lineage_refs.lineage_hash, target.lineage_refs.lineage_hash],
    replay_refs: [source.replay_refs.policy_snapshot_ref, target.replay_refs.policy_snapshot_ref],
    detected_timestamp: NOW,
  };
}

export function detectPolicyGraphConflicts(policies: readonly PolicyAnalysisRecord[], edges: readonly PolicyDependencyEdge[], graph_id = GRAPH_ID): readonly PolicyConflictRecord[] {
  const conflicts: PolicyConflictRecord[] = [];
  for (const source of policies) {
    for (const target of policies) {
      if (source.policy_id === target.policy_id || source.tenant_id !== target.tenant_id) continue;
      const contradiction = source.permissions.some((permission) => target.prohibitions.some((prohibition) => permission.behavior === prohibition.behavior && (permission.scope === prohibition.scope || prohibition.scope === "all")));
      if (contradiction) conflicts.push(makeConflict(conflictBase("CONTRADICTORY_PERMISSION", graph_id, source, target, "A permission conflicts with an active prohibition.")));
      const authorityOverlap = source.authority_scope.approval_authority !== target.authority_scope.approval_authority && source.governance_scope.decision_scope === target.governance_scope.decision_scope;
      if (authorityOverlap) conflicts.push(makeConflict(conflictBase("OVERLAPPING_AUTHORITY", graph_id, source, target, "Approval authorities overlap without an explicit precedence rule.")));
    }
  }
  const cycleEdge = edges.find((edge) => edge.relationship_type === "INHERITS" && edge.target_policy_id === edge.source_policy_id);
  if (cycleEdge) {
    const source = policies.find((policy) => policy.policy_id === cycleEdge.source_policy_id) ?? policies[0];
    if (source) conflicts.push(makeConflict(conflictBase("CIRCULAR_INHERITANCE", graph_id, source, source, "Inheritance graph contains a closed loop.")));
  }
  return Object.freeze(conflicts.sort((a, b) => a.policy_conflict_id.localeCompare(b.policy_conflict_id)));
}

function graphScope(policy: PolicyAnalysisRecord): PolicyGraphScope {
  return Object.freeze({
    tenant_scope: policy.tenant_id,
    mission_scope: policy.governance_scope.mission_scope,
    policy_scope: "governance_and_runtime_policies",
    governance_scope: "Mission Control Governance Intelligence",
    runtime_scope: policy.governance_scope.runtime_scope,
    historical_window: "2026-01-01T00:00:00.000Z to 2026-06-25T06:00:00.000Z",
    visibility_scope: policy.governance_scope.visibility_scope,
  });
}

function replayRefs(policies: readonly PolicyAnalysisRecord[], correlations: readonly PolicyCorrelationRecord[], nodes: readonly PolicyDependencyNode[], edges: readonly PolicyDependencyEdge[], conflicts: readonly PolicyConflictRecord[]): PolicyGraphReplayRefs {
  const node_set_hash = hashValue("policy-graph-node-set", nodes.map((node) => node.node_hash));
  const edge_set_hash = hashValue("policy-graph-edge-set", edges.map((edge) => edge.relationship_hash));
  const conflict_set_hash = hashValue("policy-graph-conflict-set", conflicts.map((conflict) => conflict.conflict_hash));
  return Object.freeze({
    policy_analysis_snapshot_refs: uniq(policies.map((policy) => policy.replay_refs.policy_snapshot_ref)),
    policy_correlation_snapshot_refs: uniq(correlations.map((correlation) => correlation.replay_refs.replay_execution_ref)),
    truth_ledger_snapshot_refs: uniq(policies.flatMap((policy) => policy.source_truth_records.map((record) => record.truth_record_id))),
    graph_algorithm_version: ALGORITHM_VERSION,
    node_set_hash,
    edge_set_hash,
    conflict_set_hash,
    graph_output_hash: hashValue("policy-graph-output", { node_set_hash, edge_set_hash, conflict_set_hash }),
    replay_execution_ref: `replay_${GRAPH_ID}`,
  });
}

export function canonicalizePolicyDependencyGraph(graph: Omit<PolicyDependencyGraph, "graph_hash">): string {
  return canonicalizeConfidenceToString(graph);
}

export function computePolicyDependencyGraphHash(graph: Omit<PolicyDependencyGraph, "graph_hash"> | PolicyDependencyGraph): string {
  const { graph_hash: _previousHash, ...source } = graph as PolicyDependencyGraph;
  return hashConfidenceValue("policy-dependency-graph", canonicalizePolicyDependencyGraph(source));
}

export function buildPolicyDependencyGraph(policies: readonly PolicyAnalysisRecord[] = buildDefaultPolicyGraphInputs().policy_analyses, correlations: readonly PolicyCorrelationRecord[] = buildDefaultPolicyGraphInputs().policy_correlations, state: PolicyGraphState = "REPLAYABLE"): PolicyDependencyGraph {
  const tenant = policies[0]?.tenant_id ?? "tenant_alpha";
  const nodes = resolvePolicyGraphNodes(policies, correlations);
  const edges = buildPolicyDependencyEdges(policies, correlations);
  const conflicts = detectPolicyGraphConflicts(policies, edges);
  const refs = replayRefs(policies, correlations, nodes, edges, conflicts);
  const withoutHash: Omit<PolicyDependencyGraph, "graph_hash"> = {
    schema_version: "policy-dependency-graph/v7B.3",
    policy_graph_id: GRAPH_ID,
    tenant_id: tenant,
    graph_version: "v7B.3.0",
    graph_scope: graphScope(policies[0] ?? buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" })),
    node_set: nodes,
    edge_set: edges,
    policy_nodes: nodes.filter((node) => node.node_type === "POLICY"),
    authority_nodes: nodes.filter((node) => node.node_type === "AUTHORITY"),
    constraint_nodes: nodes.filter((node) => node.node_type === "CONSTRAINT"),
    exception_nodes: nodes.filter((node) => node.node_type === "EXCEPTION"),
    recommendation_nodes: nodes.filter((node) => node.node_type === "RECOMMENDATION"),
    governance_decision_nodes: nodes.filter((node) => node.node_type === "GOVERNANCE_DECISION"),
    runtime_control_nodes: nodes.filter((node) => node.node_type === "RUNTIME_CONTROL"),
    conflict_records: conflicts,
    dependency_records: edges.filter((edge) => edge.relationship_type === "DEPENDS_ON"),
    inheritance_records: edges.filter((edge) => edge.relationship_type === "INHERITS"),
    supersession_records: edges.filter((edge) => edge.relationship_type === "SUPERSEDES"),
    exception_records: nodes.filter((node) => node.node_type === "EXCEPTION"),
    shared_authority_records: nodes.filter((node) => node.node_type === "AUTHORITY" && node.source_policy_refs.length > 1),
    source_policy_analysis_refs: uniq(policies.map((policy) => policy.policy_analysis_id)),
    source_policy_correlation_refs: uniq(correlations.map((correlation) => correlation.policy_correlation_id)),
    source_truth_records: uniq(policies.flatMap((policy) => policy.source_truth_records.map((record) => record.truth_record_id))),
    lineage_refs: uniq([...policies.map((policy) => policy.lineage_refs.lineage_hash), ...correlations.flatMap((correlation) => correlation.lineage_refs)]),
    replay_refs: refs,
    graph_state: state,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...withoutHash, graph_hash: computePolicyDependencyGraphHash(withoutHash) });
}

export function validatePolicyDependencyGraph(graph: Partial<PolicyDependencyGraph> | undefined, context: { original_graph?: PolicyDependencyGraph } = {}): PolicyDependencyGraphValidationResult {
  const failures: PolicyDependencyGraphValidationFailure[] = [];
  if (!graph) failures.push(validationFailure("POLICY_NODE_MISSING", "graph", "PolicyDependencyGraph is missing"));
  if (!graph?.policy_nodes || graph.policy_nodes.length === 0) failures.push(validationFailure("POLICY_NODE_MISSING", "policy_nodes", "policy nodes missing"));
  if (!graph?.authority_nodes || graph.authority_nodes.length === 0) failures.push(validationFailure("AUTHORITY_NODE_MISSING", "authority_nodes", "authority nodes missing"));
  if (!graph?.constraint_nodes || graph.constraint_nodes.length === 0) failures.push(validationFailure("CONSTRAINT_NODE_MISSING", "constraint_nodes", "constraint nodes missing"));
  if (graph?.exception_nodes?.some((node) => !node.authority_required || !node.source_truth_records.length || !node.replay_refs.length)) failures.push(validationFailure("EXCEPTION_NODE_INVALID", "exception_nodes", "exception node is undocumented or unreplayable"));
  if (!graph?.recommendation_nodes || graph.recommendation_nodes.length === 0) failures.push(validationFailure("RECOMMENDATION_NODE_MISSING", "recommendation_nodes", "recommendation nodes missing"));
  if (!graph?.governance_decision_nodes || graph.governance_decision_nodes.length === 0) failures.push(validationFailure("GOVERNANCE_DECISION_NODE_MISSING", "governance_decision_nodes", "governance decision nodes missing"));
  if (!graph?.runtime_control_nodes || graph.runtime_control_nodes.length === 0) failures.push(validationFailure("RUNTIME_CONTROL_NODE_MISSING", "runtime_control_nodes", "runtime control nodes missing"));
  for (const node of graph?.node_set ?? []) {
    if (!(POLICY_GRAPH_NODE_TYPES as readonly string[]).includes(node.node_type)) failures.push(validationFailure("UNKNOWN_NODE_TYPE", "node_set", "unknown node type"));
    if (node.tenant_id !== graph?.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "node_set.tenant_id", "node tenant mismatch"));
  }
  for (const edge of graph?.edge_set ?? []) {
    if (!(POLICY_GRAPH_RELATIONSHIP_TYPES as readonly string[]).includes(edge.relationship_type)) failures.push(validationFailure("UNSUPPORTED_RELATIONSHIP", "edge_set.relationship_type", "unsupported relationship"));
    if (!edge.evidence_refs.length || !edge.truth_refs.length) failures.push(validationFailure("EDGE_EVIDENCE_MISSING", "edge_set.evidence_refs", "edge evidence missing"));
    if (!edge.replay_refs.length) failures.push(validationFailure("EDGE_REPLAY_REFS_MISSING", "edge_set.replay_refs", "edge replay refs missing"));
    if (edge.tenant_id !== graph?.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "edge_set.tenant_id", "edge tenant mismatch"));
    if (edge.relationship_type === "INHERITS" && edge.source_policy_id === edge.target_policy_id) failures.push(validationFailure("CIRCULAR_INHERITANCE", "edge_set", "circular inheritance detected"));
    if (edge.relationship_type === "DEPENDS_ON" && edge.source_policy_id === edge.target_policy_id) failures.push(validationFailure("RECURSIVE_DEPENDENCY_CHAIN", "edge_set", "recursive dependency chain detected"));
  }
  if (graph?.conflict_records?.some((conflict) => !conflict.evidence_refs.length || !conflict.replay_refs.length)) failures.push(validationFailure("CONFLICT_UNSUPPORTED", "conflict_records", "conflict is not evidence-linked and replayable"));
  if (!graph?.replay_refs || !graph.replay_refs.node_set_hash || !graph.replay_refs.edge_set_hash || !graph.replay_refs.conflict_set_hash || !graph.replay_refs.graph_output_hash) failures.push(validationFailure("REPLAY_REFS_MISSING", "replay_refs", "graph replay refs missing"));
  if (!graph?.graph_state || !(POLICY_GRAPH_STATES as readonly string[]).includes(graph.graph_state)) failures.push(validationFailure("INVALID_GRAPH_STATE", "graph_state", "invalid graph state"));
  if (context.original_graph && context.original_graph.graph_hash !== graph?.graph_hash && context.original_graph.policy_graph_id === graph?.policy_graph_id) failures.push(validationFailure("HISTORICAL_MUTATION", "graph_hash", "historical graph snapshot mutation detected"));
  if (graph?.graph_hash && computePolicyDependencyGraphHash(graph as PolicyDependencyGraph) !== graph.graph_hash) failures.push(validationFailure("GRAPH_HASH_MISMATCH", "graph_hash", "graph hash mismatch"));
  return Object.freeze({
    validation_id: hashValue("policy-dependency-graph-validation", { id: graph?.policy_graph_id, failures: failures.map((failure) => failure.failure_id) }),
    policy_graph_id: graph?.policy_graph_id,
    validation_state: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    graph_hash: failures.length ? undefined : graph?.graph_hash,
    deterministic: true,
    replayable: Boolean(graph?.replay_refs) && failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "GRAPH_HASH_MISMATCH"),
    tenant_scoped: failures.every((failure) => failure.reason !== "TENANT_MISMATCH"),
    advisory_only: true,
  });
}

export function validatePolicyGraphInputs(policies: readonly PolicyAnalysisRecord[], correlations: readonly PolicyCorrelationRecord[]): PolicyDependencyGraphValidationFailure[] {
  const failures: PolicyDependencyGraphValidationFailure[] = [];
  for (const policy of policies) {
    if (validatePolicyAnalysisRecord(policy).validation_state === "FAIL") failures.push(validationFailure("POLICY_ANALYSIS_INVALID", "policy_analyses", "invalid PolicyAnalysis input"));
    if (!(ALLOWED_POLICY_ANALYSIS_STATES as readonly string[]).includes(policy.analysis_state)) failures.push(validationFailure("POLICY_ANALYSIS_STATE_BLOCKED", "policy_analyses.analysis_state", "PolicyAnalysis state blocked"));
  }
  for (const correlation of correlations) {
    if (validatePolicyCorrelationRecord(correlation, { policy_analysis: policies.find((policy) => policy.policy_id === correlation.policy_id) }).validation_state === "FAIL") failures.push(validationFailure("POLICY_CORRELATION_INVALID", "policy_correlations", "invalid PolicyCorrelation input"));
    if (!(ALLOWED_CORRELATION_STATES as readonly string[]).includes(correlation.correlation_state)) failures.push(validationFailure("POLICY_CORRELATION_STATE_BLOCKED", "policy_correlations.correlation_state", "PolicyCorrelation state blocked"));
  }
  if (!policies.length) failures.push(validationFailure("POLICY_ANALYSIS_MISSING", "policy_analyses", "PolicyAnalysis records missing"));
  if (!correlations.length) failures.push(validationFailure("POLICY_CORRELATION_MISSING", "policy_correlations", "PolicyCorrelation records missing"));
  return failures;
}

export function buildPolicyGraphSnapshot(graph: PolicyDependencyGraph): PolicyGraphSnapshot {
  return Object.freeze({
    snapshot_id: `snapshot_${graph.policy_graph_id}_${graph.graph_version}`,
    graph_id: graph.policy_graph_id,
    graph_version: graph.graph_version,
    historical_window: graph.graph_scope.historical_window,
    source_policy_analysis_refs: graph.source_policy_analysis_refs,
    source_policy_correlation_refs: graph.source_policy_correlation_refs,
    graph_hash: graph.graph_hash,
    immutable: true,
    created_timestamp: graph.created_timestamp,
  });
}

export function transitionPolicyDependencyGraphState(graph: PolicyDependencyGraph, to_state: PolicyGraphState): PolicyDependencyGraphValidationResult {
  const allowed = ALLOWED_GRAPH_TRANSITIONS[graph.graph_state]?.includes(to_state);
  if (!allowed) {
    return Object.freeze({
      validation_id: hashValue("policy-graph-transition", { graph: graph.policy_graph_id, from: graph.graph_state, to_state }),
      policy_graph_id: graph.policy_graph_id,
      validation_state: "FAIL",
      failures: Object.freeze([validationFailure("INVALID_STATE_TRANSITION", "graph_state", `${graph.graph_state} to ${to_state} blocked`)]),
      deterministic: true,
      replayable: false,
      tenant_scoped: true,
      advisory_only: true,
    });
  }
  const { graph_hash: _previousHash, ...source } = graph;
  return validatePolicyDependencyGraph({ ...source, graph_state: to_state, graph_hash: computePolicyDependencyGraphHash({ ...source, graph_state: to_state }) });
}

export function replayPolicyDependencyGraph(graph: PolicyDependencyGraph): PolicyGraphReplayResult {
  const reconstructed = computePolicyDependencyGraphHash(graph);
  const validation = validatePolicyDependencyGraph(graph);
  const mismatch = reconstructed !== graph.graph_hash || graph.replay_refs.graph_output_hash === "mismatch";
  return Object.freeze({
    replay_id: hashValue("policy-graph-replay", { graph: graph.policy_graph_id, reconstructed }),
    policy_graph_id: graph.policy_graph_id,
    validation_state: validation.validation_state === "PASS" && !mismatch ? "PASS" : "FAIL",
    failure_reason: mismatch ? "GRAPH_HASH_MISMATCH" : validation.failures[0]?.reason ?? null,
    reconstructed_hash: reconstructed,
    expected_hash: graph.graph_hash,
    final_state: graph.graph_state,
  });
}

export function runPolicyDependencyGraphEngine(policies: readonly PolicyAnalysisRecord[] = buildDefaultPolicyGraphInputs().policy_analyses, correlations: readonly PolicyCorrelationRecord[] = buildDefaultPolicyGraphInputs().policy_correlations): PolicyGraphEngineResult {
  const inputFailures = validatePolicyGraphInputs(policies, correlations);
  const graph = buildPolicyDependencyGraph(policies, correlations);
  const graphValidation = validatePolicyDependencyGraph(graph);
  const failures = Object.freeze([...inputFailures, ...graphValidation.failures]);
  const validation: PolicyDependencyGraphValidationResult = Object.freeze({
    validation_id: hashValue("policy-graph-engine-validation", { graph: graph.policy_graph_id, failures: failures.map((failure) => failure.failure_id) }),
    policy_graph_id: graph.policy_graph_id,
    validation_state: failures.length ? "FAIL" : "PASS",
    failures,
    graph_hash: failures.length ? undefined : graph.graph_hash,
    deterministic: true,
    replayable: failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "GRAPH_HASH_MISMATCH"),
    tenant_scoped: failures.every((failure) => failure.reason !== "TENANT_MISMATCH"),
    advisory_only: true,
  });
  return Object.freeze({
    engine_id: hashValue("policy-dependency-graph-engine", { policies: policies.map((policy) => policy.analysis_hash), correlations: correlations.map((correlation) => correlation.correlation_hash) }),
    policy_analyses: Object.freeze([...policies]),
    policy_correlations: Object.freeze([...correlations]),
    graph,
    snapshot: buildPolicyGraphSnapshot(graph),
    validation,
  });
}

export function buildPolicyGraphExplanation(graph: PolicyDependencyGraph): readonly PolicyGraphExplanation[] {
  const relationship = graph.edge_set[0];
  const conflict = graph.conflict_records[0];
  return Object.freeze([
    Object.freeze({
      explanation_id: hashValue("policy-graph-explanation", { graph: graph.policy_graph_id, type: "relationship" }),
      headline: "Policy relationships are evidence-linked and replayable.",
      steps: freezeArray([
        `${graph.policy_nodes.length} policy nodes were resolved for ${graph.tenant_id}.`,
        `${graph.edge_set.length} relationship edges were generated deterministically.`,
        relationship ? `${relationship.relationship_type} is supported by ${relationship.truth_refs.join(", ")}.` : "No relationship edges were generated.",
        `Replay ${graph.replay_refs.replay_execution_ref} reconstructs the same graph.`,
      ]),
      evidence_refs: uniq(graph.edge_set.flatMap((edge) => edge.evidence_refs)),
      replay_status: "REPLAYABLE" as const,
    }),
    Object.freeze({
      explanation_id: hashValue("policy-graph-explanation", { graph: graph.policy_graph_id, type: "conflict" }),
      headline: conflict ? `${conflict.conflict_type} surfaced for operator review.` : "No policy conflicts were detected.",
      steps: freezeArray(conflict ? [
        `${conflict.source_policy_id} and ${conflict.target_policy_id} apply to ${conflict.conflict_scope}.`,
        conflict.conflict_description,
        `Evidence ${conflict.evidence_refs.join(", ")} supports the conflict.`,
        "The graph does not resolve the conflict autonomously.",
      ] : ["Conflict detection completed deterministically."]),
      evidence_refs: conflict?.evidence_refs ?? [],
      replay_status: "REPLAYABLE" as const,
    }),
  ]);
}

export function buildPolicyGraphObservabilitySurface(policies?: readonly PolicyAnalysisRecord[], correlations?: readonly PolicyCorrelationRecord[]): PolicyGraphObservabilitySurface {
  const inputs = policies && correlations ? { policy_analyses: policies, policy_correlations: correlations } : buildDefaultPolicyGraphInputs();
  const result = runPolicyDependencyGraphEngine(inputs.policy_analyses, inputs.policy_correlations);
  const graph = result.graph;
  return Object.freeze({
    graph_version: graph.graph_version,
    graph_scope: graph.graph_scope,
    policy_nodes: graph.policy_nodes,
    authority_nodes: graph.authority_nodes,
    constraint_nodes: graph.constraint_nodes,
    exception_nodes: graph.exception_nodes,
    recommendation_nodes: graph.recommendation_nodes,
    governance_decision_nodes: graph.governance_decision_nodes,
    runtime_control_nodes: graph.runtime_control_nodes,
    relationship_edges: graph.edge_set,
    conflict_records: graph.conflict_records,
    dependency_paths: Object.freeze(graph.dependency_records.map((edge) => [edge.source_node_id, edge.target_node_id])),
    inheritance_paths: Object.freeze(graph.inheritance_records.map((edge) => [edge.source_node_id, edge.target_node_id])),
    supersession_paths: Object.freeze(graph.supersession_records.map((edge) => [edge.source_node_id, edge.target_node_id])),
    unreachable_policies: Object.freeze(result.validation.failures.filter((failure) => failure.reason === "UNREACHABLE_POLICY").map((failure) => failure.field_path)),
    explanations: buildPolicyGraphExplanation(graph),
    replay_status: result.validation.replayable ? "REPLAYABLE" : "NOT_REPLAYABLE",
    graph_state: graph.graph_state,
    validation_failures: result.validation.failures,
  });
}
