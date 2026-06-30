import { describe, expect, it } from "vitest";
import { buildPolicyAnalysisRecord } from "@/services/policy-analysis";
import { generatePolicyCorrelations } from "@/services/policy-correlation";
import {
  buildDefaultPolicyGraphInputs,
  buildPolicyDependencyEdges,
  buildPolicyDependencyGraph,
  buildPolicyDependencyGraphDoctrine,
  buildPolicyGraphObservabilitySurface,
  buildPolicyGraphSnapshot,
  buildPolicyNode,
  computePolicyDependencyGraphHash,
  detectPolicyGraphConflicts,
  replayPolicyDependencyGraph,
  resolvePolicyGraphNodes,
  runPolicyDependencyGraphEngine,
  transitionPolicyDependencyGraphState,
  validatePolicyDependencyGraph,
  validatePolicyGraphInputs,
} from "@/services/policy-dependency-graph";
import type { PolicyDependencyGraph, PolicyDependencyNode } from "@/types/policy-dependency-graph";

function inputs() {
  return buildDefaultPolicyGraphInputs();
}

function graph(overrides: Partial<PolicyDependencyGraph> = {}) {
  const source = inputs();
  return { ...buildPolicyDependencyGraph(source.policy_analyses, source.policy_correlations), ...overrides };
}

describe("Mission Control Phase 7B.3 Policy Dependency Graph", () => {
  it("defines advisory-only graph doctrine", () => {
    const doctrine = buildPolicyDependencyGraphDoctrine();
    expect(doctrine.principles).toContain("advisory-only-graph");
    expect(doctrine.principles).toContain("immutable-historical-snapshot");
    expect(doctrine.prohibited_behaviors).toContain("silent conflict resolution");
    expect(doctrine.supported_relationship_types).toContain("CONFLICTS_WITH");
  });

  it("accepts valid PolicyAnalysis and PolicyCorrelation inputs", () => {
    const source = inputs();
    expect(validatePolicyGraphInputs(source.policy_analyses, source.policy_correlations)).toEqual([]);
  });

  it("rejects invalid or blocked input states", () => {
    const source = inputs();
    expect(validatePolicyGraphInputs([buildPolicyAnalysisRecord({ analysis_state: "CREATED" })], source.policy_correlations).some((failure) => failure.reason === "POLICY_ANALYSIS_STATE_BLOCKED")).toBe(true);
    expect(validatePolicyGraphInputs(source.policy_analyses, [{ ...source.policy_correlations[0]!, correlation_state: "INCONSISTENT" }]).some((failure) => failure.reason === "POLICY_CORRELATION_INVALID" || failure.reason === "POLICY_CORRELATION_STATE_BLOCKED")).toBe(true);
  });

  it("generates policy, authority, constraint, exception, and operational nodes", () => {
    const source = inputs();
    const nodes = resolvePolicyGraphNodes(source.policy_analyses, source.policy_correlations);
    expect(nodes.some((node) => node.node_type === "POLICY")).toBe(true);
    expect(nodes.some((node) => node.node_type === "AUTHORITY")).toBe(true);
    expect(nodes.some((node) => node.node_type === "CONSTRAINT")).toBe(true);
    expect(nodes.some((node) => node.node_type === "EXCEPTION")).toBe(true);
    expect(nodes.some((node) => node.node_type === "RECOMMENDATION")).toBe(true);
    expect(nodes.some((node) => node.node_type === "GOVERNANCE_DECISION")).toBe(true);
    expect(nodes.some((node) => node.node_type === "RUNTIME_CONTROL")).toBe(true);
  });

  it("preserves policy identity in policy nodes", () => {
    const policy = inputs().policy_analyses[0]!;
    const node = buildPolicyNode(policy);
    expect(node.policy_id).toBe(policy.policy_id);
    expect(node.policy_version).toBe(policy.policy_version);
    expect(node.node_hash).toBeTruthy();
  });

  it("generates deterministic dependency edges for every relationship family", () => {
    const source = inputs();
    const edges = buildPolicyDependencyEdges(source.policy_analyses, source.policy_correlations);
    expect(edges.map((edge) => edge.relationship_type)).toEqual(expect.arrayContaining(["DEPENDS_ON", "REFERENCES", "LIMITS", "ENABLES", "SUPPORTED_BY", "DISABLES", "EXTENDS"]));
    expect(edges[0]!.relationship_hash).toBe(buildPolicyDependencyEdges(source.policy_analyses, source.policy_correlations)[0]!.relationship_hash);
  });

  it("detects contradictory permission conflicts without resolving them", () => {
    const source = inputs();
    const conflicts = detectPolicyGraphConflicts(source.policy_analyses, buildPolicyDependencyEdges(source.policy_analyses, source.policy_correlations));
    expect(conflicts.some((conflict) => conflict.conflict_type === "CONTRADICTORY_PERMISSION")).toBe(true);
    expect(conflicts.every((conflict) => conflict.conflict_state === "DETECTED")).toBe(true);
  });

  it("builds a replayable graph snapshot", () => {
    const g = graph();
    const snapshot = buildPolicyGraphSnapshot(g);
    expect(snapshot.immutable).toBe(true);
    expect(snapshot.graph_hash).toBe(g.graph_hash);
    expect(g.graph_state).toBe("REPLAYABLE");
  });

  it("validates a complete graph", () => {
    const result = validatePolicyDependencyGraph(graph());
    expect(result.validation_state).toBe("PASS");
    expect(result.replayable).toBe(true);
    expect(result.tenant_scoped).toBe(true);
  });

  it("fails closed for missing required node classes", () => {
    const g = graph();
    expect(validatePolicyDependencyGraph({ ...g, policy_nodes: [] }).failures.some((failure) => failure.reason === "POLICY_NODE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, authority_nodes: [] }).failures.some((failure) => failure.reason === "AUTHORITY_NODE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, constraint_nodes: [] }).failures.some((failure) => failure.reason === "CONSTRAINT_NODE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, recommendation_nodes: [] }).failures.some((failure) => failure.reason === "RECOMMENDATION_NODE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, governance_decision_nodes: [] }).failures.some((failure) => failure.reason === "GOVERNANCE_DECISION_NODE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, runtime_control_nodes: [] }).failures.some((failure) => failure.reason === "RUNTIME_CONTROL_NODE_MISSING")).toBe(true);
  });

  it("rejects undocumented exceptions and unknown node types", () => {
    const g = graph();
    const badException: PolicyDependencyNode = { ...g.exception_nodes[0]!, authority_required: "", node_hash: "tampered" };
    const badNode: PolicyDependencyNode = { ...g.node_set[0]!, node_type: "UNKNOWN" as never };
    expect(validatePolicyDependencyGraph({ ...g, exception_nodes: [badException] }).failures.some((failure) => failure.reason === "EXCEPTION_NODE_INVALID")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, node_set: [badNode] }).failures.some((failure) => failure.reason === "UNKNOWN_NODE_TYPE")).toBe(true);
  });

  it("rejects unsupported relationships, missing evidence, and missing replay refs", () => {
    const g = graph();
    const edge = g.edge_set[0]!;
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, relationship_type: "UNKNOWN" as never }] }).failures.some((failure) => failure.reason === "UNSUPPORTED_RELATIONSHIP")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, evidence_refs: [] }] }).failures.some((failure) => failure.reason === "EDGE_EVIDENCE_MISSING")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, replay_refs: [] }] }).failures.some((failure) => failure.reason === "EDGE_REPLAY_REFS_MISSING")).toBe(true);
  });

  it("detects tenant mismatch and required acyclicity violations", () => {
    const g = graph();
    const edge = g.edge_set[0]!;
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, tenant_id: "tenant_beta" }] }).failures.some((failure) => failure.reason === "TENANT_MISMATCH")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, relationship_type: "INHERITS", target_policy_id: edge.source_policy_id }] }).failures.some((failure) => failure.reason === "CIRCULAR_INHERITANCE")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, edge_set: [{ ...edge, relationship_type: "DEPENDS_ON", target_policy_id: edge.source_policy_id }] }).failures.some((failure) => failure.reason === "RECURSIVE_DEPENDENCY_CHAIN")).toBe(true);
  });

  it("detects replay and graph hash mismatches", () => {
    const g = graph();
    expect(computePolicyDependencyGraphHash(g)).toBe(g.graph_hash);
    expect(validatePolicyDependencyGraph({ ...g, graph_hash: "tampered" }).failures.some((failure) => failure.reason === "GRAPH_HASH_MISMATCH")).toBe(true);
    expect(validatePolicyDependencyGraph({ ...g, replay_refs: { ...g.replay_refs, graph_output_hash: "" } }).failures.some((failure) => failure.reason === "REPLAY_REFS_MISSING")).toBe(true);
  });

  it("detects historical mutation", () => {
    const g = graph();
    expect(validatePolicyDependencyGraph({ ...g, graph_hash: "mutated" }, { original_graph: g }).failures.some((failure) => failure.reason === "HISTORICAL_MUTATION")).toBe(true);
  });

  it("replays graph deterministically", () => {
    const g = graph();
    const replay = replayPolicyDependencyGraph(g);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_hash).toBe(g.graph_hash);
  });

  it("validates graph state transitions and blocks invalid transitions", () => {
    const g = graph();
    expect(transitionPolicyDependencyGraphState(g, "ARCHIVED").validation_state).toBe("PASS");
    expect(transitionPolicyDependencyGraphState(g, "NODES_RESOLVED").failures.some((failure) => failure.reason === "INVALID_STATE_TRANSITION")).toBe(true);
  });

  it("runs the dependency graph engine", () => {
    const result = runPolicyDependencyGraphEngine();
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.snapshot.immutable).toBe(true);
    expect(result.graph.edge_set.length).toBeGreaterThan(0);
  });

  it("builds operator graph observability", () => {
    const surface = buildPolicyGraphObservabilitySurface();
    expect(surface.graph_state).toBe("REPLAYABLE");
    expect(surface.relationship_edges.length).toBeGreaterThan(0);
    expect(surface.explanations[0]!.steps.some((step) => step.includes("relationship edges"))).toBe(true);
  });

  it("accepts correlations from the 7B.2 engine", () => {
    const analysis = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" });
    const correlations = generatePolicyCorrelations(analysis);
    const result = runPolicyDependencyGraphEngine([analysis], correlations);
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.graph.source_policy_correlation_refs).toEqual(correlations.map((correlation) => correlation.policy_correlation_id).sort());
  });
});
