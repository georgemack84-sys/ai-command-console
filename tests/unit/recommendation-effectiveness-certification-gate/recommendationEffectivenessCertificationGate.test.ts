import { describe, expect, it } from "vitest";
import {
  certifyRecommendationEffectiveness,
  computeRecommendationEffectivenessCertificationHash,
  getRecommendationEffectivenessCertificationFoundation,
  RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS,
  replayRecommendationEffectivenessCertification,
} from "@/services/recommendation-effectiveness-certification-gate";
import type { RecommendationEffectivenessCertificationFailure, RecommendationEffectivenessCertificationScenario } from "@/types/recommendation-effectiveness-certification-gate";

describe("Mission Control Phase 10.3.10 Recommendation Effectiveness Certification Gate", () => {
  it("publishes the recommendation effectiveness certification foundation", () => {
    const foundation = getRecommendationEffectivenessCertificationFoundation();

    expect(foundation.recommendation_effectiveness_certification_gate_version).toBe("recommendation-effectiveness-certification-gate/v1");
    expect(foundation.certified_subsystems).toEqual(RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS);
    expect(foundation.api_surface.certify_architecture).toBe("POST /recommendation-effectiveness-certification-gate/certify");
    expect(foundation.result.certification.certification_result).toBe("PASS");
  });

  it("certifies all Phase 10.3 subsystems without exclusion", () => {
    const result = certifyRecommendationEffectiveness();

    expect(result.certification.subsystem_results.map((entry) => entry.subsystem)).toEqual(RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS);
    expect(result.certification.subsystem_results.every((entry) => entry.result === "PASS")).toBe(true);
    expect(result.certification.progression_to_phase_10_4_authorized).toBe(true);
  });

  it("preserves advisory-only, operator-controlled, governance-controlled, non-adaptive boundaries", () => {
    const result = certifyRecommendationEffectiveness();

    expect(result.advisory_only).toBe(true);
    expect(result.operator_controlled).toBe(true);
    expect(result.governance_controlled).toBe(true);
    expect(result.constitutionally_constrained).toBe(true);
    expect(result.adaptive_learning).toBe(false);
    expect(result.autonomous_optimization).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.autonomous_optimization_supported).toBe(false);
  });

  it("validates replay, governance, constitutional, operator, adaptive-boundary, and readiness domains", () => {
    const result = certifyRecommendationEffectiveness();

    expect(result.certification.replay_validation.passed).toBe(true);
    expect(result.certification.governance_validation.passed).toBe(true);
    expect(result.certification.constitutional_validation.passed).toBe(true);
    expect(result.certification.operator_validation.passed).toBe(true);
    expect(result.certification.adaptive_boundary_validation.passed).toBe(true);
    expect(result.certification.production_readiness.passed).toBe(true);
  });

  it("records an immutable append-only certification ledger entry", () => {
    const result = certifyRecommendationEffectiveness();

    expect(result.certification_ledger_entry.append_only).toBe(true);
    expect(result.certification_ledger_entry.deleted).toBe(false);
    expect(result.certification_ledger_entry.performance_record_ref).toBe(result.performance_ledger.performance_record.performance_record_id);
    expect(result.certification_ledger_entry.subsystem_refs).toEqual(RECOMMENDATION_EFFECTIVENESS_SUBSYSTEMS);
  });

  it("creates stable certification hashes and replay output", () => {
    const result = certifyRecommendationEffectiveness();

    expect(computeRecommendationEffectivenessCertificationHash(result.certification)).toBe(result.certification.integrity_hash);
    expect(replayRecommendationEffectivenessCertification(result)).toBe(true);
  });

  it("emits conditional pass for non-blocking documentation gaps without Phase 10.4 authorization", () => {
    const result = certifyRecommendationEffectiveness({ scenario: "CONDITIONAL_DOCUMENTATION_GAP" });

    expect(result.certification.certification_result).toBe("CONDITIONAL_PASS");
    expect(result.certification.progression_to_phase_10_4_authorized).toBe(false);
    expect(result.certification.corrective_actions.length).toBeGreaterThan(0);
  });

  it.each([
    ["SUBSYSTEM_EXCLUDED", "SUBSYSTEM_EXCLUDED"],
    ["NONDETERMINISTIC_SCORING", "NONDETERMINISTIC_SCORING_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["LINEAGE_BREAK", "RECOMMENDATION_LINEAGE_INCOMPLETE"],
    ["EVIDENCE_TRACEABILITY_GAP", "EVIDENCE_TRACEABILITY_INCOMPLETE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["OPERATOR_AUTHORITY_VIOLATION", "OPERATOR_AUTHORITY_VIOLATED"],
    ["ADVISORY_BOUNDARY_VIOLATION", "ADVISORY_ONLY_BOUNDARY_VIOLATED"],
    ["AUTOMATIC_LEARNING", "AUTOMATIC_LEARNING_DETECTED"],
    ["AUTONOMOUS_OPTIMIZATION", "AUTONOMOUS_OPTIMIZATION_DETECTED"],
    ["HIDDEN_EVALUATION_LOGIC", "HIDDEN_EVALUATION_LOGIC_DETECTED"],
    ["HIDDEN_SCORING_HEURISTICS", "HIDDEN_SCORING_HEURISTICS_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["INTEGRITY_FAILURE", "CRYPTOGRAPHIC_INTEGRITY_FAILED"],
    ["PRODUCTION_READINESS_GAP", "PRODUCTION_READINESS_INCOMPLETE"],
  ] as readonly [RecommendationEffectivenessCertificationScenario, RecommendationEffectivenessCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = certifyRecommendationEffectiveness({ scenario });

    expect(result.certification.certification_result).toBe("FAIL");
    expect(result.failures).toContain(failure);
    expect(result.certification.progression_to_phase_10_4_authorized).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
  });

  it("detects certification tampering during replay", () => {
    const result = certifyRecommendationEffectiveness();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationEffectivenessCertification(tampered)).toBe(false);
  });
});
