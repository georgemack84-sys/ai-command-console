import { describe, expect, it } from "vitest";
import {
  compareMissionStrategies,
  getMissionStrategyComparisonFoundation,
  replayMissionStrategyComparison,
} from "@/services/mission-strategy-comparison-engine";
import type { MissionStrategyComparisonFailure, MissionStrategyComparisonScenario } from "@/types/mission-strategy-comparison-engine";

describe("Mission Control Phase 10.5.4 Mission Strategy Comparison Engine", () => {
  it("publishes the mission strategy comparison foundation", () => {
    const foundation = getMissionStrategyComparisonFoundation();

    expect(foundation.mission_strategy_comparison_engine_version).toBe("mission-strategy-comparison-engine/v1");
    expect(foundation.api_surface.compare_strategies).toBe("POST /mission-strategy-comparison-engine/compare");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("compares mission strategies deterministically", () => {
    const first = compareMissionStrategies();
    const second = compareMissionStrategies();

    expect(first.comparisons[0].comparison_id).toBe(second.comparisons[0].comparison_id);
    expect(first.comparisons[0].comparative_effectiveness_score).toBe(second.comparisons[0].comparative_effectiveness_score);
    expect(first.comparisons[0].ranking_position).toBe(1);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported strategy comparison outcomes", () => {
    expect(compareMissionStrategies({ scenario: "BEST_PERFORMING" }).comparisons[0].strategy_classification).toBe("BEST_PERFORMING");
    expect(compareMissionStrategies({ scenario: "WEAKEST" }).comparisons[0].strategy_classification).toBe("WEAKEST");
    expect(compareMissionStrategies({ scenario: "REUSABLE" }).comparisons[0].strategy_classification).toBe("REUSABLE");
    expect(compareMissionStrategies({ scenario: "MISSION_SPECIFIC" }).comparisons[0].strategy_classification).toBe("MISSION_SPECIFIC");
    expect(compareMissionStrategies({ scenario: "OBSOLETE" }).comparisons[0].strategy_classification).toBe("OBSOLETE");
  });

  it("accepts only identical and high similarity for certified comparison", () => {
    expect(compareMissionStrategies({ scenario: "IDENTICAL_SIMILARITY" }).validation.certified).toBe(true);
    expect(compareMissionStrategies({ scenario: "HIGH_SIMILARITY" }).validation.certified).toBe(true);
    expect(compareMissionStrategies({ scenario: "MODERATE_SIMILARITY" }).validation.failures).toContain("MISSION_SIMILARITY_BELOW_THRESHOLD");
    expect(compareMissionStrategies({ scenario: "LOW_SIMILARITY" }).validation.failures).toContain("MISSION_SIMILARITY_BELOW_THRESHOLD");
    expect(compareMissionStrategies({ scenario: "NO_SIMILARITY" }).validation.failures).toContain("MISSION_SIMILARITY_BELOW_THRESHOLD");
  });

  it("attaches outcome, pattern, evidence, governance, and replay lineage", () => {
    const comparison = compareMissionStrategies().comparisons[0];

    expect(comparison.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(comparison.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(comparison.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(comparison.supporting_governance_refs.length).toBeGreaterThan(0);
    expect(comparison.supporting_replay_refs.length).toBeGreaterThan(0);
  });

  it("keeps comparisons advisory-only and does not generate proposals", () => {
    const result = compareMissionStrategies();
    const comparison = result.comparisons[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.generates_proposals).toBe(false);
    expect(comparison.advisory_only).toBe(true);
    expect(comparison.mutates_strategy).toBe(false);
    expect(comparison.generates_proposals).toBe(false);
  });

  it("records immutable append-only comparison registry entries", () => {
    const result = compareMissionStrategies();
    const comparison = result.comparisons[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.comparison_refs).toEqual([comparison.comparison_id]);
    expect(result.registry.ranking_index).toEqual([comparison.comparison_id]);
    expect(result.registry.classification_index[comparison.strategy_classification]).toEqual([comparison.comparison_id]);
  });

  it("replays mission strategy comparison analysis", () => {
    const result = compareMissionStrategies();

    expect(replayMissionStrategyComparison(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_CONTRACT", "STRATEGY_CONTRACT_UNCERTIFIED"],
    ["MODERATE_SIMILARITY", "MISSION_SIMILARITY_BELOW_THRESHOLD"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["REPLAY_FAILURE", "REPLAY_VERIFICATION_FAILED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["NONDETERMINISTIC_RANKING", "RANKING_NONDETERMINISTIC"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["INCONSISTENT_CLASSIFICATION", "CLASSIFICATION_INCONSISTENT"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["STRATEGY_MUTATION", "STRATEGY_MUTATION_DETECTED"],
    ["PROPOSAL_GENERATION", "PROPOSAL_GENERATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [MissionStrategyComparisonScenario, MissionStrategyComparisonFailure][])("fails closed for %s", (scenario, failure) => {
    const result = compareMissionStrategies({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.generates_proposals).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = compareMissionStrategies({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects mission strategy comparison tampering during replay", () => {
    const result = compareMissionStrategies();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayMissionStrategyComparison(tampered)).toBe(false);
  });
});
