import { describe, expect, it } from "vitest";

import { getWaveFiveHealthBundle, replayWaveFiveHealth, runWaveFiveHealth, validateWaveFiveHealth } from "@/services/wave-five-health";
import type { WaveFiveHealthFailure } from "@/types/wave-five-health";

const conditionalFailures = ["HEALTH_PROFILE_MISSING", "HEALTH_PROFILE_LINEAGE_INCOMPLETE", "HEALTH_PROFILE_VERSIONING_MISSING", "WELLNESS_TRACKING_MISSING", "WELLNESS_TRENDS_INVALID", "MEASUREMENT_EVIDENCE_MISSING", "HEALTH_DASHBOARD_MISSING", "DASHBOARD_EVIDENCE_NAVIGATION_MISSING", "DASHBOARD_TRENDS_INVALID", "HEALTH_GOALS_MISSING", "GOAL_REVIEWS_NOT_EVIDENCE_BACKED", "RECOMMENDATION_ENGINE_MISSING", "RECOMMENDATION_CONFIDENCE_MISSING", "ESCALATION_FRAMEWORK_MISSING", "ESCALATION_EVIDENCE_MISSING", "ESCALATION_HISTORY_MISSING", "HEALTH_EVIDENCE_INTEGRATION_MISSING", "EVIDENCE_INGESTION_NONDETERMINISTIC", "SOURCE_PROVENANCE_MISSING", "EVIDENCE_NORMALIZATION_INVALID", "HEALTH_GOVERNANCE_MISSING"] as const satisfies readonly WaveFiveHealthFailure[];
const notQualifiedFailures = ["W5_TASKS_COMMITMENTS_INVALID", "HEALTH_IDENTITY_NONDETERMINISTIC", "WELLNESS_HISTORY_NONDETERMINISTIC", "GOAL_PROGRESS_NONDETERMINISTIC", "RECOMMENDATIONS_NOT_EXPLAINABLE", "RECOMMENDATIONS_NOT_EVIDENCE_BACKED", "ESCALATION_NONDETERMINISTIC", "CONSENT_NOT_ENFORCED", "PRIVACY_CONTROLS_MISSING", "ACCESS_CONTROL_MISSING", "AUDIT_LINEAGE_INCOMPLETE", "TENANT_ISOLATION_BREACH", "HEALTH_EVIDENCE_MUTABLE", "REPLAY_DIVERGED", "DIAGNOSTIC_BEHAVIOR_DETECTED", "TREATMENT_BEHAVIOR_DETECTED", "PRESCRIPTION_BEHAVIOR_DETECTED", "MEDICAL_DECISION_BEHAVIOR_DETECTED", "EMERGENCY_DETERMINATION_DETECTED", "MEDICAL_CERTAINTY_CLAIMED"] as const satisfies readonly WaveFiveHealthFailure[];

describe("Wave 5.8 Health", () => {
  it("publishes the health doctrine", () => {
    const bundle = getWaveFiveHealthBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-health/w5.8", health_guidance_advisory_only: true, diagnosis_prohibited: true, treatment_prescription_prohibited: true, human_medical_authority_preserved: true, evidence_explainability_required: true, privacy_consent_audit_required: true, qualification_gate: "W5.8 Health Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the personal applications stack through W5.5", () => {
    const first = runWaveFiveHealth({ seed: "deterministic" });
    const second = runWaveFiveHealth({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1"]);
    expect(first.provides).toEqual(["health-service", "health-registry", "wellness-tracking-engine", "recommendation-engine", "goal-management-service", "health-dashboard", "escalation-service", "health-evidence-registry", "health-apis", "health-governance-policies"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveHealth(first).valid).toBe(true);
    expect(replayWaveFiveHealth()).toBe(true);
  });

  it("operates canonical health profile and deterministic wellness tracking", () => {
    const result = runWaveFiveHealth();

    expect(result.profile).toMatchObject({ health_identity: true, demographics: true, wellness_preferences: true, lifestyle_profile: true, medical_information_references: true, allergies: true, medications_reference: true, health_history_references: true, care_team_references: true, health_metadata: true, canonical_health_record: true, profile_versioning: true, evidence_linkage: true, immutable_lineage: true, identity_deterministic: true });
    expect(result.tracking).toMatchObject({ weight_tracking: true, nutrition_tracking: true, activity_tracking: true, sleep_tracking: true, hydration_tracking: true, mood_tracking: true, stress_tracking: true, habit_tracking: true, wellness_journals: true, measurement_history: true, longitudinal_tracking: true, trend_generation: true, evidence_capture: true, historical_comparisons: true, deterministic_history: true });
    expect(runWaveFiveHealth({ scenario: "HEALTH_IDENTITY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "WELLNESS_HISTORY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("provides dashboard visibility and measurable health goals", () => {
    const result = runWaveFiveHealth();

    expect(result.dashboard).toMatchObject({ wellness_summary: true, progress_dashboard: true, goal_progress: true, habit_dashboard: true, trend_analysis: true, risk_indicators: true, wellness_timeline: true, achievement_history: true, unified_health_view: true, historical_visualization: true, progress_reporting: true, evidence_navigation: true, trends_validated: true });
    expect(result.goals).toMatchObject({ goal_registry: true, goal_planning: true, milestones: true, progress_monitoring: true, goal_reviews: true, goal_adjustments: true, habit_goals: true, wellness_targets: true, measurable_goals: true, deterministic_progress_calculation: true, milestone_evaluation: true, evidence_backed_reviews: true });
    expect(runWaveFiveHealth({ scenario: "GOAL_PROGRESS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps wellness recommendations advisory, explainable, and non-medical", () => {
    const result = runWaveFiveHealth();

    expect(result.recommendations).toMatchObject({ wellness_guidance: true, nutrition_suggestions: true, activity_suggestions: true, recovery_suggestions: true, habit_recommendations: true, educational_guidance: true, evidence_mapping: true, recommendation_history: true, advisory_only: true, explainable_outputs: true, confidence_reporting: true, constitutional_safeguards: true, no_diagnosis: true, no_treatment: true, no_prescription: true, no_medical_decision: true, no_medical_certainty: true });
    expect(runWaveFiveHealth({ scenario: "RECOMMENDATIONS_NOT_EXPLAINABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "DIAGNOSTIC_BEHAVIOR_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "TREATMENT_BEHAVIOR_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "PRESCRIPTION_BEHAVIOR_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "MEDICAL_CERTAINTY_CLAIMED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("routes elevated concerns through deterministic evidence-backed escalation", () => {
    const result = runWaveFiveHealth();

    expect(result.escalation).toMatchObject({ risk_thresholds: true, escalation_rules: true, warning_detection: true, emergency_recommendation_rules: true, healthcare_referral_guidance: true, escalation_evidence: true, escalation_history: true, deterministic_escalation: true, evidence_backed_alerts: true, operator_visibility: true, constitutional_restrictions: true, no_emergency_determination: true });
    expect(runWaveFiveHealth({ scenario: "ESCALATION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "EMERGENCY_DETERMINATION_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("enforces health evidence, privacy, consent, audit, and tenant isolation", () => {
    const result = runWaveFiveHealth();

    expect(result.evidence_governance).toMatchObject({ wearable_integration: true, manual_entry: true, imported_health_records: true, nutrition_sources: true, activity_sources: true, sleep_sources: true, device_metadata: true, evidence_validation: true, source_attribution: true, provenance: true, deterministic_ingestion: true, evidence_normalization: true, consent_management: true, privacy_policies: true, access_policies: true, data_retention: true, health_audit: true, constitutional_rules: true, compliance_validation: true, encryption: true, access_control: true, audit_lineage: true, tenant_isolation: true, immutable_evidence: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, health_profile_operational: true, wellness_tracking_deterministic: true, health_dashboard_unified: true, health_goals_measurable: true, recommendations_explainable_evidence_backed: true, escalation_deterministic_immutable: true, consent_privacy_audit_governed: true, evidence_lineage_complete: true, replay_identical_recommendations: true, advisory_only_verified: true, diagnosis_treatment_prescription_prohibited: true });
    expect(runWaveFiveHealth({ scenario: "CONSENT_NOT_ENFORCED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "HEALTH_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveHealth({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveHealth({ scenario: failure });
    const validation = validateWaveFiveHealth(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveHealth({ scenario: failure });
    const validation = validateWaveFiveHealth(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveHealth({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveHealth({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveHealth({ scenario: "HEALTH_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveHealth(notQualified).valid).toBe(false);
  });
});
