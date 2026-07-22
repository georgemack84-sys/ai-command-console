import { describe, expect, it } from "vitest";
import {
  ANALYTICS_SIGNAL_TYPES,
  ANALYTICS_WINDOWS,
  BOTTLENECK_SEVERITIES,
  OPERATIONAL_HEALTH_STATES,
  TREND_DIRECTIONS,
  computeAnalyticsMetricRecordHash,
  getObservabilityAnalyticsFoundation,
  replayObservabilityAnalyticsEngine,
  runObservabilityAnalyticsEngine,
} from "@/services/decision-observability-analytics-engine";
import type { ObservabilityAnalyticsFailure, ObservabilityAnalyticsInput } from "@/types/decision-observability-analytics-engine";

describe("Mission Control Phase 9.11.9 Observability Analytics Engine", () => {
  it("publishes the observability analytics foundation", () => {
    const foundation = getObservabilityAnalyticsFoundation();

    expect(foundation.analytics_version).toBe("decision-observability-analytics-engine/v1");
    expect(foundation.analytics_windows).toEqual(ANALYTICS_WINDOWS);
    expect(foundation.bottleneck_severities).toEqual(BOTTLENECK_SEVERITIES);
    expect(foundation.trend_directions).toEqual(TREND_DIRECTIONS);
    expect(foundation.health_states).toEqual(OPERATIONAL_HEALTH_STATES);
    expect(foundation.signal_types).toEqual(ANALYTICS_SIGNAL_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("calculates deterministic metrics, throughput, bottlenecks, trends, and health", () => {
    const first = runObservabilityAnalyticsEngine();
    const second = runObservabilityAnalyticsEngine();

    expect(second).toEqual(first);
    expect(first.metric_records.map((record) => record.metric_name)).toContain("decision_volume");
    expect(first.throughput_metrics.decisions_in).toBe(6);
    expect(first.throughput_metrics.decisions_completed).toBe(1);
    expect(first.bottlenecks.map((record) => record.bottleneck_type)).toContain("GOVERNANCE_DELAY");
    expect(first.trends.every((trend) => trend.trend_direction === "STABLE")).toBe(true);
    expect(first.operational_health.health_score).toBeGreaterThan(0);
  });

  it("preserves metric integrity, source lineage, and immutable analytics evidence", () => {
    const result = runObservabilityAnalyticsEngine();

    expect(result.metric_records.every((record) => computeAnalyticsMetricRecordHash(record) === record.integrity_hash)).toBe(true);
    expect(result.source_snapshot.source_dashboard_refs.length).toBeGreaterThan(0);
    expect(result.source_snapshot.source_ledger_refs.length).toBeGreaterThan(0);
    expect(result.analytics_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.analytics_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("shows governance, replay, certification, risk, confidence, and operator analytics", () => {
    const result = runObservabilityAnalyticsEngine();

    expect(result.health_signals.map((signal) => signal.signal_type)).toEqual(ANALYTICS_SIGNAL_TYPES);
    expect(result.decision_analytics.certification_refs.length).toBeGreaterThan(0);
    expect(result.bottlenecks.some((record) => record.governance_refs.length > 0)).toBe(true);
    expect(result.metric_records.find((record) => record.metric_name === "replay_success_rate")?.metric_value).toBe(100);
    expect(result.metric_records.find((record) => record.metric_name === "confidence_quality")?.metric_value).toBe(0.82);
  });

  it("remains replayable and advisory-only", () => {
    const result = runObservabilityAnalyticsEngine();

    expect(replayObservabilityAnalyticsEngine(result)).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_observability_or_orchestration).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("validates every analytics boundary", () => {
    const result = runObservabilityAnalyticsEngine();

    expect(result.validation.deterministic_analytics).toBe(true);
    expect(result.validation.throughput_consistent).toBe(true);
    expect(result.validation.bottlenecks_detected).toBe(true);
    expect(result.validation.trends_not_fabricated).toBe(true);
    expect(result.validation.missing_data_preserved).toBe(true);
    expect(result.validation.governance_delays_visible).toBe(true);
    expect(result.validation.replay_failures_included).toBe(true);
    expect(result.validation.certification_blockers_visible).toBe(true);
    expect(result.validation.source_lineage_complete).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC_ANALYTICS", "ANALYTICS_NONDETERMINISTIC"],
    ["BAD_THROUGHPUT", "THROUGHPUT_CALCULATION_INCONSISTENT"],
    ["MISS_BOTTLENECKS", "BOTTLENECKS_MISSED"],
    ["FABRICATE_TRENDS", "TRENDS_FABRICATED"],
    ["MISSING_DATA_AS_ZERO", "MISSING_DATA_TREATED_AS_ZERO"],
    ["SUPPRESS_GOVERNANCE_DELAYS", "GOVERNANCE_DELAYS_SUPPRESSED"],
    ["EXCLUDE_REPLAY_FAILURES", "REPLAY_FAILURES_EXCLUDED"],
    ["OMIT_CERTIFICATION_BLOCKERS", "CERTIFICATION_BLOCKERS_OMITTED"],
    ["INCOMPLETE_LINEAGE", "SOURCE_LINEAGE_INCOMPLETE"],
    ["MUTABLE_LEDGER", "ANALYTICS_LEDGER_MUTABLE"],
    ["CROSS_TENANT", "CROSS_TENANT_ANALYTICS_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "ANALYTICS_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ObservabilityAnalyticsInput["scenario"]>, ObservabilityAnalyticsFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runObservabilityAnalyticsEngine({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_observability_or_orchestration).toBe(false);
  });

  it("fails closed when the role lacks analytics visibility", () => {
    const result = runObservabilityAnalyticsEngine({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runObservabilityAnalyticsEngine();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayObservabilityAnalyticsEngine(tampered)).toBe(false);
  });
});
