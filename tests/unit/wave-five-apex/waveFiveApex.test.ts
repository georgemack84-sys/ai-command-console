import { describe, expect, it } from "vitest";

import { getWaveFiveApexBundle, replayWaveFiveApex, runWaveFiveApex, validateWaveFiveApex } from "@/services/wave-five-apex";
import type { WaveFiveApexFailure } from "@/types/wave-five-apex";

const conditionalFailures = ["PERFORMANCE_MEASUREMENT_MISSING", "PERFORMANCE_METRICS_INVALID", "BASELINES_MISSING", "PERFORMANCE_DASHBOARD_MISSING", "DASHBOARD_EVIDENCE_MISSING", "DASHBOARD_DRILLDOWN_MISSING", "HISTORICAL_COMPARISONS_INVALID", "HABIT_ANALYTICS_MISSING", "HABIT_TRACKING_INVALID", "PATTERN_DETECTION_INVALID", "PERSONAL_REVIEWS_MISSING", "REVIEW_CADENCE_INCOMPLETE", "REVIEW_EVIDENCE_MISSING", "EXPERIMENT_REGISTRY_MISSING", "EXPERIMENT_EVIDENCE_MISSING", "OUTCOME_INTELLIGENCE_MISSING", "LONGITUDINAL_ANALYSIS_INVALID", "RECOMMENDATION_ENGINE_MISSING", "RECOMMENDATION_EVIDENCE_MISSING", "CONFIDENCE_SCORES_MISSING", "GOAL_OPTIMIZATION_MISSING", "BOTTLENECK_DETECTION_INVALID", "CROSS_DOMAIN_CORRELATION_MISSING", "EVIDENCE_INTEGRATION_MISSING", "AUDIT_TRAIL_MISSING", "GOVERNANCE_VALIDATION_MISSING", "CATA_TRUST_EVALUATION_MISSING"] as const satisfies readonly WaveFiveApexFailure[];
const notQualifiedFailures = ["APEX_APPLICATION_INVALID", "W5_AURORA_INVALID", "TREND_DETECTION_NONDETERMINISTIC", "PERFORMANCE_HISTORY_MUTABLE", "HABIT_CORRELATION_NONDETERMINISTIC", "REVIEW_GENERATION_NONDETERMINISTIC", "EXPERIMENT_LIFECYCLE_INVALID", "EXPERIMENT_REPLAY_UNSUPPORTED", "OUTCOME_ATTRIBUTION_INVALID", "OUTCOME_RECOMMENDATIONS_NOT_EXPLAINABLE", "RECOMMENDATIONS_NOT_ADVISORY", "AUTONOMOUS_BEHAVIORAL_CHANGE_EXECUTED", "HUMAN_APPROVAL_BYPASSED", "COMPLETION_FORECASTING_NONDETERMINISTIC", "CORRELATIONS_NONREPRODUCIBLE", "PRIVACY_BOUNDARY_BREACH", "TENANT_ISOLATION_BREACH", "EVIDENCE_LINEAGE_INCOMPLETE", "CALCULATION_METHOD_MISSING", "APEX_EVIDENCE_MUTABLE", "APEX_REPLAY_DIVERGED", "POLICY_COMPLIANCE_BYPASSED", "DATA_OWNERSHIP_INVALID"] as const satisfies readonly WaveFiveApexFailure[];

describe("Wave 5.13 APEX Personal Performance Optimization", () => {
  it("publishes the APEX personal performance doctrine", () => {
    const bundle = getWaveFiveApexBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-apex/w5.13", advisory_only_recommendations: true, human_decision_authority_required: true, deterministic_calculations_required: true, evidence_backed_insights_required: true, privacy_first_required: true, autonomous_behavioral_change_prohibited: true, immutable_outcome_history_required: true, replay_required: true, qualification_gate: "W5.13 APEX Personal Performance Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Program 4 APEX plus W5 Aurora", () => {
    const first = runWaveFiveApex({ seed: "deterministic" });
    const second = runWaveFiveApex({ seed: "deterministic" });

    expect(first.apex_application_ref).toBe("apex/v4.16");
    expect(first.upstream_refs).toEqual(["apex/v4.16", "wave-five-aurora/w5.12", "wave-five-learning-stevn/w5.11", "wave-five-writing-publisher-os/w5.10", "wave-five-research/w5.9", "wave-five-health/w5.8", "wave-five-finance/w5.7", "wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2"]);
    expect(first.provides).toEqual(["performance-dashboard", "habit-analytics", "personal-reviews", "experiment-registry", "outcome-intelligence", "goal-intelligence", "pattern-discovery", "optimization-recommendations"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveApex(first).valid).toBe(true);
    expect(replayWaveFiveApex()).toBe(true);
  });

  it("measures performance consistently with immutable deterministic history", () => {
    const result = runWaveFiveApex();

    expect(result.performance_measurement).toMatchObject({ performance_areas: true, performance_metrics: true, kpi_definitions: true, baseline_measurements: true, trend_detection: true, progress_evaluation: true, performance_history: true, consistent_measurement: true, deterministic_calculations: true, immutable_history: true });
    expect(runWaveFiveApex({ scenario: "TREND_DETECTION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "PERFORMANCE_HISTORY_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("operates the dashboard and habit analytics deterministically", () => {
    const result = runWaveFiveApex();

    expect(result.dashboard_habits).toMatchObject({ daily_overview: true, weekly_summary: true, monthly_performance: true, goal_progress: true, productivity_trends: true, wellness_indicators: true, learning_progress: true, financial_progress: true, mission_progress: true, configurable_widgets: true, drill_down_analysis: true, historical_comparisons: true, evidence_navigation: true, habit_registry: true, habit_tracking: true, completion_rates: true, consistency_analysis: true, habit_strength: true, streak_analysis: true, habit_correlation: true, positive_habit_detection: true, negative_pattern_detection: true, long_term_consistency: true, seasonality: true, improvement_scoring: true, deterministic_analytics: true });
    expect(runWaveFiveApex({ scenario: "HABIT_CORRELATION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("generates reviews and manages replayable experiments", () => {
    const result = runWaveFiveApex();

    expect(result.reviews_experiments).toMatchObject({ daily_review: true, weekly_review: true, monthly_review: true, quarterly_review: true, annual_review: true, mission_review: true, achievements: true, completed_commitments: true, unfinished_work: true, lessons_learned: true, emerging_patterns: true, opportunity_identification: true, recommended_improvements: true, experiment_registry: true, hypotheses: true, objectives: true, durations: true, measurements: true, success_criteria: true, experiment_evidence: true, outcomes: true, experiment_lessons: true, templates: true, lifecycle_management: true, comparison_reports: true, experiment_history: true, replay_support: true });
    expect(runWaveFiveApex({ scenario: "REVIEW_GENERATION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "EXPERIMENT_REPLAY_UNSUPPORTED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("produces explainable advisory outcome intelligence without autonomous behavior change", () => {
    const result = runWaveFiveApex();

    expect(result.outcome_intelligence).toMatchObject({ outcome_evaluation: true, success_attribution: true, pattern_discovery: true, improvement_identification: true, longitudinal_analysis: true, opportunity_ranking: true, recommendation_generation: true, productivity_recommendations: true, focus_recommendations: true, health_recommendations: true, learning_recommendations: true, finance_recommendations: true, writing_recommendations: true, project_recommendations: true, habit_recommendations: true, mission_recommendations: true, evidence_backed: true, explainable: true, confidence_scored: true, non_autonomous: true, advisory_only: true });
    expect(runWaveFiveApex({ scenario: "AUTONOMOUS_BEHAVIORAL_CHANGE_EXECUTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "HUMAN_APPROVAL_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "RECOMMENDATIONS_NOT_ADVISORY" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("discovers goal patterns and cross-domain correlations reproducibly and privately", () => {
    const result = runWaveFiveApex();

    expect(result.goal_patterns_correlation).toMatchObject({ goal_progress_analysis: true, bottleneck_detection: true, momentum_analysis: true, completion_forecasting: true, improvement_suggestions: true, productivity_peaks: true, burnout_indicators: true, successful_routines: true, ineffective_habits: true, mission_acceleration_periods: true, optimal_work_windows: true, supporting_evidence: true, confidence: true, explanation: true, historical_validation: true, health_productivity: true, learning_mission_success: true, writing_knowledge_growth: true, finance_goal_progress: true, calendar_stress: true, habits_performance: true, projects_outcomes: true, mission_overall_improvement: true, correlations_reproducible: true, privacy_preserving: true });
    expect(runWaveFiveApex({ scenario: "CORRELATIONS_NONREPRODUCIBLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "PRIVACY_BOUNDARY_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("preserves evidence, audit, replay, policy, CATA trust, and human authority", () => {
    const result = runWaveFiveApex();

    expect(result.evidence_governance).toMatchObject({ evidence_sources: true, confidence_records: true, lineage: true, timestamps: true, calculation_methods: true, supporting_records: true, audit_trail: true, immutable_evidence: true, replay_compatible: true, recommendation_admissibility: true, privacy: true, policy_compliance: true, data_ownership: true, explainability: true, evidence_integrity: true, cata_trust_evaluation: true, constitutional_governance: true, human_decision_authority: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, apex_application_ready: true, aurora_ready: true, performance_measured_consistently: true, dashboard_evidence_backed: true, habit_analytics_deterministic: true, reviews_generated_for_all_cycles: true, experiment_registry_replayable: true, outcome_intelligence_explainable: true, correlations_reproducible_privacy_preserving: true, recommendations_advisory_only: true, governance_and_cata_enforced: true, evidence_lineage_immutable: true, replay_auditable: true });
    expect(runWaveFiveApex({ scenario: "APEX_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApex({ scenario: "POLICY_COMPLIANCE_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveApex({ scenario: failure });
    const validation = validateWaveFiveApex(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveApex({ scenario: failure });
    const validation = validateWaveFiveApex(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveApex({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveApex({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveApex({ scenario: "APEX_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveApex(notQualified).valid).toBe(false);
  });
});
