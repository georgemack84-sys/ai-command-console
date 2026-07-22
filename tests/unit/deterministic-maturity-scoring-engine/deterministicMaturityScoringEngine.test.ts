import { describe, expect, it } from "vitest";
import {
  buildDeterministicMaturityScoringObservabilitySurface,
  getDeterministicMaturityScoringEngineBundle,
  getMaturityWeightingProfile,
  listMaturityScoringLedger,
  listNormalizedMaturityScores,
  scoreMaturityDeterministically,
  validateDeterministicMaturityScoring,
} from "@/services/deterministic-maturity-scoring-engine";
import type { DeterministicMaturityScoringFailure, DeterministicMaturityScoringScenario } from "@/types/deterministic-maturity-scoring-engine";

describe("deterministic maturity scoring engine", () => {
  it("publishes the deterministic advisory-only scoring bundle", () => {
    const bundle = getDeterministicMaturityScoringEngineBundle();

    expect(bundle.doctrine.engine_version).toBe("deterministic-maturity-scoring-engine/v8ALT.11.3");
    expect(bundle.doctrine.final_state).toBe("DETERMINISTIC_MATURITY_SCORING_ENGINE_READY");
    expect(bundle.doctrine.canonical_domain_count).toBe(10);
    expect(bundle.repository.final_state).toBe("DETERMINISTIC_MATURITY_SCORING_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.maturity_advancement_authorized).toBe(false);
    expect(bundle.repository.production_certification_authorized).toBe(false);
    expect(bundle.repository.governance_modification_authorized).toBe(false);
    expect(bundle.repository.authority_change_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("scores only the ten canonical evaluated domains", () => {
    const repository = scoreMaturityDeterministically();
    const domains = repository.contributions.map((contribution) => contribution.domain);

    expect(repository.evaluation.reports).toHaveLength(10);
    expect(repository.normalized_scores).toHaveLength(10);
    expect(repository.contributions).toHaveLength(10);
    expect(domains).toEqual([
      "CONSTITUTIONAL_COMPLIANCE",
      "GOVERNANCE_COMPLIANCE",
      "AUTHORITY_ENFORCEMENT",
      "PLANNING_INTELLIGENCE",
      "EXECUTION_INTELLIGENCE",
      "REPLAY_INTEGRITY",
      "EXPLAINABILITY",
      "RESILIENCE",
      "VISIBILITY",
      "CERTIFICATION_READINESS",
    ]);
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.result.scoring_explanation).toContain("Runtime assurance is represented inside execution intelligence, resilience, and visibility.");
  });

  it("applies approved weights, normalization, aggregation, confidence, and readiness", () => {
    const repository = scoreMaturityDeterministically();

    expect(repository.weighting_profile?.approved).toBe(true);
    expect(repository.weighting_profile?.immutable_during_assessment).toBe(true);
    expect(repository.weighting_profile?.weights.reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(1);
    expect(repository.normalized_scores.every((score) => score.normalized_score === 92)).toBe(true);
    expect(repository.result.overall_maturity_score).toBe(92);
    expect(repository.result.maturity_classification).toBe("CERTIFIED");
    expect(repository.result.confidence_score).toBe(94);
    expect(repository.result.confidence_classification).toBe("CERTIFIED");
    expect(repository.result.readiness_score).toBe(90);
    expect(repository.result.readiness_classification).toBe("CERTIFICATION_READY");
    expect(repository.ledger).toHaveLength(1);
    expect(repository.failures).toEqual([]);
  });

  it("keeps scoring deterministic and exposes slices", () => {
    const first = scoreMaturityDeterministically();
    const second = scoreMaturityDeterministically();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.result.integrity_hash).toBe(first.result.integrity_hash);
    expect(getMaturityWeightingProfile()?.weights).toHaveLength(10);
    expect(listNormalizedMaturityScores()).toHaveLength(10);
    expect(listMaturityScoringLedger()).toHaveLength(1);
  });

  it.each([
    ["MISSING_WEIGHTING_PROFILE", "WEIGHTING_PROFILE_MISSING"],
    ["WEIGHTING_PROFILE_MODIFIED", "WEIGHTING_PROFILE_MODIFIED_DURING_ASSESSMENT"],
    ["INCONSISTENT_NORMALIZATION_RULES", "NORMALIZATION_RULES_INCONSISTENT"],
    ["AGGREGATE_REPLAY_MISMATCH", "AGGREGATE_REPLAY_MISMATCHED"],
    ["NONDETERMINISTIC_CONFIDENCE", "CONFIDENCE_CALCULATION_NONDETERMINISTIC"],
    ["VARIABLE_READINESS", "READINESS_CALCULATION_VARIABLE"],
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["HIDDEN_SCORING_LOGIC", "HIDDEN_SCORING_LOGIC_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [DeterministicMaturityScoringScenario, DeterministicMaturityScoringFailure][])("invalidates %s", (scenario, failure) => {
    const repository = scoreMaturityDeterministically({ scenario });
    const validation = validateDeterministicMaturityScoring(repository);

    expect(repository.final_state).toBe("DETERMINISTIC_MATURITY_SCORING_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.maturity_advancement_authorized).toBe(false);
    expect(repository.production_certification_authorized).toBe(false);
    expect(repository.execution_behavior_change_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "MISSING_WEIGHTING_PROFILE" })).weighting_profile_present).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "WEIGHTING_PROFILE_MODIFIED" })).weighting_profile_immutable).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "INCONSISTENT_NORMALIZATION_RULES" })).normalization_consistent).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "AGGREGATE_REPLAY_MISMATCH" })).aggregate_replay_verified).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "NONDETERMINISTIC_CONFIDENCE" })).confidence_deterministic).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "VARIABLE_READINESS" })).readiness_deterministic).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "GOVERNANCE_VALIDATION_FAILURE" })).governance_validated).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "CONSTITUTIONAL_VALIDATION_FAILURE" })).constitutional_validated).toBe(false);
    expect(validateDeterministicMaturityScoring(scoreMaturityDeterministically({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without execution authority", () => {
    const surface = buildDeterministicMaturityScoringObservabilitySurface(scoreMaturityDeterministically({ scenario: "MISSING_WEIGHTING_PROFILE" }));

    expect(surface.final_state).toBe("DETERMINISTIC_MATURITY_SCORING_FAILED");
    expect(surface.domain_count).toBe(10);
    expect(surface.normalized_score_count).toBe(10);
    expect(surface.contribution_count).toBe(10);
    expect(surface.ledger_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_behavior_change_authorized).toBe(false);
  });
});
