import { describe, expect, it } from "vitest";
import {
  LINEAGE_NODE_CHAIN,
  OUTCOME_LINEAGE_CHECKS,
  computeOutcomeLineageGraphHash,
  getOutcomeLineageMapperFoundation,
  replayOutcomeLineageMapper,
  runOutcomeLineageMapper,
} from "@/services/outcome-lineage-mapper";
import type { OutcomeLineageFailure, OutcomeLineageMapperInput } from "@/types/outcome-lineage-mapper";

describe("Mission Control Phase 10.2.4 Outcome Lineage Mapper", () => {
  it("publishes the outcome lineage mapper foundation", () => {
    const foundation = getOutcomeLineageMapperFoundation();

    expect(foundation.outcome_lineage_mapper_version).toBe("outcome-lineage-mapper/v1");
    expect(foundation.checks).toEqual(OUTCOME_LINEAGE_CHECKS);
    expect(foundation.api_surface.build_lineage_graph).toBe("POST /lineage/build");
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("records relationships only without mutating historical artifacts", () => {
    const result = runOutcomeLineageMapper();

    expect(result.records_relationships_only).toBe(true);
    expect(result.modifies_decisions).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_evidence).toBe(false);
    expect(result.modifies_truth_ledger_records).toBe(false);
  });

  it("constructs the minimum Decision to Adaptive History chain", () => {
    const result = runOutcomeLineageMapper();

    expect(result.nodes.map((node) => node.node_type)).toEqual(LINEAGE_NODE_CHAIN);
    expect(result.relationships).toHaveLength(LINEAGE_NODE_CHAIN.length - 1);
    expect(result.lineage_graph.graph_state).toBe("VALID");
  });

  it("creates stable graph hashes and replay output", () => {
    const result = runOutcomeLineageMapper();

    expect(computeOutcomeLineageGraphHash(result.lineage_graph)).toBe(result.lineage_graph.integrity_hash);
    expect(replayOutcomeLineageMapper(result)).toBe(true);
  });

  it("maps historical dependencies for the complete lineage", () => {
    const result = runOutcomeLineageMapper();

    expect(result.dependencies).toHaveLength(result.relationships.length);
    expect(result.dependencies.every((dependency) => dependency.replay_refs.length > 0)).toBe(true);
    expect(result.dependencies.map((dependency) => dependency.dependency_type)).toContain("GOVERNANCE");
    expect(result.dependencies.map((dependency) => dependency.dependency_type)).toContain("ADAPTIVE");
  });

  it("provides deterministic lineage query metadata", () => {
    const result = runOutcomeLineageMapper();

    expect(result.query_result.supported_queries).toContain("OUTCOME");
    expect(result.query_result.supported_queries).toContain("ADAPTIVE_HISTORY");
    expect(result.query_result.traversal_order).toEqual(result.nodes.map((node) => node.node_id));
    expect(result.query_result.query_mutated_graph).toBe(false);
  });

  it("publishes advisory-only lineage metrics", () => {
    const result = runOutcomeLineageMapper();

    expect(result.metrics.lineage_graphs_created).toBe(1);
    expect(result.metrics.graph_depth).toBe(8);
    expect(result.metrics.node_count).toBe(8);
    expect(result.metrics.relationship_count).toBe(7);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("generates deterministic replay reports", () => {
    const result = runOutcomeLineageMapper();

    expect(result.replay_report.graph_hash).toBe(result.lineage_graph.integrity_hash);
    expect(result.replay_report.node_hashes.length).toBe(result.nodes.length);
    expect(result.replay_report.relationship_hashes.length).toBe(result.relationships.length);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
  });

  it.each([
    ["MISSING_DECISION", "MISSING_DECISION_NODE_REJECTED"],
    ["MISSING_RECOMMENDATION", "MISSING_RECOMMENDATION_NODE_REJECTED"],
    ["MISSING_DECISION_PACKAGE", "MISSING_DECISION_PACKAGE_NODE_REJECTED"],
    ["MISSING_OPERATOR_ACTION", "MISSING_OPERATOR_ACTION_NODE_REJECTED"],
    ["MISSING_EXECUTION", "MISSING_EXECUTION_NODE_REJECTED"],
    ["MISSING_OBSERVED_OUTCOME", "MISSING_OBSERVED_OUTCOME_NODE_REJECTED"],
    ["MISSING_TRUTH_LEDGER", "MISSING_TRUTH_LEDGER_NODE_REJECTED"],
    ["MISSING_ADAPTIVE_HISTORY", "MISSING_ADAPTIVE_HISTORY_NODE_REJECTED"],
    ["INVALID_RELATIONSHIP", "INVALID_RELATIONSHIP_TYPE_REJECTED"],
    ["ORPHAN_OUTCOME", "ORPHAN_OUTCOME_REJECTED"],
    ["CYCLE", "LINEAGE_CYCLE_REJECTED"],
    ["CROSS_TENANT", "CROSS_TENANT_LINEAGE_REJECTED"],
    ["MISSION_MISMATCH", "MISSION_MISMATCH_REJECTED"],
    ["APPEND_ONLY_VIOLATION", "RELATIONSHIP_REGISTRY_APPEND_ONLY_VIOLATED"],
    ["LINEAGE_REORDERING", "LINEAGE_REORDERING_REJECTED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_NOT_REPRODUCIBLE"],
    ["HISTORICAL_MUTATION", "HISTORICAL_RELATIONSHIP_MUTATION_REJECTED"],
    ["INVALID_BINDING", "TRUTH_BINDING_NOT_VALIDATED"],
    ["FAIL_OPEN", "FAIL_OPEN_LINEAGE_MAPPING_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeLineageMapperInput["scenario"]>, OutcomeLineageFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeLineageMapper({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.records_relationships_only).toBe(true);
  });

  it("fails closed when the role lacks lineage visibility", () => {
    const result = runOutcomeLineageMapper({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects lineage mapper tampering during replay", () => {
    const result = runOutcomeLineageMapper();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeLineageMapper(tampered)).toBe(false);
  });
});
