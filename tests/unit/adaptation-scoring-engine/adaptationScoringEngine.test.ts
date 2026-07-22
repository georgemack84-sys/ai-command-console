import { describe, expect, it } from "vitest";
import {
  getAdaptationScoringFoundation,
  replayAdaptationScoring,
  scoreAdaptationProposals,
} from "@/services/adaptation-scoring-engine";
import type { AdaptationScoringFailure, AdaptationScoringScenario } from "@/types/adaptation-scoring-engine";

describe("Mission Control Phase 10.10.3 Adaptation Scoring Engine", () => {
  it("publishes the adaptation scoring engine contract", () => {
    const foundation = getAdaptationScoringFoundation();

    expect(foundation.adaptation_scoring_engine_version).toBe("adaptation-scoring-engine/v1");
    expect(foundation.api_surface.score_proposals).toBe("POST /adaptation-scoring-engine/score");
    expect(foundation.api_surface.approval_supported).toBe(false);
    expect(foundation.api_surface.implementation_supported).toBe(false);
    expect(foundation.supported_dimensions).toEqual([
      "BENEFIT",
      "RISK",
      "CONFIDENCE",
      "EVIDENCE",
      "OPERATOR",
      "GOVERNANCE",
      "REPLAY",
      "CERTIFICATION_COMPLEXITY",
      "ROLLBACK_READINESS",
      "EXPLAINABILITY",
    ]);
    expect(foundation.result.scoring_state).toBe("SCORED");
  });

  it("scores proposals deterministically", () => {
    const first = scoreAdaptationProposals({ scenario: "BASELINE" });
    const second = scoreAdaptationProposals({ scenario: "BASELINE" });

    expect(first.scored_proposals[0]?.overall_score).toBe(second.scored_proposals[0]?.overall_score);
    expect(first.scored_proposals[0]?.integrity_hash).toBe(second.scored_proposals[0]?.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("calculates every required scoring dimension", () => {
    const score = scoreAdaptationProposals().scored_proposals[0];

    expect(score?.dimension_scores.map((dimension) => dimension.dimension)).toEqual([
      "BENEFIT",
      "RISK",
      "CONFIDENCE",
      "EVIDENCE",
      "OPERATOR",
      "GOVERNANCE",
      "REPLAY",
      "CERTIFICATION_COMPLEXITY",
      "ROLLBACK_READINESS",
      "EXPLAINABILITY",
    ]);
    expect(score?.benefit_score).toBeGreaterThan(0);
    expect(score?.risk_score).toBeGreaterThan(0);
    expect(score?.confidence_score).toBeGreaterThan(0);
    expect(score?.evidence_score).toBeGreaterThan(0);
    expect(score?.operator_score).toBeGreaterThan(0);
    expect(score?.governance_score).toBeGreaterThan(0);
    expect(score?.replay_score).toBeGreaterThan(0);
    expect(score?.certification_complexity_score).toBeGreaterThan(0);
    expect(score?.rollback_readiness_score).toBeGreaterThan(0);
    expect(score?.explainability_score).toBeGreaterThan(0);
  });

  it("attaches complete explanations to every score", () => {
    const score = scoreAdaptationProposals().scored_proposals[0];

    expect(score?.overall_explanation.calculation_version).toBe("adaptation-scoring-rules/v1");
    expect(score?.overall_explanation.contributing_factors.length).toBeGreaterThan(0);
    expect(score?.overall_explanation.evidence_references.length).toBeGreaterThan(0);
    expect(score?.overall_explanation.replay_references.length).toBeGreaterThan(0);
    expect(score?.dimension_scores.every((dimension) => dimension.explanation.reasoning_summary.length > 0)).toBe(true);
  });

  it("responds deterministically to scoring characteristics", () => {
    const baseline = scoreAdaptationProposals();
    const highBenefit = scoreAdaptationProposals({ scenario: "HIGH_BENEFIT" });
    const highRisk = scoreAdaptationProposals({ scenario: "HIGH_RISK" });
    const lowEvidence = scoreAdaptationProposals({ scenario: "LOW_EVIDENCE" });
    const lowExplainability = scoreAdaptationProposals({ scenario: "LOW_EXPLAINABILITY" });

    expect(highBenefit.scored_proposals[0]?.benefit_score).toBeGreaterThan(baseline.scored_proposals[0]?.benefit_score ?? 0);
    expect(highRisk.scored_proposals[0]?.risk_score).toBeGreaterThan(baseline.scored_proposals[0]?.risk_score ?? 0);
    expect(lowEvidence.scored_proposals[0]?.evidence_score).toBeLessThan(baseline.scored_proposals[0]?.evidence_score ?? 100);
    expect(lowExplainability.scored_proposals[0]?.explainability_score).toBeLessThan(baseline.scored_proposals[0]?.explainability_score ?? 100);
  });

  it("publishes scoring observability metrics", () => {
    const result = scoreAdaptationProposals();

    expect(result.metrics.proposals_scored).toBe(1);
    expect(result.metrics.average_overall_score).toBe(result.scored_proposals[0]?.overall_score);
    expect(result.metrics.average_benefit_score).toBe(result.scored_proposals[0]?.benefit_score);
    expect(result.metrics.average_risk_score).toBe(result.scored_proposals[0]?.risk_score);
    expect(result.metrics.evidence_quality_distribution.length).toBe(1);
    expect(result.metrics.governance_sensitivity_distribution.length).toBe(1);
    expect(result.metrics.operator_usefulness_distribution.length).toBe(1);
    expect(result.metrics.explainability_distribution.length).toBe(1);
    expect(result.metrics.replay_completeness_rate).toBeGreaterThan(0);
    expect(result.metrics.scoring_latency_ms).toBe(0);
    expect(result.metrics.deterministic_replay_success_rate).toBe(1);
  });

  it("keeps scoring advisory-only and non-mutating", () => {
    const result = scoreAdaptationProposals();
    const score = result.scored_proposals[0];

    expect(result.governance_neutral).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.approves_proposals).toBe(false);
    expect(result.rejects_proposals).toBe(false);
    expect(result.implements_proposals).toBe(false);
    expect(result.suppresses_proposals).toBe(false);
    expect(result.prioritizes_proposals).toBe(false);
    expect(result.mutates_proposals).toBe(false);
    expect(score?.approves_proposal).toBe(false);
    expect(score?.implements_proposal).toBe(false);
    expect(score?.mutates_proposal).toBe(false);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["GOVERNANCE_ABSENT", "GOVERNANCE_ANALYSIS_ABSENT"],
    ["CONSTITUTIONAL_ABSENT", "CONSTITUTIONAL_ANALYSIS_ABSENT"],
    ["AUTHORITY_ABSENT", "AUTHORITY_ANALYSIS_ABSENT"],
    ["CONTRACT_INVALID", "PROPOSAL_CONTRACT_INVALID"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["NONDETERMINISTIC_SCORE", "NONDETERMINISTIC_SCORE_DETECTED"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["SUPPRESSION_ATTEMPT", "PROPOSAL_SUPPRESSION_ATTEMPT"],
    ["PRIORITIZATION_ATTEMPT", "PROPOSAL_PRIORITIZATION_ATTEMPT"],
    ["APPROVAL_ATTEMPT", "PROPOSAL_APPROVAL_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "PROPOSAL_IMPLEMENTATION_ATTEMPT"],
  ] as readonly [AdaptationScoringScenario, AdaptationScoringFailure][])("fails closed for %s", (scenario, failure) => {
    const result = scoreAdaptationProposals({ scenario });

    expect(result.scoring_state).not.toBe("SCORED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_proposals).toBe(false);
  });

  it("keeps missing evidence pending instead of scored", () => {
    const result = scoreAdaptationProposals({ scenario: "MISSING_EVIDENCE" });

    expect(result.scoring_state).toBe("PENDING_EVIDENCE");
    expect(result.evidence_based).toBe(false);
  });

  it("replays scoring and detects tampering", () => {
    const result = scoreAdaptationProposals();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationScoring(result)).toBe(true);
    expect(replayAdaptationScoring(tampered)).toBe(false);
  });
});
