import { describe, expect, it } from "vitest";
import { getProvingBenchmarkingComparativeAnalysisBundle, replayProvingBenchmarkingComparativeAnalysis, runProvingBenchmarkingComparativeAnalysis, validateProvingBenchmarkingComparativeAnalysis } from "@/services/proving-benchmarking-comparative-analysis";
import type { BenchmarkFailure } from "@/types/proving-benchmarking-comparative-analysis";

const FAILURE_MATRIX: readonly BenchmarkFailure[] = [
  "P6_12_REHEARSAL_PREPARATION_INVALID",
  "BENCHMARK_FRAMEWORK_MISSING",
  "BENCHMARK_STANDARDS_NOT_APPROVED",
  "BENCHMARK_REGISTRY_MISSING",
  "BENCHMARK_EXECUTION_ENGINE_MISSING",
  "BENCHMARK_EXECUTION_NONDETERMINISTIC",
  "BENCHMARK_NORMALIZATION_FAILED",
  "COMPARATIVE_ANALYSIS_MISSING",
  "NON_EQUIVALENT_CONDITIONS_COMPARED",
  "CAPABILITY_BENCHMARKING_MISSING",
  "CAPABILITY_SCORING_MISSING",
  "MATURITY_ASSESSMENT_MISSING",
  "TREND_ANALYSIS_MISSING",
  "EVIDENCE_CORRELATION_MISSING",
  "BENCHMARK_EVIDENCE_MISSING",
  "BENCHMARK_EVIDENCE_MUTATED",
  "BENCHMARK_LINEAGE_INCOMPLETE",
  "BENCHMARK_NOT_REPRODUCIBLE",
  "SCORING_NOT_REPRODUCIBLE",
  "SCORING_NOT_EXPLAINABLE",
  "SUBJECTIVE_SCORING_ATTEMPTED",
  "BENCHMARK_GOVERNANCE_MISSING",
  "BENCHMARK_VERSIONING_FAILED",
  "BENCHMARK_APPROVAL_MISSING",
  "BENCHMARK_BASELINE_INFLUENCED",
  "ENVIRONMENT_PROVISIONING_OWNERSHIP_VIOLATION",
  "SCENARIO_CREATION_OWNERSHIP_VIOLATION",
  "SYNTHETIC_DATA_GENERATION_OWNERSHIP_VIOLATION",
  "SIMULATION_EXECUTION_OWNERSHIP_VIOLATION",
  "REPLAY_VALIDATION_OWNERSHIP_VIOLATION",
  "ADVERSARIAL_TESTING_OWNERSHIP_VIOLATION",
  "RESILIENCE_VALIDATION_OWNERSHIP_VIOLATION",
  "PERFORMANCE_QUALIFICATION_OWNERSHIP_VIOLATION",
  "INTEROPERABILITY_VALIDATION_OWNERSHIP_VIOLATION",
  "OPERATIONAL_EXERCISE_OWNERSHIP_VIOLATION",
  "CERTIFICATION_REHEARSAL_OWNERSHIP_VIOLATION",
  "FORMAL_QUALIFICATION_ATTEMPTED",
];

describe("P6.13 Benchmarking and Comparative Analysis", () => {
  it("publishes benchmark doctrine without owning upstream execution or formal qualification phases", () => {
    const bundle = getProvingBenchmarkingComparativeAnalysisBundle();

    expect(bundle.doctrine.version).toBe("proving-benchmarking-comparative-analysis/v6.13");
    expect(bundle.doctrine.owns_benchmark_execution).toBe(true);
    expect(bundle.doctrine.owns_comparative_analysis).toBe(true);
    expect(bundle.doctrine.owns_capability_scoring).toBe(true);
    expect(bundle.doctrine.owns_maturity_scoring).toBe(true);
    expect(bundle.doctrine.owns_benchmark_normalization).toBe(true);
    expect(bundle.doctrine.owns_benchmark_evidence).toBe(true);
    expect(bundle.doctrine.owns_benchmark_governance).toBe(true);
    expect(bundle.doctrine.owns_environment_provisioning).toBe(false);
    expect(bundle.doctrine.owns_scenario_creation).toBe(false);
    expect(bundle.doctrine.owns_synthetic_data_generation).toBe(false);
    expect(bundle.doctrine.owns_simulation_execution).toBe(false);
    expect(bundle.doctrine.owns_replay_validation).toBe(false);
    expect(bundle.doctrine.owns_performance_qualification).toBe(false);
    expect(bundle.doctrine.owns_certification_rehearsal).toBe(false);
    expect(bundle.doctrine.owns_formal_qualification).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic benchmark analysis with P6.12 rehearsal preparation dependency", () => {
    const first = runProvingBenchmarkingComparativeAnalysis();
    const second = runProvingBenchmarkingComparativeAnalysis();

    expect(first.phase_identifier).toBe("ProvingBenchmarkingComparativeAnalysis");
    expect(first.rehearsal_preparation_ref).toBe("proving-certification-rehearsal-qualification-preparation/v6.12");
    expect(first.framework.categories).toHaveLength(10);
    expect(first.execution.deterministic).toBe(true);
    expect(first.execution.normalized_measurements).toHaveLength(5);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingBenchmarkingComparativeAnalysis(first).valid).toBe(true);
    expect(replayProvingBenchmarkingComparativeAnalysis(first)).toBe(true);
  });

  it("produces comparative studies, capability scorecards, maturity assessments, trends, and evidence packages", () => {
    const result = runProvingBenchmarkingComparativeAnalysis();

    expect(result.comparative_study.dimensions).toHaveLength(10);
    expect(result.comparative_study.equivalent_conditions).toBe(true);
    expect(result.capability_assessment.dimensions).toHaveLength(10);
    expect(result.scorecard.weighted_score).toBeGreaterThanOrEqual(90);
    expect(result.scorecard.explainable).toBe(true);
    expect(result.maturity_assessment.dimensions).toHaveLength(8);
    expect(result.trend_report.regression_detection).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.traceable).toBe(true);
    expect(result.evidence_package.reproducible).toBe(true);
    expect(result.evidence_package.evidence_lineage.length).toBeGreaterThan(0);
  });

  it("passes benchmark governance, gates, dashboard, boundaries, and readiness checks", () => {
    const result = runProvingBenchmarkingComparativeAnalysis();

    expect(result.governance_report.benchmark_versioning).toBe(true);
    expect(result.governance_report.reproducibility).toBe(true);
    expect(result.governance_report.transparency).toBe(true);
    expect(result.governance_report.objectivity).toBe(true);
    expect(result.governance_report.isolation).toBe(true);
    expect(result.dashboard.benchmark_reports).toHaveLength(1);
    expect(result.dashboard.comparative_studies).toHaveLength(1);
    expect(result.dashboard.capability_scorecards).toHaveLength(1);
    expect(result.gates.framework_approved).toBe(true);
    expect(result.gates.deterministic_execution).toBe(true);
    expect(result.gates.comparative_validity).toBe(true);
    expect(result.gates.score_reproducibility).toBe(true);
    expect(result.gates.evidence_completeness).toBe(true);
    expect(result.gates.lineage_integrity).toBe(true);
    expect(result.gates.governance_integrity).toBe(true);
    expect(result.gates.boundary_integrity).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.boundaries.owns_simulation_execution).toBe(false);
    expect(result.boundaries.owns_replay_validation).toBe(false);
    expect(result.boundaries.owns_formal_qualification).toBe(false);
    expect(result.readiness.outcome).toBe("PASS");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails benchmarking readiness for %s", (failure) => {
    const result = runProvingBenchmarkingComparativeAnalysis({ scenario: failure });
    const validation = validateProvingBenchmarkingComparativeAnalysis(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance review required without benchmark readiness", () => {
    const result = runProvingBenchmarkingComparativeAnalysis({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
