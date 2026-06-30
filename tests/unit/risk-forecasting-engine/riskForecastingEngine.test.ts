import { describe, expect, it, vi } from "vitest";
import {
  buildRiskForecastObservabilitySurface,
  computeRiskForecastingReportHash,
  getRiskForecastingEngineContract,
  replayRiskForecasting,
  runRiskForecasting,
  validateRiskForecasting,
} from "@/services/risk-forecasting-engine";
import type { RiskForecastFailure, RiskForecastScenario, RiskForecastType } from "@/types/risk-forecasting-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.3 Risk Forecasting Engine", () => {
  it("defines the deterministic advisory-only forecasting doctrine", () => {
    const contract = getRiskForecastingEngineContract();

    expect(contract.doctrine.engine_version).toBe("risk-forecasting-engine/v8ALT.3.3");
    expect(contract.doctrine.principles).toContain("deterministic-forecasting");
    expect(contract.doctrine.principles).toContain("advisory-only-recommendations");
    expect(contract.doctrine.forecast_types).toEqual(["EXECUTION_BOTTLENECK", "DEPENDENCY_FAILURE", "RESOURCE_SHORTAGE", "GOVERNANCE_VIOLATION", "CONFIDENCE_COLLAPSE", "REPLAY_INSTABILITY", "INTEGRITY_DEGRADATION", "ORCHESTRATION_CONGESTION", "RECOVERY_PROBABILITY"]);
    expect(contract.doctrine.severity_levels).toEqual(["MINIMAL", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates complete risk forecasts from historical intelligence", () => {
    const report = runRiskForecasting();
    const validation = validateRiskForecasting(report);

    expect(report.forecasts.length).toBe(9);
    expect(report.forecasts.every((forecast) => forecast.pipeline_state === "PUBLISHED")).toBe(true);
    expect(report.forecasts.every((forecast) => forecast.supporting_evidence.length > 0)).toBe(true);
    expect(report.forecasts.every((forecast) => forecast.historical_correlations.length > 0)).toBe(true);
    expect(report.repository.forecast_ids).toEqual(report.forecasts.map((forecast) => forecast.forecast_id));
    expect(validation.valid).toBe(true);
  });

  it.each([
    "EXECUTION_BOTTLENECK",
    "DEPENDENCY_FAILURE",
    "RESOURCE_SHORTAGE",
    "GOVERNANCE_VIOLATION",
    "CONFIDENCE_COLLAPSE",
    "REPLAY_INSTABILITY",
    "INTEGRITY_DEGRADATION",
    "ORCHESTRATION_CONGESTION",
    "RECOVERY_PROBABILITY",
  ] as readonly RiskForecastType[])("forecasts %s deterministically", (forecast_type) => {
    const first = runRiskForecasting({ forecast_type });
    const second = runRiskForecasting({ forecast_type });

    expect(first.forecasts[0].forecast_type).toBe(forecast_type);
    expect(first.report_hash).toBe(second.report_hash);
    expect(first.forecasts[0].forecast_hash).toBe(second.forecasts[0].forecast_hash);
  });

  it("produces reproducible confidence, evidence, explanations, correlations, and replay", () => {
    const report = runRiskForecasting();
    const replay = replayRiskForecasting(report);

    expect(report.forecasts.every((forecast) => forecast.projected_confidence >= 0 && forecast.projected_confidence <= 1)).toBe(true);
    expect(report.forecasts.every((forecast) => forecast.explanation.length >= 7)).toBe(true);
    expect(report.forecasts.every((forecast) => forecast.supporting_evidence.every((evidence) => evidence.integrity_hash))).toBe(true);
    expect(report.forecasts.every((forecast) => forecast.historical_correlations.every((correlation) => correlation.correlation_hash))).toBe(true);
    expect(replay.deterministic).toBe(true);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_EXPLANATION", "EXPLANATION_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["GOVERNANCE_INVALID", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_INVALID", "CONSTITUTIONAL_INVALID"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
    ["AUTONOMOUS_MITIGATION_ATTEMPT", "ADVISORY_ONLY_VIOLATION"],
    ["EXECUTION_MODIFICATION_ATTEMPT", "EXECUTION_MODIFICATION_DETECTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPT", "GOVERNANCE_MODIFICATION_DETECTED"],
    ["POLICY_BYPASS", "POLICY_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["CROSS_TENANT_FORECAST", "CROSS_TENANT_FORECAST_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
  ] as readonly [RiskForecastScenario, RiskForecastFailure][])("fails closed for %s", (scenario, failure) => {
    const report = runRiskForecasting({ scenario });
    const validation = validateRiskForecasting(report);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only behavior and never executes mitigation in baseline", () => {
    const report = runRiskForecasting();
    const validation = validateRiskForecasting(report);

    expect(report.advisory_only).toBe(true);
    expect(report.forecasts.every((forecast) => !forecast.mitigation_executed && !forecast.execution_modified && !forecast.governance_modified)).toBe(true);
    expect(validation.advisory_only).toBe(true);
  });

  it("hashes risk forecasts deterministically", () => {
    const first = runRiskForecasting();
    const second = runRiskForecasting();

    expect(second.report_hash).toBe(first.report_hash);
    expect(first.report_hash).toBe(computeRiskForecastingReportHash(first));
  });

  it("exposes operator-visible risk forecast diagnostics", () => {
    const surface = buildRiskForecastObservabilitySurface(runRiskForecasting());

    expect(surface.forecast_count).toBe(9);
    expect(surface.highest_probability).toMatch(/HIGH|VERY_HIGH|NEAR_CERTAIN|MODERATE/);
    expect(surface.tenant_id).toBe("tenant:autonomy:primary");
    expect(surface.advisory_only).toBe(true);
  });
});
