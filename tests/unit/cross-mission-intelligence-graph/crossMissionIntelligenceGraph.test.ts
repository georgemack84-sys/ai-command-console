import { describe, expect, it } from "vitest";

import {
  buildCrossMissionIntelligenceGraph,
  getCrossMissionIntelligenceGraphContract,
  replayCrossMissionIntelligenceGraph,
  validateCrossMissionIntelligenceGraph,
} from "../../../services/cross-mission-intelligence-graph";

describe("cross-mission intelligence graph", () => {
  it("builds deterministic certified graph intelligence", () => {
    const first = buildCrossMissionIntelligenceGraph();
    const second = buildCrossMissionIntelligenceGraph();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.available_for_graph_intelligence).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateCrossMissionIntelligenceGraph(first).valid).toBe(true);
    expect(replayCrossMissionIntelligenceGraph(first)).toBe(true);
  });

  it("keeps the graph distinct from adaptive memory and institutional storage", () => {
    const bundle = getCrossMissionIntelligenceGraphContract();

    expect(bundle.doctrine.graph_is_adaptive_memory).toBe(false);
    expect(bundle.doctrine.graph_is_institutional_memory_store).toBe(false);
    expect(bundle.doctrine.qualification_only).toBe(true);
    expect(bundle.doctrine.confidence_qualified_edges).toBe(true);
  });

  it("constructs qualified nodes, relationships, and domains", () => {
    const graph = buildCrossMissionIntelligenceGraph();

    expect(graph.institutional_memory_certified).toBe(true);
    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges).toHaveLength(6);
    expect(graph.domains).toHaveLength(6);
    expect(graph.nodes.every((node) => node.qualification_ref.length > 0 && node.lineage_refs.length > 0)).toBe(true);
    expect(graph.edges.every((edge) => edge.confidence >= graph.contract.confidence_threshold)).toBe(true);
    expect(graph.domains.every((domain) => domain.validated)).toBe(true);
  });

  it("provides deterministic search, traversal, and clustering", () => {
    const graph = buildCrossMissionIntelligenceGraph();

    expect(graph.search.deterministic).toBe(true);
    expect(graph.search.result_node_refs).toHaveLength(4);
    expect(graph.traversal.deterministic).toBe(true);
    expect(graph.traversal.path).toHaveLength(graph.nodes.length);
    expect(graph.clusters).toHaveLength(2);
    expect(graph.clusters.every((cluster) => cluster.reproducible)).toBe(true);
  });

  it("replays graph construction and preserves tenant isolation", () => {
    const graph = buildCrossMissionIntelligenceGraph();
    const tenant = graph.nodes[0].tenant_id;

    expect(graph.replay.node_reconstruction).toBe(true);
    expect(graph.replay.edge_reconstruction).toBe(true);
    expect(graph.replay.traversal_replay).toBe(true);
    expect(graph.nodes.every((node) => node.tenant_id === tenant)).toBe(true);
    expect(graph.edges.every((edge) => edge.tenant_id === tenant)).toBe(true);
  });

  it("runs the Phase 11.4 certification matrix and graph ledger", () => {
    const graph = buildCrossMissionIntelligenceGraph();

    expect(graph.certification.tests).toHaveLength(27);
    expect(graph.certification.tests.every((test) => test.passed)).toBe(true);
    expect(graph.ledger).toHaveLength(8);
    expect(graph.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("fails closed for graph integrity and governance violations", () => {
    for (const scenario of ["REPLAY_DIVERGENCE", "GOVERNANCE_VALIDATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "TENANT_ISOLATION_BREACH", "CONFIDENCE_THRESHOLD_BYPASS", "CROSS_TENANT_RELATIONSHIP_UNAUTHORIZED"] as const) {
      const graph = buildCrossMissionIntelligenceGraph({ scenario });

      expect(graph.certification.status).toBe("FAIL");
      expect(graph.certification.available_for_graph_intelligence).toBe(false);
      expect(graph.certification.failures).toContain(scenario);
      expect(validateCrossMissionIntelligenceGraph(graph).valid).toBe(false);
    }
  });
});
