import { describe, expect, it, vi } from "vitest";
import {
  buildAuthorityGraph,
  buildEvidenceChain,
  buildExplanationGraph,
  buildPolicyInfluenceGraph,
  buildReasoningGraphObservabilitySurface,
  getReasoningGraph,
  getReasoningGraphContract,
  queryReasoningGraph,
  registerEvidence,
  replayReasoningGraph,
  validateReasoningGraph,
} from "@/services/evidence-policy-reasoning-graph";
import type { ReasoningGraphFailure, ReasoningGraphScenario } from "@/types/evidence-policy-reasoning-graph";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.5.3 Evidence & Policy Reasoning Graph", () => {
  it("defines deterministic graph doctrine and source contracts", () => {
    const contract = getReasoningGraphContract();

    expect(contract.doctrine.engine_version).toBe("evidence-policy-reasoning-graph/v8ALT.5.3");
    expect(contract.doctrine.principles).toContain("deterministic-graph-construction");
    expect(contract.doctrine.principles).toContain("evidence-backed-relationships");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.node_categories).toContain("TRUTH_LEDGER");
    expect(contract.validation.valid).toBe(true);
  });

  it("registers append-only evidence graph repositories deterministically", () => {
    const first = registerEvidence();
    const second = registerEvidence();
    const graph = getReasoningGraph(first);

    expect(first.append_only).toBe(true);
    expect(first.read_only).toBe(true);
    expect(first.repository_hash).toBe(second.repository_hash);
    expect(graph?.nodes.some((item) => item.category === "EVIDENCE")).toBe(true);
    expect(graph?.edges.some((item) => item.relationship === "supports")).toBe(true);
    expect(validateReasoningGraph(graph).valid).toBe(true);
  });

  it("builds specialized graph artifacts from the same certified lineage", () => {
    const evidence = buildEvidenceChain();
    const policy = buildPolicyInfluenceGraph();
    const authority = buildAuthorityGraph();

    expect(evidence.graph_type).toBe("EVIDENCE_CHAIN");
    expect(policy.graph_type).toBe("POLICY_INFLUENCE");
    expect(authority.graph_type).toBe("AUTHORITY_LINEAGE");
    expect(validateReasoningGraph(evidence).valid).toBe(true);
    expect(validateReasoningGraph(policy).valid).toBe(true);
    expect(validateReasoningGraph(authority).valid).toBe(true);
  });

  it("replays topology, node counts, edge counts, and graph hashes reproducibly", () => {
    const graph = getReasoningGraph(buildExplanationGraph());
    const first = replayReasoningGraph(graph);
    const second = replayReasoningGraph(graph);

    expect(first.deterministic).toBe(true);
    expect(first.reconstructed_hash).toBe(first.original_hash);
    expect(first.node_count).toBe(graph?.nodes.length);
    expect(first.edge_count).toBe(graph?.edges.length);
    expect(first.replay_result_hash).toBe(second.replay_result_hash);
  });

  it("queries graph repositories by decision, evidence, policy, authority, and relationship", () => {
    const repository = buildExplanationGraph();
    const graph = getReasoningGraph(repository)!;
    const evidence = graph.source_explanation.evidence_references[0];
    const policy = graph.source_explanation.policy_references[0];
    const authority = graph.source_explanation.authority_references.authority_chain[0];

    expect(queryReasoningGraph({ decision_id: graph.decision_id }, repository)).toHaveLength(1);
    expect(queryReasoningGraph({ evidence }, repository)).toHaveLength(1);
    expect(queryReasoningGraph({ policy }, repository)).toHaveLength(1);
    expect(queryReasoningGraph({ authority }, repository)).toHaveLength(1);
    expect(queryReasoningGraph({ relationship: "governs" }, repository)).toHaveLength(1);
  });

  it("keeps graph construction advisory-only", () => {
    const graph = getReasoningGraph(buildExplanationGraph());

    expect(graph?.advisory_only).toBe(true);
    expect(graph?.plan_modified).toBe(false);
    expect(graph?.execution_modified).toBe(false);
    expect(graph?.evidence_modified).toBe(false);
    expect(graph?.governance_modified).toBe(false);
    expect(graph?.authority_escalated).toBe(false);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["UNSUPPORTED_RELATIONSHIP", "UNSUPPORTED_RELATIONSHIP_DETECTED"],
    ["INCOMPLETE_POLICY_LINEAGE", "POLICY_LINEAGE_INCOMPLETE"],
    ["MISSING_CONSTITUTIONAL_REFERENCES", "CONSTITUTIONAL_REFERENCES_ABSENT"],
    ["INCOMPLETE_AUTHORITY_VALIDATION", "AUTHORITY_VALIDATION_INCOMPLETE"],
    ["DECISION_LINEAGE_GAP", "DECISION_LINEAGE_GAP_DETECTED"],
    ["INVALID_REPLAY_REFERENCE", "REPLAY_REFERENCE_INVALID"],
    ["NONDETERMINISTIC_TOPOLOGY", "GRAPH_TOPOLOGY_NONDETERMINISTIC"],
    ["DUPLICATE_NODES", "DUPLICATE_NODE_DETECTED"],
    ["ORPHANED_RELATIONSHIP", "ORPHANED_RELATIONSHIP_DETECTED"],
    ["CROSS_TENANT_RELATIONSHIP", "CROSS_TENANT_RELATIONSHIP_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["FABRICATED_DEPENDENCY", "FABRICATED_DEPENDENCY_DETECTED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [ReasoningGraphScenario, ReasoningGraphFailure][])("rejects %s", (scenario, failure) => {
    const graph = getReasoningGraph(buildExplanationGraph({ scenario }));
    const validation = validateReasoningGraph(graph);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes graph observability without execution authority", () => {
    const repository = buildExplanationGraph();
    const surface = buildReasoningGraphObservabilitySurface(repository);

    expect(surface.repository_id).toBe(repository.repository_id);
    expect(surface.graph_count).toBe(1);
    expect(surface.graph_types).toEqual(["EXPLANATION_GRAPH"]);
    expect(surface.node_count).toBeGreaterThan(10);
    expect(surface.edge_count).toBeGreaterThan(10);
    expect(surface.advisory_only).toBe(true);
  });
});
