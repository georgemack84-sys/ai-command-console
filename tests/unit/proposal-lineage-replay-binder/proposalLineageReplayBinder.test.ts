import { describe, expect, it } from "vitest";
import {
  bindProposalLineage,
  getProposalLineageReplayFoundation,
  replayProposalLineageBinding,
} from "@/services/proposal-lineage-replay-binder";
import type {
  ProposalLineageReferenceCategory,
  ProposalLineageReplayFailure,
  ProposalLineageReplayScenario,
} from "@/types/proposal-lineage-replay-binder";

describe("Mission Control Phase 10.10.7 Proposal Lineage & Replay Binder", () => {
  const expectedCategories: readonly ProposalLineageReferenceCategory[] = [
    "OUTCOME",
    "RECOMMENDATION",
    "EVIDENCE",
    "SIMULATION",
    "OPERATOR_FEEDBACK",
    "GOVERNANCE_REVIEW",
    "CERTIFICATION_HISTORY",
    "RISK_RECORD",
    "CONFIDENCE_RECORD",
    "SCORING",
    "PRIORITIZATION",
    "SUPPRESSION",
    "CONSOLIDATION",
  ];

  it("publishes the proposal lineage replay binder contract", () => {
    const foundation = getProposalLineageReplayFoundation();

    expect(foundation.proposal_lineage_replay_binder_version).toBe("proposal-lineage-replay-binder/v1");
    expect(foundation.api_surface.bind_lineage).toBe("POST /proposal-lineage-replay-binder/bind");
    expect(foundation.api_surface.retrieve_replay_graphs).toBe("POST /proposal-lineage-replay-binder/replay-graphs");
    expect(foundation.api_surface.proposal_mutation_supported).toBe(false);
    expect(foundation.api_surface.lineage_rewrite_supported).toBe(false);
    expect(foundation.supported_reference_categories).toEqual(expectedCategories);
    expect(foundation.result.binding_state).toBe("BOUND");
  });

  it("binds proposal lineage deterministically", () => {
    const first = bindProposalLineage({ scenario: "DUPLICATE_CONSOLIDATION" });
    const second = bindProposalLineage({ scenario: "DUPLICATE_CONSOLIDATION" });

    expect(first.lineage_records[0]?.integrity_hash).toBe(second.lineage_records[0]?.integrity_hash);
    expect(first.lineage_records[0]?.replay_graph.integrity_hash).toBe(second.lineage_records[0]?.replay_graph.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("binds all required historical reference families", () => {
    const record = bindProposalLineage().lineage_records[0];
    const categories = [...new Set(record?.referenced_artifacts.map((reference) => reference.category))].sort();

    expect(categories).toEqual([...expectedCategories].sort());
    expect(record?.referenced_artifacts.every((reference) => reference.immutable)).toBe(true);
    expect(record?.referenced_artifacts.every((reference) => reference.tenant_scope === "CURRENT_TENANT")).toBe(true);
  });

  it("generates complete deterministic replay graphs", () => {
    const graph = bindProposalLineage({ scenario: "OVERLAPPING_CONSOLIDATION" }).lineage_records[0]?.replay_graph;

    expect(graph?.replay_version).toBe("proposal-lineage-replay/v1");
    expect(graph?.replay_steps).toContain("verify_byte_identical_replay_hash");
    expect(graph?.reconstructs_identity).toBe(true);
    expect(graph?.reconstructs_inputs).toBe(true);
    expect(graph?.reconstructs_evidence).toBe(true);
    expect(graph?.reconstructs_governance).toBe(true);
    expect(graph?.reconstructs_constitutional).toBe(true);
    expect(graph?.reconstructs_authority).toBe(true);
    expect(graph?.reconstructs_scoring).toBe(true);
    expect(graph?.reconstructs_prioritization).toBe(true);
    expect(graph?.reconstructs_suppression).toBe(true);
    expect(graph?.reconstructs_consolidation).toBe(true);
    expect(graph?.byte_identical_reconstruction).toBe(true);
  });

  it("builds validated dependency graphs", () => {
    const record = bindProposalLineage({ scenario: "CONFLICTING_RELATIONSHIP" }).lineage_records[0];
    const graph = record?.dependency_graph;

    expect(graph?.graph_consistent).toBe(true);
    expect(graph?.nodes).toContain(record?.consolidated_proposal_id);
    expect(graph?.edges.length).toBeGreaterThan(0);
    expect(graph?.topological_order.length).toBe(graph?.nodes.length);
    expect(graph?.immutable).toBe(true);
  });

  it("supports complete backward and forward traceability", () => {
    const record = bindProposalLineage().lineage_records[0];

    expect(record?.traceability.complete_backward_traceability).toBe(true);
    expect(record?.traceability.complete_forward_traceability).toBe(true);
    expect(record?.traceability.backward_traceability).toEqual(expectedCategories);
    expect(record?.traceability.forward_traceability).toContain("simulation_execution");
    expect(record?.traceability.forward_traceability).toContain("certification");
    expect(record?.traceability.forward_traceability).toContain("future_proposal_evolution");
  });

  it("preserves immutable advisory-only lineage records", () => {
    const result = bindProposalLineage();
    const record = result.lineage_records[0];

    expect(result.lineage_immutable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(result.rewrites_lineage).toBe(false);
    expect(result.approves_proposals).toBe(false);
    expect(result.rejects_proposals).toBe(false);
    expect(result.implements_proposals).toBe(false);
    expect(record?.immutable).toBe(true);
    expect(record?.modifies_proposal).toBe(false);
    expect(record?.mutates_history).toBe(false);
    expect(record?.approves_proposal).toBe(false);
  });

  it("publishes lineage metrics", () => {
    const result = bindProposalLineage({ scenario: "DUPLICATE_CONSOLIDATION" });

    expect(result.metrics.proposals_bound).toBe(1);
    expect(result.metrics.lineage_completeness_rate).toBe(1);
    expect(result.metrics.replay_completeness_rate).toBe(1);
    expect(result.metrics.dependency_graph_size).toBeGreaterThan(0);
    expect(result.metrics.historical_artifacts_referenced).toBeGreaterThan(0);
    expect(result.metrics.replay_generation_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it.each([
    ["MISSING_REFERENCES", "REQUIRED_REFERENCES_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["REPLAY_GRAPH_FAILURE", "REPLAY_GRAPH_GENERATION_FAILED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_HISTORY_INCOMPLETE"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_HISTORY_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["DEPENDENCY_INCONSISTENT", "DEPENDENCY_GRAPH_INCONSISTENT"],
    ["NONDETERMINISTIC_REPLAY", "DETERMINISTIC_REPLAY_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["NO_BINDABLE_PROPOSALS", "NO_BINDABLE_PROPOSALS"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["HISTORICAL_MUTATION_ATTEMPT", "HISTORICAL_RECORD_MUTATION_ATTEMPT"],
    ["LINEAGE_REWRITE_ATTEMPT", "LINEAGE_REWRITE_ATTEMPT"],
    ["IMMUTABLE_OVERWRITE_ATTEMPT", "IMMUTABLE_RECORD_OVERWRITE_ATTEMPT"],
    ["DEPENDENCY_FABRICATION", "DEPENDENCY_FABRICATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_HISTORY_BYPASS_ATTEMPT"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_HISTORY_BYPASS_ATTEMPT"],
    ["OPERATOR_BYPASS", "OPERATOR_HISTORY_BYPASS_ATTEMPT"],
    ["CROSS_TENANT_LINEAGE", "CROSS_TENANT_LINEAGE_ATTEMPT"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["REJECTION_ATTEMPT", "PROPOSAL_REJECTION_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "PROPOSAL_IMPLEMENTATION_ATTEMPT"],
  ] as readonly [ProposalLineageReplayScenario, ProposalLineageReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const result = bindProposalLineage({ scenario });

    expect(result.binding_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.lineage_validation_failures).toContain(failure);
    expect(result.lineage_records).toEqual([]);
    expect(result.modifies_proposals).toBe(false);
    expect(result.approves_proposals).toBe(false);
  });

  it("replays lineage binding and detects tampering", () => {
    const result = bindProposalLineage({ scenario: "DUPLICATE_CONSOLIDATION" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayProposalLineageBinding(result)).toBe(true);
    expect(replayProposalLineageBinding(tampered)).toBe(false);
  });
});
