import { describe, expect, it } from "vitest";
import {
  computePatternScoreHash,
  getPatternScoringFoundation,
  replayPatternScoring,
  scorePatternIntelligence,
} from "@/services/pattern-confidence-strategic-scoring";
import type { PatternScoringFailure, PatternScoringScenario } from "@/types/pattern-confidence-strategic-scoring";

describe("Mission Control Phase 10.4.5 Pattern Confidence & Strategic Scoring", () => {
  it("publishes the pattern scoring foundation", () => {
    const foundation = getPatternScoringFoundation();

    expect(foundation.pattern_confidence_strategic_scoring_version).toBe("pattern-confidence-strategic-scoring/v1");
    expect(foundation.api_surface.score_pattern).toBe("POST /pattern-confidence-strategic-scoring/score");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("scores validated pattern intelligence deterministically", () => {
    const first = scorePatternIntelligence();
    const second = scorePatternIntelligence();

    expect(first.score_records[0].composite_pattern_score).toBe(second.score_records[0].composite_pattern_score);
    expect(first.score_records[0].confidence_score).toBe(second.score_records[0].confidence_score);
    expect(first.score_records[0].rating).toBe(second.score_records[0].rating);
  });

  it("calculates confidence, recurrence, evidence, governance, mission, strategic, operator, and risk dimensions", () => {
    const result = scorePatternIntelligence();
    const record = result.score_records[0];

    expect(record.confidence_score).toBeGreaterThan(0);
    expect(record.recurrence_strength).toBeGreaterThan(0);
    expect(record.evidence_quality).toBeGreaterThan(0);
    expect(record.governance_importance).toBeGreaterThan(0);
    expect(record.mission_importance).toBeGreaterThan(0);
    expect(record.strategic_importance).toBeGreaterThan(0);
    expect(record.operator_importance).toBeGreaterThan(0);
    expect(record.risk_relevance).toBeGreaterThan(0);
  });

  it("keeps scoring advisory-only and non-mutating", () => {
    const result = scorePatternIntelligence();
    const record = result.score_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.adaptive_behavior).toBe(false);
    expect(result.autonomous_optimization).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_priorities).toBe(false);
    expect(result.modifies_governance).toBe(false);
    expect(record.advisory_only).toBe(true);
    expect(record.modifies_priorities).toBe(false);
  });

  it("scores weak patterns lower without rejecting technical scoring", () => {
    const strong = scorePatternIntelligence();
    const weak = scorePatternIntelligence({ scenario: "WEAK_PATTERN" });

    expect(weak.score_records[0].composite_pattern_score).toBeLessThan(strong.score_records[0].composite_pattern_score);
    expect(weak.score_records[0].rating).not.toBe("REJECTED");
  });

  it("records immutable append-only scoring registry entries", () => {
    const result = scorePatternIntelligence();
    const record = result.score_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.score_refs).toEqual([record.score_id]);
    expect(result.registry.pattern_refs).toEqual([record.pattern_id]);
  });

  it("creates stable score hashes and replay output", () => {
    const result = scorePatternIntelligence();
    const record = result.score_records[0];

    expect(computePatternScoreHash(record)).toBe(record.integrity_hash);
    expect(replayPatternScoring(result)).toBe(true);
  });

  it("validates deterministic weighting, explainability, tenant isolation, governance, replay, and integrity", () => {
    const result = scorePatternIntelligence();

    expect(result.validation.deterministic_weighting).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.governance_referenced).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_VALIDATION", "VALIDATED_PATTERN_MISSING"],
    ["REJECTED_PATTERN", "PATTERN_VALIDATION_REJECTED"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_RECURRENCE", "RECURRENCE_CALCULATION_UNAVAILABLE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_RULE_VERSION", "SCORING_RULE_VERSION_UNAVAILABLE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC_WEIGHTING", "NONDETERMINISTIC_WEIGHTING_DETECTED"],
    ["AUTONOMOUS_OPTIMIZATION", "AUTONOMOUS_OPTIMIZATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternScoringScenario, PatternScoringFailure][])("fails closed for %s", (scenario, failure) => {
    const result = scorePatternIntelligence({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_optimization).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = scorePatternIntelligence({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects scoring tampering during replay", () => {
    const result = scorePatternIntelligence();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternScoring(tampered)).toBe(false);
  });
});
