import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { correlateGovernanceLedgers } from "@/services/governance-cross-ledger-correlation";
import type { GovernanceCorrelation, GovernanceRelationshipGraphEdge, GovernanceRelationshipGraphNode } from "@/types/governance-cross-ledger-correlation";
import type { GovernanceSearchDomain } from "@/types/governance-search-engine";
import type {
  GovernanceLineageEdge,
  GovernanceLineageExplorerAction,
  GovernanceLineageExplorerInput,
  GovernanceLineageExplorerObservabilitySurface,
  GovernanceLineageExplorerState,
  GovernanceLineageExplorerView,
  GovernanceLineageNode,
  GovernanceLineagePath,
  GovernanceLineageTimelineEvent,
} from "@/types/governance-lineage-explorer";

const NOW = "2026-06-27T16:00:00.000Z";
const SCHEMA_VERSION = "governance-lineage-explorer/v7K.3" as const;
const VIEW_VERSION = "governance-lineage-view/v7K.3" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function integrityState(state: GovernanceLineageExplorerState): GovernanceLineageNode["integrity_state"] {
  if (state === "COMPLETE") return "VERIFIED";
  return state;
}

function eventTypeForDomain(domain: GovernanceSearchDomain): GovernanceLineageTimelineEvent["event_type"] {
  if (domain === "POLICY") return "POLICY_CHANGE";
  if (domain === "EVIDENCE") return "EVIDENCE_COLLECTION";
  if (domain === "RISK") return "RISK_DEVELOPMENT";
  if (domain === "COMPLIANCE") return "COMPLIANCE_EVALUATION";
  if (domain === "RECOMMENDATION") return "RECOMMENDATION_GENERATION";
  if (domain === "ESCALATION") return "ESCALATION_PROGRESSION";
  return "CERTIFICATION_MILESTONE";
}

function correlationForEdge(edge: GovernanceRelationshipGraphEdge, correlations: readonly GovernanceCorrelation[]): GovernanceCorrelation | undefined {
  return correlations.find((correlation) => correlation.correlation_id === edge.correlation_id);
}

function depthFor(node: GovernanceRelationshipGraphNode, edges: readonly GovernanceRelationshipGraphEdge[]): number {
  const parents = new Map<string, readonly string[]>();
  edges.forEach((edge) => {
    parents.set(edge.target_node_id, [...(parents.get(edge.target_node_id) ?? []), edge.source_node_id]);
  });

  const visit = (nodeId: string, seen: ReadonlySet<string>): number => {
    if (seen.has(nodeId)) return 0;
    const direct = parents.get(nodeId) ?? [];
    if (direct.length === 0) return 0;
    const nextSeen = new Set(seen);
    nextSeen.add(nodeId);
    return 1 + Math.max(...direct.map((parent) => visit(parent, nextSeen)));
  };

  return visit(node.node_id, new Set());
}

function lineageNode(node: GovernanceRelationshipGraphNode, edges: readonly GovernanceRelationshipGraphEdge[], correlations: readonly GovernanceCorrelation[], state: GovernanceLineageExplorerState): GovernanceLineageNode {
  const related = correlations.filter((correlation) => correlation.source_object === node.object_ref || correlation.target_object === node.object_ref);
  const source = {
    node_id: node.node_id,
    object_ref: node.object_ref,
    node_type: node.domain,
    label: node.label,
    lineage_depth: depthFor(node, edges),
    integrity_state: integrityState(state),
    evidence_refs: unique(related.flatMap((correlation) => correlation.supporting_evidence)),
    lineage_refs: unique(related.map((correlation) => correlation.lineage_reference)),
    replay_refs: unique(related.map((correlation) => correlation.replay_reference)),
  };
  return Object.freeze({ ...source, node_hash: hashValue("governance-lineage-explorer-node", source) });
}

function lineageEdge(edge: GovernanceRelationshipGraphEdge, correlations: readonly GovernanceCorrelation[]): GovernanceLineageEdge {
  const correlation = correlationForEdge(edge, correlations);
  const source = {
    edge_id: edge.edge_id,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    relationship_type: edge.relationship_type,
    evidence_refs: freezeArray(correlation?.supporting_evidence ?? []),
    lineage_ref: correlation?.lineage_reference ?? "",
    replay_ref: correlation?.replay_reference ?? "",
  };
  return Object.freeze({ ...source, edge_hash: hashValue("governance-lineage-explorer-edge", source) });
}

function path(path_type: GovernanceLineagePath["path_type"], nodes: readonly string[], edges: readonly string[], complete: boolean, explanation: string): GovernanceLineagePath {
  const source = {
    path_id: `GLP-7K3-${hashValue("governance-lineage-path-id", { path_type, nodes, edges }).slice(0, 10).toUpperCase()}`,
    path_type,
    nodes: freezeArray(nodes),
    edges: freezeArray(edges),
    complete,
    explanation,
  };
  return Object.freeze({ ...source, path_hash: hashValue("governance-lineage-path", source) });
}

function adjacentPath(selected: string, edges: readonly GovernanceLineageEdge[], direction: "parents" | "children"): GovernanceLineagePath[] {
  const matches = edges.filter((edge) => direction === "parents" ? edge.target_node_id === selected : edge.source_node_id === selected);
  return matches.map((edge) => {
    const other = direction === "parents" ? edge.source_node_id : edge.target_node_id;
    return path(direction === "parents" ? "BACKWARD" : "FORWARD", direction === "parents" ? [other, selected] : [selected, other], [edge.edge_id], true, `${direction === "parents" ? "Immediate parent" : "Immediate child"} lineage via ${edge.relationship_type}.`);
  });
}

function rootPaths(selected: string, edges: readonly GovernanceLineageEdge[]): readonly GovernanceLineagePath[] {
  const incoming = edges.filter((edge) => edge.target_node_id === selected);
  if (incoming.length === 0) return freezeArray([path("ROOT", [selected], [], true, "Selected governance artifact is a lineage root.")]);
  return freezeArray(incoming.map((edge) => path("ROOT", [edge.source_node_id, selected], [edge.edge_id], true, `Root lineage traces through ${edge.relationship_type}.`)));
}

function dependencyPaths(selected: string, edges: readonly GovernanceLineageEdge[]): readonly GovernanceLineagePath[] {
  const dependencyEdges = edges.filter((edge) => edge.relationship_type === "DEPENDS_ON" || edge.relationship_type === "SUPPORTS" || edge.relationship_type === "VALIDATES" || edge.source_node_id === selected || edge.target_node_id === selected);
  return freezeArray(dependencyEdges.map((edge) => path("DEPENDENCY", [edge.source_node_id, edge.target_node_id], [edge.edge_id], true, `Dependency relationship rendered as ${edge.relationship_type}.`)));
}

function influencePaths(edges: readonly GovernanceLineageEdge[]): readonly GovernanceLineagePath[] {
  return freezeArray(edges
    .filter((edge) => ["INFLUENCES", "SUPPORTS", "ESCALATES", "VALIDATES", "RECONSTRUCTED_BY"].includes(edge.relationship_type))
    .map((edge) => path("INFLUENCE", [edge.source_node_id, edge.target_node_id], [edge.edge_id], true, `Influence chain preserves ${edge.relationship_type} causality.`)));
}

function supersessionPaths(edges: readonly GovernanceLineageEdge[]): readonly GovernanceLineagePath[] {
  const superseded = edges.filter((edge) => edge.relationship_type === "SUPERSEDES" || edge.relationship_type === "PARENT_OF" || edge.relationship_type === "CHILD_OF");
  return freezeArray(superseded.map((edge) => path("SUPERSESSION", [edge.source_node_id, edge.target_node_id], [edge.edge_id], true, `Historical relationship preserved via ${edge.relationship_type}.`)));
}

function timeline(nodes: readonly GovernanceLineageNode[]): readonly GovernanceLineageTimelineEvent[] {
  return freezeArray(nodes.map((node, index) => {
    const source = {
      event_id: `GLE-7K3-${String(index + 1).padStart(2, "0")}`,
      timestamp: `2026-06-27T16:${String(index).padStart(2, "0")}:00.000Z`,
      node_id: node.node_id,
      event_type: eventTypeForDomain(node.node_type),
      summary: `${node.label} lineage rendered from certified ${node.node_type.toLowerCase()} ledger state.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-lineage-timeline-event", source) });
  }));
}

function detectCycles(edges: readonly GovernanceLineageEdge[]): readonly string[] {
  return freezeArray(edges
    .filter((edge) => edges.some((candidate) => candidate.source_node_id === edge.target_node_id && candidate.target_node_id === edge.source_node_id))
    .map((edge) => `${edge.source_node_id}:${edge.target_node_id}`)
    .sort());
}

export function buildGovernanceLineageExplorerView(input: GovernanceLineageExplorerInput = {}): GovernanceLineageExplorerView {
  const state = input.state ?? "COMPLETE";
  const correlation = correlateGovernanceLedgers();
  const graph = correlation.relationship_graph;
  const tenant_id = input.tenant_id ?? correlation.tenant_id;
  const mission_id = input.mission_id ?? correlation.mission_id;
  const operator_id = input.operator_id ?? "operator_console";
  const graphNodes = freezeArray(graph?.nodes ?? []);
  const graphEdges = freezeArray(graph?.edges ?? []);
  const nodes = freezeArray(graphNodes.map((node) => lineageNode(node, graphEdges, correlation.correlations, state)));
  const edges = freezeArray(graphEdges.map((edge) => lineageEdge(edge, correlation.correlations)));
  const selected_node_id = input.selected_node_id && nodes.some((node) => node.node_id === input.selected_node_id)
    ? input.selected_node_id
    : nodes.find((node) => node.node_type === "LINEAGE")?.node_id ?? nodes[0]?.node_id ?? "lineage:none";
  const evidence_refs = unique(nodes.flatMap((node) => node.evidence_refs));
  const replay_refs = unique(nodes.flatMap((node) => node.replay_refs));
  const missing_dependencies = state === "PARTIAL" || state === "BROKEN" ? freezeArray(["dependency:7k3:uncertified-lineage-reference"]) : freezeArray([]);
  const circular_dependencies = detectCycles(edges);
  const parent_chain = freezeArray(adjacentPath(selected_node_id, edges, "parents"));
  const child_chain = freezeArray(adjacentPath(selected_node_id, edges, "children"));
  const root_lineage = rootPaths(selected_node_id, edges);
  const dependency_chains = dependencyPaths(selected_node_id, edges);
  const influence_paths = influencePaths(edges);
  const supersession_history = supersessionPaths(edges);
  const source = {
    explorer_id: `GLE-7K3-${hashValue("governance-lineage-explorer-id", { tenant_id, mission_id, selected_node_id, state }).slice(0, 10).toUpperCase()}`,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    operator_id,
    selected_node_id,
    explorer_state: state,
    explorer_version: VIEW_VERSION,
    generated_at: NOW,
    read_only: true as const,
    advisory_only: true as const,
    relationship_creation_allowed: false as const,
    mutation_allowed: false as const,
    tenant_isolated: true,
    authorization_enforced: true,
    graph_hash: graph?.graph_hash ?? null,
    replay_consistent: correlation.replay_correlation?.replay_consistent ?? false,
    lineage_verified: state === "COMPLETE" && correlation.validation.lineage_verified,
    nodes,
    edges,
    parent_chain,
    child_chain,
    root_lineage,
    dependency_chains,
    influence_paths,
    supersession_history,
    timeline: timeline(nodes),
    evidence_refs,
    replay_refs,
    missing_dependencies,
    circular_dependencies,
  };
  return Object.freeze({ ...source, explorer_hash: hashValue("governance-lineage-explorer-view", source) });
}

export function buildGovernanceLineageExplorerObservabilitySurface(input: GovernanceLineageExplorerInput = {}): GovernanceLineageExplorerObservabilitySurface {
  const view = buildGovernanceLineageExplorerView(input);
  return Object.freeze({
    explorer_id: view.explorer_id,
    explorer_state: view.explorer_state,
    node_count: view.nodes.length,
    edge_count: view.edges.length,
    lineage_verified: view.lineage_verified,
    replay_consistent: view.replay_consistent,
    read_only: true,
    explorer_hash: view.explorer_hash,
  });
}

export function assertGovernanceLineageExplorerActionBlocked(action: GovernanceLineageExplorerAction): never {
  throw new Error(`Governance Lineage Explorer is read-only; ${action} is not permitted.`);
}

export function getGovernanceLineageExplorerContract() {
  const view = buildGovernanceLineageExplorerView();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "advisory-only", "deterministic", "explainable", "replay-aware", "immutable", "evidence-driven", "audit-ready", "tenant-isolated", "constitution-protected"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["COMPLETE", "PARTIAL", "BROKEN", "RESTRICTED"] as const),
      node_types: freezeArray(["POLICY", "EVIDENCE", "RISK", "COMPLIANCE", "RECOMMENDATION", "ESCALATION", "REPLAY", "INTEGRITY", "CERTIFICATION", "LINEAGE", "TRUTH_LEDGER"] as const),
      relationship_types: freezeArray(["INFLUENCES", "SUPPORTS", "MITIGATES", "ESCALATES", "VALIDATES", "DEPENDS_ON", "SUPERSEDES", "PARENT_OF", "CHILD_OF", "RECONSTRUCTED_BY"] as const),
      prohibited_actions: freezeArray(["MODIFY_LINEAGE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP", "ALTER_HISTORY", "OVERRIDE_GOVERNANCE", "REASSIGN_PARENT"] as const),
    }),
    view,
    observability: buildGovernanceLineageExplorerObservabilitySurface(),
  });
}
