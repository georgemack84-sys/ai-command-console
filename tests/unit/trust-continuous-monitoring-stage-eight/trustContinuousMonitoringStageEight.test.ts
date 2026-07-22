import { describe, expect, it } from "vitest";

import { getTrustContinuousMonitoringStageEightBundle, replayTrustContinuousMonitoringStageEight, runTrustContinuousMonitoringStageEight, validateTrustContinuousMonitoringStageEight } from "@/services/trust-continuous-monitoring-stage-eight";
import type { TrustContinuousMonitoringFailure } from "@/types/trust-continuous-monitoring-stage-eight";

const conditionalFailures = ["MONITORING_ENGINE_MISSING", "MONITORING_SCHEDULER_MISSING", "MONITORING_REGISTRY_MISSING", "MONITORING_EVIDENCE_MISSING", "ACTIVE_TRUST_ENTITIES_NOT_MONITORED", "MONITORING_REPLAY_MISSING", "TRUST_HEALTH_ENGINE_MISSING", "HEALTH_SCORE_MISSING", "STABILITY_INDICATORS_MISSING", "OPERATIONAL_METRICS_MISSING", "CONSTITUTIONAL_HEALTH_VALIDATION_MISSING", "HEALTH_TRENDS_MISSING", "HEALTH_EVIDENCE_MISSING", "STANDING_MONITOR_MISSING", "STANDING_CONSISTENCY_MISSING", "STANDING_AGING_MISSING", "STANDING_TRANSITION_OBSERVATION_MISSING", "STANDING_HISTORY_MISSING", "STANDING_EVIDENCE_MISSING", "EVIDENCE_FRESHNESS_SERVICE_MISSING", "EVIDENCE_AGE_VALIDATION_MISSING", "EXPIRATION_MONITORING_MISSING", "MISSING_EVIDENCE_DETECTION_MISSING", "STALE_EVIDENCE_IDENTIFICATION_MISSING", "FRESHNESS_REPORTING_MISSING", "BEHAVIORAL_MONITORING_ENGINE_MISSING", "EXPECTED_BEHAVIOR_VALIDATION_MISSING", "BEHAVIORAL_ANOMALY_DETECTION_MISSING", "BEHAVIORAL_TREND_MONITORING_MISSING", "BEHAVIORAL_EVIDENCE_MISSING", "BEHAVIORAL_REPORTING_MISSING", "MONITORING_EVENT_SERVICE_MISSING", "EVENT_CLASSIFICATION_MISSING", "EVENT_LINEAGE_MISSING", "EVENT_TIMESTAMPING_MISSING", "IMMUTABLE_EVENT_RECORDING_MISSING", "EVENT_REPLAY_MISSING"] as const satisfies readonly TrustContinuousMonitoringFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "MONITORING_CADENCE_NONDETERMINISTIC", "HEALTH_CALCULATION_NONDETERMINISTIC", "MONITORING_ATTEMPTED_STANDING_CHANGE", "MONITORING_PERFORMED_TRUST_EVALUATION", "MONITORING_RESOLVED_TRUST_DECISION", "MONITORING_OVERRIDDEN_CONSTITUTIONAL_DECISION", "MONITORING_APPLIED_RESTRICTIONS", "MONITORING_MADE_RECOVERY_DECISION", "HEALTH_METRIC_OVERRIDES_DECISION", "BEHAVIORAL_MONITORING_DETERMINED_OUTCOME", "MONITORING_EVIDENCE_MUTABLE", "MONITORING_EVENT_NOT_TRACEABLE", "MONITORING_REPLAY_DIVERGED"] as const satisfies readonly TrustContinuousMonitoringFailure[];

describe("Stage 8 Continuous Monitoring", () => {
  it("publishes the constitutional continuous monitoring doctrine", () => {
    const bundle = getTrustContinuousMonitoringStageEightBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-continuous-monitoring-stage-eight/stage-8", observational_only: true, never_changes_trust_standing: true, immutable_monitoring_evidence_required: true, deterministic_replay_required: true, health_never_overrides_constitutional_decisions: true, behavioral_monitoring_never_decides_outcomes: true, qualification_gate: "Stage 8 Continuous Monitoring Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("CONTINUOUS_MONITORING_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 7", () => {
    const first = runTrustContinuousMonitoringStageEight({ seed: "deterministic" });
    const second = runTrustContinuousMonitoringStageEight({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7"]);
    expect(first.provides).toEqual(["monitoring-service", "trust-health-reports", "monitoring-dashboard", "monitoring-evidence", "monitoring-events", "health-metrics", "standing-metrics", "behavioral-reports", "evidence-freshness-reports"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustContinuousMonitoringStageEight(first).valid).toBe(true);
    expect(replayTrustContinuousMonitoringStageEight()).toBe(true);
  });

  it("operates continuous trust monitoring with deterministic cadence", () => {
    const result = runTrustContinuousMonitoringStageEight();

    expect(result.monitoring).toMatchObject({ trust_monitoring_engine: true, monitoring_scheduler: true, monitoring_registry: true, active_trust_entities_monitored: true, lifecycle_activity_observed: true, monitoring_intervals_tracked: true, monitoring_evidence_collected: true, monitoring_state_published: true, deterministic_cadence: true, replay_verified: true });
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_CADENCE_NONDETERMINISTIC" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("computes reproducible trust health without overriding decisions", () => {
    const result = runTrustContinuousMonitoringStageEight();

    expect(result.health).toMatchObject({ health_score: 100, classification: "HEALTHY", trust_health_engine: true, health_score_computation: true, stability_indicators: true, operational_health_metrics: true, constitutional_health_validation: true, health_trend_analysis: true, health_evidence_generation: true, deterministic_calculation: true, trends_reproducible: true });
    expect(runTrustContinuousMonitoringStageEight({ scenario: "HEALTH_CALCULATION_NONDETERMINISTIC" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "HEALTH_METRIC_OVERRIDES_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("observes standing, evidence freshness, and behavior without changing trust outcomes", () => {
    const result = runTrustContinuousMonitoringStageEight();

    expect(result.standing).toMatchObject({ standing_observation: true, standing_consistency_checks: true, standing_aging: true, standing_transition_observation: true, standing_history: true, standing_metrics: true, standing_evidence: true, transition_history_complete: true, evidence_replay_validated: true, standing_modified: false });
    expect(result.freshness).toMatchObject({ evidence_age_validation: true, expiration_monitoring: true, evidence_lifecycle_observation: true, missing_evidence_detection: true, stale_evidence_identification: true, freshness_reporting: true, evidence_freshness_verified: true, expiration_detected: true, replay_deterministic: true });
    expect(result.behavior).toMatchObject({ behavioral_monitoring_engine: true, behavioral_observation: true, expected_behavior_validation: true, behavioral_anomaly_detection: true, trend_monitoring: true, behavioral_evidence: true, behavioral_reporting: true, independently_determines_trust_outcome: false, monitoring_reproducible: true });
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_ATTEMPTED_STANDING_CHANGE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "BEHAVIORAL_MONITORING_DETERMINED_OUTCOME" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("publishes immutable traceable monitoring events and evidence", () => {
    const result = runTrustContinuousMonitoringStageEight();

    expect(result.events.event_severities).toEqual(["INFO", "WATCH", "DEGRADATION", "CRITICAL"]);
    expect(result.events).toMatchObject({ monitoring_event_service: true, event_generation: true, event_classification: true, event_lineage: true, event_timestamping: true, immutable_event_recording: true, event_registry: true, event_log: true, replay_support: true, traceable: true });
    expect(result.evidence).toMatchObject({ monitoring_evidence: true, health_evidence: true, behavioral_evidence: true, standing_evidence: true, freshness_evidence: true, event_evidence: true, immutable_storage: true, evidence_hashing: true, replayable: true, certification_ready: true });
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_EVENT_NOT_TRACEABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_EVIDENCE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("keeps monitoring observational and certification-ready", () => {
    const result = runTrustContinuousMonitoringStageEight();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, monitoring_ready: true, health_ready: true, standing_ready: true, freshness_ready: true, behavioral_ready: true, events_ready: true, evidence_ready: true, observational_only: true, no_standing_modification: true, no_decision_override: true, no_restriction_application: true, no_recovery_decision: true, deterministic: true, replayable: true, immutable_evidence: true, traceable_events: true, certification_ready: true });
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_PERFORMED_TRUST_EVALUATION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_RESOLVED_TRUST_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_APPLIED_RESTRICTIONS" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustContinuousMonitoringStageEight({ scenario: "MONITORING_MADE_RECOVERY_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustContinuousMonitoringStageEight({ scenario: failure });
    const validation = validateTrustContinuousMonitoringStageEight(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustContinuousMonitoringStageEight({ scenario: failure });
    const validation = validateTrustContinuousMonitoringStageEight(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustContinuousMonitoringStageEight({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustContinuousMonitoringStageEight({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustContinuousMonitoringStageEight({ scenario: "CONTINUOUS_MONITORING_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustContinuousMonitoringStageEight(notQualified).valid).toBe(false);
  });
});
