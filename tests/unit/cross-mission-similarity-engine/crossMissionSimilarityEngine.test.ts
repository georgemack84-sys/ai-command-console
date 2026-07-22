import { describe, expect, it } from "vitest";
import {
  establishCrossMissionSimilarityEngine,
  getCrossMissionSimilarityEngine,
  replayCrossMissionSimilarityEngine,
} from "@/services/cross-mission-similarity-engine";
import type {
  ContextMatchingDimension,
  CrossMissionSimilarityFailure,
  CrossMissionSimilarityScenario,
  MissionComparisonDimension,
} from "@/types/cross-mission-similarity-engine";

describe("Mission Control Phase 10.13E Cross-Mission Similarity Engine", () => {
  const comparisonDimensions: readonly MissionComparisonDimension[] = [
    "OBJECTIVE",
    "EVIDENCE",
    "RISK",
    "CONFIDENCE",
    "GOVERNANCE",
    "OUTCOME",
    "SIMULATION",
    "STRATEGY",
    "OPERATOR",
    "CERTIFICATION",
  ];

  const contextDimensions: readonly ContextMatchingDimension[] = [
    "OPERATIONAL_ENVIRONMENT",
    "ORGANIZATIONAL_STRUCTURE",
    "MISSION_PHASE",
    "DEPENDENCY_GRAPH",
    "REGULATORY_ENVIRONMENT",
    "MISSION_CONSTRAINTS",
    "AVAILABLE_RESOURCES",
    "EXECUTION_CONDITIONS",
  ];

  it("publishes the authoritative cross-mission similarity contract", () => {
    const engine = getCrossMissionSimilarityEngine();

    expect(engine.cross_mission_similarity_version).toBe("cross-mission-similarity-engine/v1");
    expect(engine.supported_comparison_dimensions).toEqual(comparisonDimensions);
    expect(engine.supported_context_dimensions).toEqual(contextDimensions);
    expect(engine.api_surface.establish_engine).toBe("POST /cross-mission-similarity-engine/establish");
    expect(engine.api_surface.retrieve_contract).toBe("GET /cross-mission-similarity-engine/contract");
    expect(engine.api_surface.autonomous_learning_supported).toBe(false);
    expect(engine.api_surface.decision_authority_supported).toBe(false);
    expect(engine.api_surface.recommendation_mutation_supported).toBe(false);
    expect(engine.api_surface.cross_tenant_default_supported).toBe(false);
    expect(engine.result.engine_identifier).toBe("CrossMissionSimilarityEngine");
    expect(engine.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic similarity records, ranking, replay, and integrity", () => {
    const first = establishCrossMissionSimilarityEngine();
    const second = establishCrossMissionSimilarityEngine();

    expect(first.similarity_records.map((record) => record.integrity_hash)).toEqual(second.similarity_records.map((record) => record.integrity_hash));
    expect(first.similarity_ledger.map((entry) => entry.integrity_hash)).toEqual(second.similarity_ledger.map((entry) => entry.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayCrossMissionSimilarityEngine(first)).toBe(true);
  });

  it("validates candidate eligibility before comparison", () => {
    const result = establishCrossMissionSimilarityEngine();

    expect(result.candidate_eligibility.tenant_authorization).toBe(true);
    expect(result.candidate_eligibility.mission_scope_allows_comparison).toBe(true);
    expect(result.candidate_eligibility.governance_permits_reuse).toBe(true);
    expect(result.candidate_eligibility.evidence_lineage_complete).toBe(true);
    expect(result.candidate_eligibility.replay_references_available).toBe(true);
    expect(result.candidate_eligibility.certification_valid).toBe(true);
    expect(result.candidate_eligibility.integrity_verified).toBe(true);
    expect(result.candidate_eligibility.cross_tenant_blocked_by_default).toBe(true);
    expect(result.candidate_eligibility.eligible).toBe(true);
  });

  it("produces ranked explainable historical similarity records", () => {
    const result = establishCrossMissionSimilarityEngine();

    expect(result.similarity_records).toHaveLength(10);
    expect(result.similarity_records.map((record) => record.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.similarity_records.every((record) => record.similarity_id.startsWith("cms_"))).toBe(true);
    expect(result.similarity_records.every((record) => record.comparison_scope === "TENANT_SCOPED")).toBe(true);
    expect(result.similarity_records.every((record) => record.overall_similarity_score > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.evidence_refs.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.replay_refs.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.governance_refs.length > 0)).toBe(true);
  });

  it("explains every similarity result completely", () => {
    const result = establishCrossMissionSimilarityEngine();

    expect(result.similarity_records.every((record) => record.explanation.explanation_complete)).toBe(true);
    expect(result.similarity_records.every((record) => record.explanation.matched_objectives.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.explanation.matched_evidence.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.explanation.matched_governance_decisions.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.explanation.supporting_patterns.length > 0)).toBe(true);
    expect(result.similarity_records.every((record) => record.explanation.replay_refs.length > 0)).toBe(true);
  });

  it("records append-only immutable similarity ledger events", () => {
    const result = establishCrossMissionSimilarityEngine();

    expect(result.similarity_ledger).toHaveLength(110);
    expect(result.similarity_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.similarity_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.similarity_ledger.every((entry) => entry.deterministic)).toBe(true);
    expect(result.similarity_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.similarity_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.similarity_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces advisory-only boundaries and cross-tenant default blocking", () => {
    const result = establishCrossMissionSimilarityEngine();

    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.autonomous_learning_supported).toBe(false);
    expect(result.contract.decision_authority_supported).toBe(false);
    expect(result.contract.recommendation_mutation_supported).toBe(false);
    expect(result.contract.cross_tenant_blocked_by_default).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_learning_supported).toBe(false);
    expect(result.decision_authority_supported).toBe(false);
    expect(result.recommendation_mutation_supported).toBe(false);
  });

  it("publishes observability metrics", () => {
    const metrics = establishCrossMissionSimilarityEngine().metrics;

    expect(metrics.similarity_requests).toBe(1);
    expect(metrics.comparison_throughput).toBe(10);
    expect(metrics.retrieval_latency_ms).toBe(9);
    expect(metrics.candidate_count).toBe(10);
    expect(metrics.similarity_score_distribution).toHaveLength(10);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.governance_denials).toBe(0);
    expect(metrics.authorization_failures).toBe(0);
    expect(metrics.blocked_cross_tenant_comparisons).toBe(0);
    expect(metrics.explanation_completeness).toBe(1);
  });

  it.each([
    ["REGISTRY_UNAVAILABLE", "REGISTRY_UNAVAILABLE"],
    ["NONDETERMINISTIC_SCORE", "NONDETERMINISTIC_SIMILARITY_SCORE"],
    ["NONDETERMINISTIC_COMPARISON", "NONDETERMINISTIC_COMPARISON_RESULT"],
    ["UNAUTHORIZED_MISSION", "UNAUTHORIZED_MISSION_COMPARABLE"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["RANKING_DRIFT", "RANKING_CHANGED_WITHOUT_EVIDENCE"],
    ["INCONSISTENT_EXPLANATION", "INCONSISTENT_EXPLANATION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["UNAUTHORIZED_SHARING", "UNAUTHORIZED_KNOWLEDGE_SHARING"],
    ["CROSS_TENANT_ATTEMPT", "CROSS_TENANT_COMPARISON_NOT_APPROVED"],
  ] as const)("rejects similarity analysis for %s", (scenario: CrossMissionSimilarityScenario, failure: CrossMissionSimilarityFailure) => {
    const result = establishCrossMissionSimilarityEngine({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.candidate_count).toBe(0);
    expect(replayCrossMissionSimilarityEngine(result)).toBe(true);
  });

  it("blocks cross-tenant comparison attempts by default", () => {
    const result = establishCrossMissionSimilarityEngine({ scenario: "CROSS_TENANT_ATTEMPT" });

    expect(result.candidate_eligibility.cross_tenant_blocked_by_default).toBe(true);
    expect(result.candidate_eligibility.tenant_authorization).toBe(false);
    expect(result.similarity_records.every((record) => record.comparison_scope === "CROSS_TENANT_BLOCKED")).toBe(true);
  });

  it("detects nested similarity record tampering", () => {
    const result = establishCrossMissionSimilarityEngine();
    const tampered = {
      ...result,
      similarity_records: [
        {
          ...result.similarity_records[0],
          tenant_id: "tenant-other",
        },
        ...result.similarity_records.slice(1),
      ],
    };

    expect(replayCrossMissionSimilarityEngine(tampered)).toBe(false);
  });
});
