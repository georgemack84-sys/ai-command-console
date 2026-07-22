import { describe, expect, it } from "vitest";
import { getProvingPerformanceScalabilityQualificationBundle, replayProvingPerformanceScalabilityQualification, runProvingPerformanceScalabilityQualification, validateProvingPerformanceScalabilityQualification } from "@/services/proving-performance-scalability-qualification";
import type { PerformanceFailure } from "@/types/proving-performance-scalability-qualification";

const FAILURE_MATRIX: readonly PerformanceFailure[] = [
  "P6_8_RESILIENCE_RECOVERY_INVALID",
  "PERFORMANCE_FRAMEWORK_MISSING",
  "BENCHMARK_CATALOG_MISSING",
  "BENCHMARK_SCENARIO_NOT_APPROVED",
  "WORKLOAD_GENERATION_MISSING",
  "WORKLOAD_NOT_ISOLATED",
  "BENCHMARK_EXECUTION_MISSING",
  "BENCHMARK_NONREPRODUCIBLE",
  "METRICS_REGISTRY_MISSING",
  "LATENCY_OBJECTIVE_FAILED",
  "THROUGHPUT_OBJECTIVE_FAILED",
  "RESOURCE_EFFICIENCY_FAILED",
  "SCALABILITY_QUALIFICATION_MISSING",
  "SCALABILITY_NONDETERMINISTIC",
  "TENANT_SCALING_ISOLATION_FAILED",
  "CAPACITY_PLANNING_MISSING",
  "CAPACITY_FORECAST_NOT_EVIDENCE_BASED",
  "BOTTLENECK_ANALYSIS_MISSING",
  "SATURATION_ANALYSIS_MISSING",
  "PERFORMANCE_REGRESSION_DETECTION_MISSING",
  "REPLAY_COMPATIBILITY_FAILED",
  "PERFORMANCE_EVIDENCE_MISSING",
  "PERFORMANCE_EVIDENCE_MUTATED",
  "PERFORMANCE_LINEAGE_INCOMPLETE",
  "RESOURCE_TRACEABILITY_FAILED",
  "CONSTITUTIONAL_LIMIT_BYPASS_ATTEMPTED",
  "POLICY_MODIFICATION_ATTEMPTED",
  "AUTHORIZATION_ATTEMPTED",
  "TRUST_EVALUATION_ATTEMPTED",
  "CERTIFICATION_ATTEMPTED",
  "DEPLOYMENT_ATTEMPTED",
  "RUNTIME_ORCHESTRATION_ATTEMPTED",
  "REPLAY_CORRECTNESS_OWNERSHIP_VIOLATION",
  "RESILIENCE_GOVERNANCE_OWNERSHIP_VIOLATION",
  "DISASTER_RECOVERY_OWNERSHIP_VIOLATION",
];

describe("P6.9 Performance and Scalability Qualification", () => {
  it("publishes performance qualification doctrine without owning authorization, trust evaluation, certification, deployment, runtime orchestration, replay correctness, resilience governance, or disaster recovery", () => {
    const bundle = getProvingPerformanceScalabilityQualificationBundle();

    expect(bundle.doctrine.version).toBe("proving-performance-scalability-qualification/v6.9");
    expect(bundle.doctrine.owns_performance_qualification).toBe(true);
    expect(bundle.doctrine.owns_scalability_qualification).toBe(true);
    expect(bundle.doctrine.owns_throughput_validation).toBe(true);
    expect(bundle.doctrine.owns_latency_validation).toBe(true);
    expect(bundle.doctrine.owns_resource_efficiency).toBe(true);
    expect(bundle.doctrine.owns_capacity_planning).toBe(true);
    expect(bundle.doctrine.owns_benchmark_governance).toBe(true);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.owns_policy_decisions).toBe(false);
    expect(bundle.doctrine.owns_authorization).toBe(false);
    expect(bundle.doctrine.owns_certification).toBe(false);
    expect(bundle.doctrine.owns_deployment).toBe(false);
    expect(bundle.doctrine.owns_runtime_orchestration).toBe(false);
    expect(bundle.doctrine.owns_replay_correctness).toBe(false);
    expect(bundle.doctrine.owns_resilience_governance).toBe(false);
    expect(bundle.doctrine.owns_disaster_recovery).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic performance qualification with P6.8 resilience dependency and complete benchmark categories", () => {
    const first = runProvingPerformanceScalabilityQualification();
    const second = runProvingPerformanceScalabilityQualification();

    expect(first.phase_identifier).toBe("ProvingPerformanceScalabilityQualification");
    expect(first.resilience_recovery_ref).toBe("proving-resilience-recovery-validation/v6.8");
    expect(first.framework.qualification_lifecycle).toHaveLength(12);
    expect(first.benchmark_catalog.categories).toHaveLength(10);
    expect(first.benchmark_execution.reproducible).toBe(true);
    expect(first.benchmark_execution.replay_compatible).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingPerformanceScalabilityQualification(first).valid).toBe(true);
    expect(replayProvingPerformanceScalabilityQualification(first)).toBe(true);
  });

  it("produces governed latency, throughput, resource, scalability, capacity, bottleneck, and evidence artifacts", () => {
    const result = runProvingPerformanceScalabilityQualification();

    expect(result.metrics.objectives_met).toBe(true);
    expect(result.metrics.p95_latency_ms).toBeLessThanOrEqual(100);
    expect(result.metrics.requests_per_second).toBeGreaterThanOrEqual(1000);
    expect(result.resource_report.traceable_to_workload).toBe(true);
    expect(result.resource_report.scaling_efficiency).toBeGreaterThanOrEqual(80);
    expect(result.scalability_report.horizontal_scaling).toBe(true);
    expect(result.scalability_report.tenant_isolation_preserved).toBe(true);
    expect(result.scalability_report.deterministic).toBe(true);
    expect(result.capacity_report.evidence_based).toBe(true);
    expect(result.capacity_report.constitutional_limits_preserved).toBe(true);
    expect(result.bottleneck_report.domains).toHaveLength(9);
    expect(result.bottleneck_report.saturation_analysis).toBe(true);
    expect(result.bottleneck_report.regression_detection).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.traceable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
  });

  it("passes all P6.9 gates, invariants, boundaries, and readiness checks", () => {
    const result = runProvingPerformanceScalabilityQualification();

    expect(result.gates.approved_scenario_gate).toBe(true);
    expect(result.gates.isolated_environment_gate).toBe(true);
    expect(result.gates.immutable_evidence_gate).toBe(true);
    expect(result.gates.evidence_based_capacity_gate).toBe(true);
    expect(result.gates.replay_compatibility_gate).toBe(true);
    expect(result.gates.tenant_isolation_gate).toBe(true);
    expect(result.gates.resource_traceability_gate).toBe(true);
    expect(result.gates.reproducibility_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.invariants.no_policy_modification).toBe(true);
    expect(result.invariants.no_authorization).toBe(true);
    expect(result.invariants.reproducible_benchmarks).toBe(true);
    expect(result.invariants.immutable_evidence).toBe(true);
    expect(result.invariants.replayable_executions).toBe(true);
    expect(result.invariants.tenant_isolation).toBe(true);
    expect(result.invariants.constitutional_limits_preserved).toBe(true);
    expect(result.invariants.deterministic_scalability).toBe(true);
    expect(result.invariants.degradation_evidence_generated).toBe(true);
    expect(result.invariants.no_trust_evaluation_replacement).toBe(true);
    expect(result.boundaries.owns_authorization).toBe(false);
    expect(result.boundaries.owns_trust_evaluation).toBe(false);
    expect(result.boundaries.owns_certification).toBe(false);
    expect(result.boundaries.owns_deployment).toBe(false);
    expect(result.boundaries.owns_runtime_orchestration).toBe(false);
    expect(result.readiness.outcome).toBe("QUALIFIED");
    expect(result.readiness.level).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("does not qualify performance readiness for %s", (failure) => {
    const result = runProvingPerformanceScalabilityQualification({ scenario: failure });
    const validation = validateProvingPerformanceScalabilityQualification(result);

    expect(result.readiness.outcome).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("supports conditional qualification when capacity constraints are documented as evidence", () => {
    const result = runProvingPerformanceScalabilityQualification({ scenario: "DOCUMENTED_CAPACITY_CONSTRAINT" });

    expect(result.readiness.outcome).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.level).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.evidence.observations).toContain("observation:documented-capacity-constraint");
    expect(validateProvingPerformanceScalabilityQualification(result).valid).toBe(true);
  });
});
