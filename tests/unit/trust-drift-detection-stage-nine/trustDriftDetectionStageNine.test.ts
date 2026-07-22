import { describe, expect, it } from "vitest";

import { getTrustDriftDetectionStageNineBundle, replayTrustDriftDetectionStageNine, runTrustDriftDetectionStageNine, validateTrustDriftDetectionStageNine } from "@/services/trust-drift-detection-stage-nine";
import type { TrustDriftDetectionFailure } from "@/types/trust-drift-detection-stage-nine";

const conditionalFailures = ["DRIFT_ENGINE_MISSING", "DRIFT_PIPELINE_MISSING", "OBSERVATION_LIFECYCLE_MISSING", "DRIFT_EVIDENCE_PIPELINE_MISSING", "DRIFT_EVENT_MODEL_MISSING", "DRIFT_REGISTRY_INTEGRATION_MISSING", "MONITORING_INTEGRATION_MISSING", "BEHAVIORAL_BASELINES_MISSING", "HISTORICAL_BEHAVIOR_PROFILES_MISSING", "BEHAVIOR_COMPARISON_ENGINE_MISSING", "BEHAVIOR_TREND_ANALYSIS_MISSING", "PATTERN_DEVIATION_DETECTION_MISSING", "BEHAVIOR_STABILITY_METRICS_MISSING", "CONFIDENCE_BASELINES_MISSING", "CONFIDENCE_TREND_ANALYSIS_MISSING", "CONFIDENCE_VARIANCE_DETECTION_MISSING", "EVIDENCE_QUALITY_MONITORING_MISSING", "CONFIDENCE_STABILITY_METRICS_MISSING", "CONFIDENCE_DEGRADATION_DETECTION_MISSING", "GOAL_ALIGNMENT_DRIFT_MISSING", "BEHAVIORAL_ALIGNMENT_DRIFT_MISSING", "CONSTITUTIONAL_ALIGNMENT_DRIFT_MISSING", "POLICY_ALIGNMENT_DRIFT_MISSING", "ALIGNMENT_TREND_ANALYSIS_MISSING", "ALIGNMENT_STABILITY_EVALUATION_MISSING", "RISK_TREND_MONITORING_MISSING", "OPERATIONAL_RISK_DRIFT_MISSING", "BEHAVIORAL_RISK_DRIFT_MISSING", "POLICY_RISK_DRIFT_MISSING", "CONSTITUTIONAL_RISK_DRIFT_MISSING", "RISK_ESCALATION_DETECTION_MISSING", "THRESHOLD_REGISTRY_MISSING", "CONSTITUTIONAL_THRESHOLD_POLICIES_MISSING", "THRESHOLD_VERSIONING_MISSING", "THRESHOLD_VALIDATION_MISSING", "THRESHOLD_GOVERNANCE_MISSING", "THRESHOLD_EVIDENCE_MISSING", "ALERT_GENERATION_MISSING", "ALERT_SEVERITY_CLASSIFICATION_MISSING", "ALERT_PRIORITIZATION_MISSING", "ALERT_ROUTING_MISSING", "ALERT_MONITORING_INTEGRATION_MISSING", "ALERT_EVIDENCE_MISSING", "OBSERVATION_EVIDENCE_MISSING", "BASELINE_REFERENCES_MISSING", "HISTORICAL_COMPARISONS_MISSING", "DRIFT_EVALUATION_RECORDS_MISSING", "IMMUTABLE_DRIFT_EVIDENCE_MISSING", "DRIFT_NARRATIVES_MISSING", "BASELINE_COMPARISONS_MISSING", "THRESHOLD_JUSTIFICATION_MISSING", "TREND_VISUALIZATION_CONTRACTS_MISSING", "EVIDENCE_MAPPING_MISSING", "HISTORICAL_TRACEABILITY_MISSING", "DRIFT_REPLAY_ENGINE_MISSING", "HISTORICAL_RECONSTRUCTION_MISSING", "BASELINE_REPLAY_MISSING", "THRESHOLD_REPLAY_MISSING", "EVENT_REPLAY_MISSING", "REPLAY_VALIDATION_MISSING"] as const satisfies readonly TrustDriftDetectionFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "STAGE_8_CONTINUOUS_MONITORING_INVALID", "DRIFT_MODIFIED_TRUST_DECISION", "DRIFT_CHANGED_TRUST_STANDING", "DRIFT_APPLIED_RESTRICTION", "DRIFT_TRIGGERED_RECOVERY_DIRECTLY", "DRIFT_THRESHOLD_NOT_GOVERNED", "DRIFT_ALERT_WITHOUT_EVIDENCE", "DRIFT_EVIDENCE_MUTABLE", "DRIFT_REPLAY_DIVERGED"] as const satisfies readonly TrustDriftDetectionFailure[];

describe("Stage 9 Drift Detection", () => {
  it("publishes the constitutional drift detection doctrine", () => {
    const bundle = getTrustDriftDetectionStageNineBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-drift-detection-stage-nine/stage-9", advisory_only: true, never_changes_trust_decisions: true, immutable_drift_evidence_required: true, deterministic_replay_required: true, governed_thresholds_required: true, every_alert_evidence_backed: true, qualification_gate: "Stage 9 Drift Detection Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("DRIFT_DETECTION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 8", () => {
    const first = runTrustDriftDetectionStageNine({ seed: "deterministic" });
    const second = runTrustDriftDetectionStageNine({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7", "trust-continuous-monitoring-stage-eight/stage-8"]);
    expect(first.provides).toEqual(["drift-detection-engine", "behavioral-drift-service", "confidence-drift-service", "alignment-drift-service", "risk-drift-service", "drift-threshold-registry", "drift-alert-registry", "drift-evidence", "drift-explanation-packages", "drift-replay-reports"]);
    expect(first.domains).toEqual(["BEHAVIORAL", "CONFIDENCE", "ALIGNMENT", "RISK"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustDriftDetectionStageNine(first).valid).toBe(true);
    expect(replayTrustDriftDetectionStageNine()).toBe(true);
  });

  it("establishes advisory drift architecture integrated with monitoring", () => {
    const result = runTrustDriftDetectionStageNine();

    expect(result.architecture).toMatchObject({ drift_detection_engine: true, drift_evaluation_pipeline: true, drift_observation_lifecycle: true, drift_evidence_pipeline: true, drift_event_model: true, drift_registry_integration: true, trust_monitoring_integration: true, service_contracts: true, event_contracts: true, advisory_only: true });
    expect(runTrustDriftDetectionStageNine({ scenario: "MONITORING_INTEGRATION_MISSING" }).readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it("detects behavioral, confidence, alignment, and risk drift domains", () => {
    const result = runTrustDriftDetectionStageNine();

    expect(result.behavioral).toMatchObject({ behavioral_baselines: true, historical_behavior_profiles: true, behavioral_comparison_engine: true, behavioral_trend_analysis: true, pattern_deviation_detection: true, behavioral_stability_metrics: true, behavioral_drift_results: true, behavioral_trend_evidence: true, severity: "NONE" });
    expect(result.confidence).toMatchObject({ confidence_baselines: true, confidence_trend_analysis: true, confidence_variance_detection: true, evidence_quality_monitoring: true, confidence_stability_metrics: true, confidence_degradation_detection: true, confidence_drift_reports: true, confidence_drift_evidence: true, severity: "NONE" });
    expect(result.alignment).toMatchObject({ goal_alignment_drift: true, behavioral_alignment_drift: true, constitutional_alignment_drift: true, policy_alignment_drift: true, alignment_trend_analysis: true, alignment_stability_evaluation: true, alignment_drift_reports: true, alignment_drift_evidence: true, severity: "NONE" });
    expect(result.risk).toMatchObject({ risk_trend_monitoring: true, operational_risk_drift: true, behavioral_risk_drift: true, policy_risk_drift: true, constitutional_risk_drift: true, risk_escalation_detection: true, risk_drift_reports: true, risk_drift_evidence: true, severity: "NONE" });
  });

  it("governs thresholds and produces evidence-backed deterministic alerts", () => {
    const result = runTrustDriftDetectionStageNine();

    expect(result.thresholds).toMatchObject({ drift_threshold_registry: true, constitutional_threshold_policies: true, threshold_versioning: true, threshold_validation: true, threshold_governance: true, threshold_evidence: true, deterministic_criteria: true, governed_thresholds: true });
    expect(result.alerts).toMatchObject({ alert_generation: true, alert_severity_classification: true, alert_prioritization: true, alert_routing: true, monitoring_integration: true, alert_evidence: true, alert_records: true, alert_registry: true, evidence_backed: true, deterministic_generation: true });
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_THRESHOLD_NOT_GOVERNED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_ALERT_WITHOUT_EVIDENCE" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("packages immutable evidence, explanations, and replay", () => {
    const result = runTrustDriftDetectionStageNine();

    expect(result.evidence).toMatchObject({ observation_evidence: true, baseline_references: true, historical_comparisons: true, threshold_evidence: true, drift_evaluation_records: true, immutable_evidence_storage: true, evidence_packages: true, evidence_lineage_complete: true, replayable: true });
    expect(result.explainability).toMatchObject({ drift_narratives: true, baseline_comparisons: true, threshold_justification: true, trend_visualization_contracts: true, evidence_mapping: true, historical_traceability: true, explanation_packages: true, every_drift_explained: true });
    expect(result.replay).toMatchObject({ drift_replay_engine: true, historical_reconstruction: true, baseline_replay: true, threshold_replay: true, event_replay: true, replay_validation: true, replay_reports: true, identical_results: true });
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_EVIDENCE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_REPLAY_DIVERGED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("remains advisory and never directly changes trust posture", () => {
    const result = runTrustDriftDetectionStageNine();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, architecture_ready: true, behavioral_ready: true, confidence_ready: true, alignment_ready: true, risk_ready: true, thresholds_ready: true, alerts_ready: true, evidence_ready: true, explainability_ready: true, replay_ready: true, advisory_only: true, no_direct_decision_change: true, no_direct_standing_change: true, no_direct_restriction: true, no_direct_recovery: true, deterministic: true, immutable_evidence: true, complete_lineage: true, certification_ready: true });
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_MODIFIED_TRUST_DECISION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_CHANGED_TRUST_STANDING" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_APPLIED_RESTRICTION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustDriftDetectionStageNine({ scenario: "DRIFT_TRIGGERED_RECOVERY_DIRECTLY" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustDriftDetectionStageNine({ scenario: failure });
    const validation = validateTrustDriftDetectionStageNine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustDriftDetectionStageNine({ scenario: failure });
    const validation = validateTrustDriftDetectionStageNine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustDriftDetectionStageNine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustDriftDetectionStageNine({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustDriftDetectionStageNine({ scenario: "DRIFT_DETECTION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustDriftDetectionStageNine(notQualified).valid).toBe(false);
  });
});
