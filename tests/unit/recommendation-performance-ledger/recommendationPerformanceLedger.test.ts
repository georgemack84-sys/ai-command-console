import { describe, expect, it } from "vitest";
import {
  appendRecommendationPerformanceRecord,
  computeRecommendationPerformanceRecordHash,
  getRecommendationPerformanceLedgerFoundation,
  replayRecommendationPerformanceLedger,
} from "@/services/recommendation-performance-ledger";
import type { RecommendationPerformanceLedgerFailure, RecommendationPerformanceLedgerScenario } from "@/types/recommendation-performance-ledger";

describe("Mission Control Phase 10.3.9 Recommendation Performance Ledger", () => {
  it("publishes the recommendation performance ledger foundation", () => {
    const foundation = getRecommendationPerformanceLedgerFoundation();

    expect(foundation.recommendation_performance_ledger_version).toBe("recommendation-performance-ledger/v1");
    expect(foundation.api_surface.append_record).toBe("POST /recommendation-performance-ledger/append");
    expect(foundation.api_surface.update_supported).toBe(false);
    expect(foundation.api_surface.delete_supported).toBe(false);
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("records immutable append-only history without reporting or learning database behavior", () => {
    const result = appendRecommendationPerformanceRecord();

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.learning_database).toBe(false);
    expect(result.reporting_database).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.performance_record.append_only).toBe(true);
    expect(result.performance_record.immutable).toBe(true);
    expect(result.performance_record.mutation_supported).toBe(false);
    expect(result.performance_record.delete_supported).toBe(false);
  });

  it("preserves recommendation, outcome, score, operator, failure, improvement, governance, replay, and integrity refs", () => {
    const result = appendRecommendationPerformanceRecord();
    const record = result.performance_record;

    expect(record.recommendation_refs.length).toBeGreaterThan(0);
    expect(record.outcome_refs.length).toBeGreaterThan(0);
    expect(record.score_refs.length).toBeGreaterThan(0);
    expect(record.operator_action_refs.length).toBeGreaterThan(0);
    expect(record.improvement_refs).toEqual(result.improvement_result.opportunities.map((opportunity) => opportunity.improvement_id));
    expect(record.governance_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.integrity_hashes).toContain(result.improvement_result.integrity_hash);
  });

  it("builds deterministic historical indexes for read-only lookup", () => {
    const result = appendRecommendationPerformanceRecord();
    const registry = result.historical_registry;
    const recordId = result.performance_record.performance_record_id;

    expect(registry.deterministic_lookup).toBe(true);
    expect(registry.read_only).toBe(true);
    expect(registry.recommendation_index[result.performance_record.recommendation_id]).toEqual([recordId]);
    expect(registry.mission_index[result.performance_record.mission_id]).toEqual([recordId]);
    expect(registry.decision_index[result.performance_record.decision_id]).toEqual([recordId]);
    expect(result.validation.historical_indexed).toBe(true);
  });

  it("constructs a complete immutable lineage graph", () => {
    const result = appendRecommendationPerformanceRecord();

    expect(result.lineage_graph.complete).toBe(true);
    expect(result.lineage_graph.immutable).toBe(true);
    expect(result.lineage_graph.replayable).toBe(true);
    expect(result.lineage_graph.edges.length).toBeGreaterThan(0);
    expect(result.lineage_graph.edges.every((edge) => edge.immutable && edge.replayable)).toBe(true);
  });

  it("registers replay dependencies and validates deterministic reconstruction", () => {
    const result = appendRecommendationPerformanceRecord();

    expect(result.replay_registry.replay_dependencies_complete).toBe(true);
    expect(result.replay_registry.improvement_replay_refs).toEqual([result.improvement_result.replay_hash]);
    expect(replayRecommendationPerformanceLedger(result)).toBe(true);
  });

  it("creates stable performance record hashes", () => {
    const result = appendRecommendationPerformanceRecord();

    expect(computeRecommendationPerformanceRecordHash(result.performance_record)).toBe(result.performance_record.integrity_hash);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it("validates governance, evidence, replay, lineage, tenant isolation, and read immutability", () => {
    const result = appendRecommendationPerformanceRecord();

    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.evidence_referenced).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.lineage_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.read_operations_mutate_state).toBe(false);
  });

  it.each([
    ["MUTATION_ATTEMPT", "MUTATION_ATTEMPT_DETECTED"],
    ["DELETE_ATTEMPT", "DELETE_ATTEMPT_DETECTED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_HASH", "INTEGRITY_HASH_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["INVALID_RECOMMENDATION", "RECOMMENDATION_IDENTITY_INVALID"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["LINEAGE_GRAPH_INCOMPLETE", "LINEAGE_GRAPH_INCOMPLETE"],
    ["HASH_MISMATCH", "HASH_MISMATCH_DETECTED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RecommendationPerformanceLedgerScenario, RecommendationPerformanceLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = appendRecommendationPerformanceRecord({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.append_only).toBe(true);
    expect(result.modifies_recommendations).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = appendRecommendationPerformanceRecord({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.certified).toBe(false);
  });

  it("detects performance ledger tampering during replay", () => {
    const result = appendRecommendationPerformanceRecord();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationPerformanceLedger(tampered)).toBe(false);
  });
});
