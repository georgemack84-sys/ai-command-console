import { describe, expect, it } from "vitest";

import { getMissionRecommendationIntelligenceBundle, replayMissionRecommendationIntelligence, runMissionRecommendationIntelligence, validateMissionRecommendationIntelligence } from "@/services/mission-recommendation-intelligence";
import type { MissionRecommendationFailure } from "@/types/mission-recommendation-intelligence";

const conditionalFailures = ["RECOMMENDATION_ENGINE_MISSING", "RECOMMENDATION_PRIORITIZATION_MISSING", "RECOMMENDATION_SCORING_MISSING", "RECOMMENDATION_RANKING_MISSING", "RECOMMENDATION_REFINEMENT_MISSING", "RECOMMENDATION_SUPPRESSION_MISSING", "RECOMMENDATION_LIFECYCLE_MISSING", "RECOMMENDATION_ANALYSIS_MISSING", "MISSION_OBJECTIVE_ANALYSIS_MISSING", "RISK_REDUCTION_ANALYSIS_MISSING", "RESOURCE_OPTIMIZATION_MISSING", "TIMELINE_OPTIMIZATION_MISSING", "DEPENDENCY_OPTIMIZATION_MISSING", "EFFICIENCY_ANALYSIS_MISSING", "CONFIDENCE_ESTIMATION_MISSING", "RECOMMENDATION_EXPLANATION_MISSING", "SUPPORTING_EVIDENCE_MISSING", "ASSUMPTIONS_MISSING", "CONSTRAINTS_MISSING", "BENEFITS_MISSING", "DRAWBACKS_MISSING", "ALTERNATIVES_MISSING", "CONFIDENCE_SCORE_MISSING", "RECOMMENDATION_GOVERNANCE_MISSING", "RECOMMENDATION_PRIORITIZATION_NOT_TRANSPARENT", "RECOMMENDATION_CONFIDENCE_MISSING", "RECOMMENDATION_LIFECYCLE_NOT_GOVERNED", "RECOMMENDATION_FEED_MISSING", "RECOMMENDATION_REPORTS_MISSING", "RECOMMENDATION_EVIDENCE_MISSING", "RECOMMENDATION_APIS_MISSING"] as const satisfies readonly MissionRecommendationFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_7_SIMULATION_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "RECOMMENDATION_GENERATION_NON_DETERMINISTIC", "CONSTITUTIONAL_VALIDATION_FAILED", "POLICY_VALIDATION_FAILED", "AUTHORITY_VALIDATION_FAILED", "SAFETY_VALIDATION_FAILED", "EVIDENCE_COMPLETENESS_FAILED", "EXPLAINABILITY_VALIDATION_FAILED", "CONFIDENCE_INPUTS_INCOMPLETE", "RECOMMENDATION_EVIDENCE_MUTABLE", "RECOMMENDATION_LINEAGE_INCOMPLETE", "AUTONOMOUS_EXECUTION_ATTEMPTED", "MISSION_MUTATION_ATTEMPTED", "OPERATOR_AUTHORITY_BYPASSED", "GOVERNANCE_OVERRIDE_ATTEMPTED", "UNCERTAINTY_CONCEALED", "SUPPORTING_EVIDENCE_REMOVED"] as const satisfies readonly MissionRecommendationFailure[];

describe("Mission Recommendation Intelligence MC-9", () => {
  it("publishes the MC-9 recommendation intelligence doctrine", () => {
    const bundle = getMissionRecommendationIntelligenceBundle();

    expect(bundle.doctrine).toMatchObject({ version: "mission-recommendation-intelligence/mc-9", owns_recommendation_engine: true, owns_recommendation_analysis: true, owns_recommendation_explanation: true, owns_recommendation_governance: true, owns_recommendation_prioritization_confidence_lifecycle: true, consumes_mc_1_through_mc_8: true, recommendations_are_advisory_only: true, autonomous_execution_prohibited: true, governance_validation_required_before_publication: true, qualification_gate: "Mission Recommendation Intelligence Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1 through MC-8", () => {
    const first = runMissionRecommendationIntelligence({ seed: "deterministic" });
    const second = runMissionRecommendationIntelligence({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMissionRecommendationIntelligence(first).valid).toBe(true);
    expect(replayMissionRecommendationIntelligence()).toBe(true);
  });

  it("generates ranked recommendations without action execution", () => {
    const result = runMissionRecommendationIntelligence();

    expect(result.engine).toMatchObject({ generation: true, prioritization: true, scoring: true, ranking: true, refinement: true, suppression: true, lifecycle: true, deterministic_generation: true, advisory_only: true, no_action_execution: true });
    expect(result.readiness.advisory_only).toBe(true);
    expect(result.readiness.no_execution).toBe(true);
    expect(result.readiness.no_state_mutation).toBe(true);
  });

  it("analyzes mission value and explains recommendations completely", () => {
    const result = runMissionRecommendationIntelligence();

    expect(result.analysis).toMatchObject({ mission_objectives: true, risk_reduction: true, resource_optimization: true, timeline_optimization: true, dependency_optimization: true, operational_efficiency: true, confidence_estimation: true });
    expect(result.explanation).toMatchObject({ supporting_evidence: true, assumptions: true, constraints: true, expected_benefits: true, potential_drawbacks: true, alternative_recommendations: true, confidence_score: true, auditable: true });
  });

  it("enforces governance before publication", () => {
    const result = runMissionRecommendationIntelligence();

    expect(result.governance).toMatchObject({ constitutional_validation: true, policy_evaluation: true, authority_validation: true, safety_verification: true, evidence_completeness: true, explainability_verification: true, publication_gate: true, failed_recommendations_suppressed: true });
    expect(result.readiness.governance_enforced).toBe(true);
  });

  it("prioritizes and scores recommendations transparently", () => {
    const result = runMissionRecommendationIntelligence();

    expect(result.prioritization).toMatchObject({ mission_objectives: true, risk_exposure: true, resource_availability: true, mission_urgency: true, portfolio_priorities: true, organizational_policy: true, strategic_alignment: true, transparent_ranking: true });
    expect(result.confidence).toMatchObject({ evidence_quality: true, evidence_completeness: true, simulation_agreement: true, replay_agreement: true, digital_twin_consistency: true, risk_certainty: true, decision_support_confidence: true, confidence: 0.89 });
  });

  it("maintains governed lifecycle state, feed, reports, evidence, and APIs", () => {
    const result = runMissionRecommendationIntelligence();

    expect(result.lifecycle.states).toEqual(["GENERATED", "VALIDATED", "PUBLISHED", "UPDATED", "SUPERSEDED", "WITHDRAWN", "ARCHIVED"]);
    expect(result.lifecycle).toMatchObject({ generated: true, validated: true, published: true, updated: true, superseded: true, withdrawn: true, archived: true, governed_state_transitions: true });
    expect(result.feed).toMatchObject({ priority: "HIGH", confidence: 0.89, supporting_evidence: true, risk_summary: true, expected_impact: true, status: "PUBLISHED", continuously_updated: true, advisory_only: true });
    expect(result.reports).toMatchObject({ recommendation_summary: true, evidence_references: true, simulation_references: true, risk_analysis: true, decision_justification: true, expected_outcomes: true, alternative_options: true, immutable_audit_record: true });
    expect(result.evidence).toMatchObject({ recommendation_lineage: true, evidence_graph: true, supporting_artifacts: true, evaluation_history: true, governance_decisions: true, confidence_calculations: true, immutable: true, complete_lineage: true });
    expect(result.apis).toMatchObject({ recommendation_api: true, analysis_api: true, explanation_api: true, governance_api: true, prioritization_api: true, confidence_api: true, lifecycle_api: true, feed_api: true, report_api: true, evidence_api: true, stable: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runMissionRecommendationIntelligence({ scenario: failure });
    const validation = validateMissionRecommendationIntelligence(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runMissionRecommendationIntelligence({ scenario: failure });
    const validation = validateMissionRecommendationIntelligence(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runMissionRecommendationIntelligence({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runMissionRecommendationIntelligence({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runMissionRecommendationIntelligence({ scenario: "MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateMissionRecommendationIntelligence(notQualified).valid).toBe(false);
  });
});
