import { describe, expect, it } from "vitest";

import { getWaveSixOperationalOptimizationBundle, replayWaveSixOperationalOptimization, runWaveSixOperationalOptimization, validateWaveSixOperationalOptimization } from "@/services/wave-six-operational-optimization";
import type { WaveSixOperationalOptimizationFailure } from "@/types/wave-six-operational-optimization";

const conditionalFailures = ["OBSERVATION_ENGINE_MISSING", "OBSERVATIONS_NOT_RECORDED", "OBSERVATIONS_NOT_CORRELATED", "OBSERVATION_TIMELINE_MISSING", "BOTTLENECK_ENGINE_MISSING", "CONGESTION_NOT_DETECTED", "QUEUE_DELAY_NOT_IDENTIFIED", "DEPENDENCY_BLOCKING_NOT_IDENTIFIED", "BOTTLENECK_EVIDENCE_MISSING", "RESOURCE_ANALYZER_MISSING", "UTILIZATION_NOT_MEASURED", "WORKFLOW_ANALYZER_MISSING", "LATENCY_NOT_MEASURED", "THROUGHPUT_NOT_MEASURED", "PERFORMANCE_TREND_ANALYZER_MISSING", "OPERATIONAL_DRIFT_NOT_TRACKED", "EVIDENCE_BUILDER_MISSING", "CONFIDENCE_METADATA_MISSING", "REPORTING_API_MISSING", "ANALYSIS_REPORT_INCOMPLETE", "PERFORMANCE_FINDINGS_MISSING"] as const satisfies readonly WaveSixOperationalOptimizationFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "W6_2_DEPENDENCY_COORDINATION_INVALID", "W6_3_PERSONAL_OPERATIONAL_CONTEXT_INVALID", "OBSERVATION_REPLAY_DIVERGED", "CAPACITY_CALCULATION_NONDETERMINISTIC", "RESOURCE_METRICS_NOT_REPRODUCIBLE", "EFFICIENCY_NONDETERMINISTIC", "TREND_ANALYSIS_NONDETERMINISTIC", "TREND_REPLAY_DIVERGED", "FINDING_WITHOUT_EVIDENCE", "EVIDENCE_MUTABLE", "EVIDENCE_LINEAGE_INCOMPLETE", "METRIC_LINEAGE_MISSING", "REPLAY_REFERENCE_MISSING", "RECOMMENDATION_GENERATED", "RECOMMENDATION_PRIORITIZED", "DECISION_MADE", "APPROVAL_WORKFLOW_STARTED", "WORKFLOW_EXECUTED", "ORCHESTRATION_MODIFIED", "SCHEDULE_MODIFIED", "RESOURCE_ALLOCATED", "AUTONOMOUS_OPTIMIZATION_PERFORMED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixOperationalOptimizationFailure[];

describe("Wave 6.4 Operational Optimization", () => {
  it("publishes the operational optimization doctrine", () => {
    const bundle = getWaveSixOperationalOptimizationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-operational-optimization/w6.4", observation_before_recommendation: true, evidence_driven: true, read_only_analysis: true, deterministic_analysis_required: true, replayable_analysis_required: true, recommendations_prohibited: true, execution_prohibited: true, qualification_gate: "W6.4 Operational Optimization Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W6.1 W6.2 and W6.3 without recommendations", () => {
    const first = runWaveSixOperationalOptimization({ seed: "deterministic" });
    const second = runWaveSixOperationalOptimization({ seed: "deterministic" });

    expect(first.operational_orchestration_ref).toBe("wave-six-operational-orchestration/w6.1");
    expect(first.dependency_coordination_ref).toBe("wave-six-dependency-service-coordination/w6.2");
    expect(first.personal_operational_context_ref).toBe("wave-six-personal-operational-context/w6.3");
    expect(first.upstream_refs).toContain("cci-event-history");
    expect(first.upstream_refs).toContain("mission-control-operational-data");
    expect(first.provides).toEqual(["operational-observations", "bottleneck-findings", "resource-utilization-reports", "workflow-efficiency-reports", "performance-trend-findings", "optimization-evidence", "operational-analysis-reports"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixOperationalOptimization(first).valid).toBe(true);
    expect(replayWaveSixOperationalOptimization()).toBe(true);
  });

  it("records correlated replayable operational observations", () => {
    const result = runWaveSixOperationalOptimization();

    expect(result.observation_engine).toMatchObject({ consumes_operational_events: true, observation_registry: true, normalize_observations: true, correlate_runtime_behavior: true, aggregate_evidence: true, observation_timeline: true, observations_recorded: true, observations_correlated: true, observations_replayable: true, deterministic_observation_generation: true });
    expect(result.readiness.observations_deterministic).toBe(true);
    expect(runWaveSixOperationalOptimization({ scenario: "OBSERVATION_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("detects bottlenecks with complete bottleneck evidence", () => {
    const result = runWaveSixOperationalOptimization();

    expect(result.bottleneck_detection).toMatchObject({ workflow_congestion: true, recurring_delays: true, dependency_blocking: true, queue_saturation: true, execution_slowdowns: true, bottleneck_reports: true, bottleneck_evidence: true, replay_reference: true, deterministic_detection: true });
    expect(result.readiness.bottlenecks_evidenced).toBe(true);
    expect(runWaveSixOperationalOptimization({ scenario: "BOTTLENECK_EVIDENCE_MISSING" }).readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it("analyzes resources workflow efficiency and performance trends reproducibly", () => {
    const result = runWaveSixOperationalOptimization();

    expect(result.resource_workflow_performance_analysis).toMatchObject({ cpu_utilization: true, memory_utilization: true, storage_utilization: true, network_utilization: true, queue_depth: true, worker_utilization: true, service_capacity: true, capacity_findings: true, execution_duration: true, completion_latency: true, idle_periods: true, wait_times: true, queue_efficiency: true, throughput: true, processing_variance: true, workflow_efficiency_reports: true, historical_performance: true, recurring_degradation: true, recurring_improvements: true, trend_stability: true, operational_drift: true, trend_reports: true, performance_findings: true, deterministic_analysis: true, metrics_reproducible: true });
    expect(result.readiness.resource_utilization_operational).toBe(true);
    expect(result.readiness.workflow_efficiency_validated).toBe(true);
    expect(result.readiness.performance_trends_replayable).toBe(true);
    expect(runWaveSixOperationalOptimization({ scenario: "EFFICIENCY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOptimization({ scenario: "TREND_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("generates immutable optimization evidence and consistent analysis reports", () => {
    const result = runWaveSixOperationalOptimization();

    expect(result.evidence_reports).toMatchObject({ source_observations: true, timestamps: true, operational_metrics: true, correlation: true, replay_references: true, confidence_metadata: true, metric_lineage: true, observation_lineage: true, immutable_evidence: true, deterministic_replay_validation: true, operational_analysis_reports: true, workflow_observations: true, bottlenecks: true, utilization: true, performance_trends: true, evidence_references: true, performance_findings: true, report_generation: true, findings_retrieval: true, evidence_retrieval: true });
    expect(result.readiness.evidence_immutable_complete).toBe(true);
    expect(result.readiness.analysis_reports_consistent).toBe(true);
    expect(runWaveSixOperationalOptimization({ scenario: "FINDING_WITHOUT_EVIDENCE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOptimization({ scenario: "EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps optimization read-only and advisory-ready for Mission Control", () => {
    const result = runWaveSixOperationalOptimization();

    expect(result.optimization_boundary).toMatchObject({ produces_operational_observations: true, mission_control_advisory_ready: true, read_only_analysis: true, recommendations_generated: false, recommendations_prioritized: false, decisions_made: false, approvals_started: false, workflows_executed: false, orchestration_modified: false, schedules_modified: false, resources_allocated: false, autonomous_optimization: false, consumes_recommendations: false });
    expect(result.readiness.mission_control_observations_available).toBe(true);
    expect(result.readiness.no_recommendations_or_execution).toBe(true);
    expect(runWaveSixOperationalOptimization({ scenario: "RECOMMENDATION_GENERATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalOptimization({ scenario: "WORKFLOW_EXECUTED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixOperationalOptimization({ scenario: failure });
    const validation = validateWaveSixOperationalOptimization(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixOperationalOptimization({ scenario: failure });
    const validation = validateWaveSixOperationalOptimization(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixOperationalOptimization({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixOperationalOptimization({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixOperationalOptimization({ scenario: "OPERATIONAL_OPTIMIZATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixOperationalOptimization(notQualified).valid).toBe(false);
  });
});
