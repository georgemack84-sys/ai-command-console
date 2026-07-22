import { describe, expect, it, vi } from "vitest";
import {
  buildForecastConfidenceObservabilitySurface,
  computeForecastConfidenceRepositoryHash,
  getForecastConfidenceEngineContract,
  replayForecastConfidence,
  runForecastConfidence,
  validateForecastConfidence,
} from "@/services/forecast-confidence-engine";
import type { ForecastConfidenceFailure, ForecastConfidenceScenario } from "@/types/forecast-confidence-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.7 Forecast Confidence Engine", () => {
  it("defines the advisory-only forecast confidence doctrine", () => {
    const contract = getForecastConfidenceEngineContract();

    expect(contract.doctrine.engine_version).toBe("forecast-confidence-engine/v8ALT.3.7");
    expect(contract.doctrine.principles).toContain("deterministic-confidence-scoring");
    expect(contract.doctrine.principles).toContain("explainable-confidence-calculations");
    expect(contract.doctrine.confidence_levels).toContain("VERY_HIGH");
    expect(contract.doctrine.reliability_levels).toContain("CERTIFIED");
    expect(contract.doctrine.uncertainty_levels).toContain("UNKNOWN");
    expect(contract.doctrine.scoring_factors).toEqual(["prediction_confidence", "model_stability", "evidence_quality", "historical_accuracy", "replay_consistency", "governance_certainty", "integrity_verification", "environmental_stability"]);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates valid confidence records for every forecast", () => {
    const repository = runForecastConfidence();
    const validation = validateForecastConfidence(repository);

    expect(repository.confidence_records.length).toBe(repository.source_risk_report.forecasts.length);
    expect(repository.confidence_records.every((record) => record.pipeline_state === "PUBLISHED")).toBe(true);
    expect(repository.confidence_records.every((record) => record.supporting_metrics.length === 8)).toBe(true);
    expect(repository.confidence_records.every((record) => record.overall_forecast_reliability > 0)).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("reproduces confidence, reliability, evidence quality, historical accuracy, replay consistency, and governance certainty deterministically", () => {
    const first = runForecastConfidence();
    const second = runForecastConfidence();

    expect(first.repository_hash).toBe(second.repository_hash);
    expect(first.reliability_scores).toEqual(second.reliability_scores);
    expect(first.evidence_quality_metrics).toEqual(second.evidence_quality_metrics);
    expect(first.historical_performance_metrics).toEqual(second.historical_performance_metrics);
    expect(first.governance_certainty_results).toEqual(second.governance_certainty_results);
    expect(first.replay_consistency_results).toEqual(second.replay_consistency_results);
  });

  it("explains confidence calculations with traceable factors, assumptions, and limitations", () => {
    const repository = runForecastConfidence();

    expect(repository.confidence_records.every((record) => record.confidence_explanation.length >= 4)).toBe(true);
    expect(repository.confidence_records.every((record) => record.supporting_metrics.every((metric) => metric.rationale && metric.source_references.length > 0))).toBe(true);
    expect(repository.confidence_records.every((record) => record.assumptions.length > 0)).toBe(true);
    expect(repository.confidence_records.every((record) => record.limitations.length > 0)).toBe(true);
  });

  it("preserves replay, lineage, integrity, governance validation, and constitutional compliance", () => {
    const repository = runForecastConfidence();

    expect(repository.replay_references.length).toBe(repository.confidence_records.length);
    expect(repository.lineage_references.length).toBe(repository.confidence_records.length);
    expect(repository.integrity_hashes.length).toBe(repository.confidence_records.length);
    expect(repository.confidence_records.every((record) => record.governance_validation === "PASS")).toBe(true);
    expect(repository.confidence_records.every((record) => record.constitutional_validation === "PASS")).toBe(true);
  });

  it("replays and hashes forecast confidence deterministically", () => {
    const repository = runForecastConfidence();
    const replay = replayForecastConfidence(repository);

    expect(repository.repository_hash).toBe(computeForecastConfidenceRepositoryHash(repository));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(repository.repository_hash);
  });

  it("enforces advisory-only confidence behavior", () => {
    const repository = runForecastConfidence();
    const validation = validateForecastConfidence(repository);

    expect(repository.confidence_records.every((record) => record.advisory_only)).toBe(true);
    expect(repository.confidence_records.every((record) => !record.prediction_modified && !record.threshold_modified && !record.execution_authorized)).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["HIDDEN_CONFIDENCE_FACTOR", "HIDDEN_CONFIDENCE_FACTOR_DETECTED"],
    ["CONFIDENCE_MANIPULATION", "CONFIDENCE_MANIPULATION_DETECTED"],
    ["THRESHOLD_MODIFICATION_ATTEMPT", "AUTONOMOUS_THRESHOLD_MODIFICATION_DETECTED"],
    ["CONFIDENCE_WITHOUT_EVIDENCE", "CONFIDENCE_WITHOUT_EVIDENCE_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["GOVERNANCE_CERTAINTY_OMITTED", "GOVERNANCE_CERTAINTY_OMITTED"],
    ["CROSS_TENANT_EVALUATION", "CROSS_TENANT_CONFIDENCE_EVALUATION_DETECTED"],
  ] as readonly [ForecastConfidenceScenario, ForecastConfidenceFailure][])("fails closed for %s", (scenario, failure) => {
    const repository = runForecastConfidence({ scenario });
    const validation = validateForecastConfidence(repository);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible forecast confidence diagnostics", () => {
    const surface = buildForecastConfidenceObservabilitySurface(runForecastConfidence());

    expect(surface.confidence_count).toBeGreaterThan(0);
    expect(surface.average_reliability).toBeGreaterThan(0);
    expect(surface.highest_confidence_level).toMatch(/VERY_HIGH|HIGH|MEDIUM|LOW|VERY_LOW|INSUFFICIENT/);
    expect(surface.lowest_uncertainty_level).toMatch(/MINIMAL|LOW|MODERATE|HIGH|SEVERE|UNKNOWN/);
    expect(surface.advisory_only).toBe(true);
  });
});
