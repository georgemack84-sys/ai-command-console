import { describe, expect, it, vi } from "vitest";
import {
  analyzeMissionTrend,
  buildMissionTrendObservabilitySurface,
  getMissionTrendIntelligenceEngineContract,
  replayMissionTrend,
  validateMissionTrend,
} from "@/services/mission-trend-intelligence-engine";
import type { MissionTrendFailure, MissionTrendScenario } from "@/types/mission-trend-intelligence-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.4 Mission Trend Intelligence Engine", () => {
  it("defines the advisory-only mission trend doctrine", () => {
    const contract = getMissionTrendIntelligenceEngineContract();

    expect(contract.doctrine.engine_version).toBe("mission-trend-intelligence-engine/v8ALT.4.4");
    expect(contract.doctrine.principles).toContain("deterministic-trend-analysis");
    expect(contract.doctrine.principles).toContain("subsystem-drift-detection");
    expect(contract.doctrine.principles).toContain("advisory-only-behavior");
    expect(contract.doctrine.supported_windows).toEqual(["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MISSION_LIFECYCLE"]);
    expect(contract.validation.valid).toBe(true);
  });

  it("analyzes a complete mission health timeline deterministically", () => {
    const trend = analyzeMissionTrend();
    const validation = validateMissionTrend(trend);

    expect(trend.processing_state).toBe("TREND_PUBLICATION");
    expect(trend.timeline.entries.length).toBeGreaterThanOrEqual(2);
    expect(trend.moving_average.health).toBeGreaterThan(0);
    expect(trend.subsystem_drift.length).toBe(8);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["IMPROVING", "IMPROVING"],
    ["DEGRADING", "DEGRADING"],
    ["OSCILLATING", "OSCILLATING"],
    ["LONG_TERM_DEGRADATION", "LONG_TERM_DEGRADATION"],
    ["RECOVERING", "RECOVERING"],
  ] as const)("classifies %s timelines", (scenario, expected) => {
    const trend = analyzeMissionTrend({ scenario });

    expect(trend.trend_state).toBe(expected);
    expect(trend.trend_strength).toBeGreaterThan(0);
  });

  it("calculates moving averages, degradation velocity, recovery trend, and forecasts", () => {
    const trend = analyzeMissionTrend({ scenario: "DEGRADING" });

    expect(trend.moving_average.moving_average_hash).toBeTruthy();
    expect(trend.degradation_velocity.current_velocity).toBeLessThan(0);
    expect(trend.degradation_velocity.severity).not.toBe("NONE");
    expect(trend.recovery_trend.recovery_state).toBe("NO_RECOVERY");
    expect(trend.forecast.length).toBe(5);
    expect(trend.forecast.every((item) => item.advisory_only && item.forecast_hash)).toBe(true);
  });

  it("detects subsystem drift and oscillation deterministically", () => {
    const trend = analyzeMissionTrend({ scenario: "OSCILLATING" });

    expect(["HIGH_OSCILLATION", "UNSTABLE"]).toContain(trend.oscillation_class);
    expect(trend.oscillation_frequency).toBeGreaterThanOrEqual(3);
    expect(trend.oscillation_amplitude).toBeGreaterThan(0);
    expect(trend.subsystem_drift.every((item) => item.drift_hash)).toBe(true);
  });

  it("links trend evidence, replay, lineage, and integrity", () => {
    const trend = analyzeMissionTrend();
    const replay = replayMissionTrend(trend);

    expect(trend.evidence.length).toBeGreaterThanOrEqual(5);
    expect(trend.evidence.every((item) => item.integrity_hash && item.lineage_reference && item.replay_reference)).toBe(true);
    expect(trend.evidence_reference).toBeTruthy();
    expect(trend.lineage_reference).toBeTruthy();
    expect(trend.replay_reference).toBeTruthy();
    expect(trend.integrity_hash).toBeTruthy();
    expect(replay.deterministic).toBe(true);
  });

  it("replays identical timelines into identical trend calculations", () => {
    const first = analyzeMissionTrend({ scenario: "IMPROVING" });
    const second = analyzeMissionTrend({ scenario: "IMPROVING" });

    expect(first.trend_hash).toBe(second.trend_hash);
    expect(first.forecast.map((item) => item.forecast_hash)).toEqual(second.forecast.map((item) => item.forecast_hash));
    expect(first.evidence.map((item) => item.evidence_hash)).toEqual(second.evidence.map((item) => item.evidence_hash));
  });

  it("enforces advisory-only trend behavior", () => {
    const trend = analyzeMissionTrend();
    const validation = validateMissionTrend(trend);

    expect(trend.advisory_only).toBe(true);
    expect(trend.autonomous_intervention_initiated).toBe(false);
    expect(trend.mission_state_modified).toBe(false);
    expect(trend.subsystem_health_modified).toBe(false);
    expect(trend.governance_policy_modified).toBe(false);
    expect(trend.authority_escalated).toBe(false);
    expect(trend.recovery_authorized).toBe(false);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["INCOMPLETE_HISTORY", "HEALTH_HISTORY_INCOMPLETE"],
    ["NONDETERMINISTIC_ORDER", "TIMELINE_ORDER_INVALID"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_INVALID"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_INVALID"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [MissionTrendScenario, MissionTrendFailure][])("rejects %s", (scenario, failure) => {
    const trend = analyzeMissionTrend({ scenario });
    const validation = validateMissionTrend(trend);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(trend.processing_state).toBe("REJECTED");
  });

  it("exposes operator-visible trend diagnostics", () => {
    const surface = buildMissionTrendObservabilitySurface(analyzeMissionTrend({ scenario: "DEGRADING" }));

    expect(surface.trend_id).toBeTruthy();
    expect(surface.trend_state).toBe("DEGRADING");
    expect(surface.degradation_velocity).toBeLessThan(0);
    expect(surface.forecast_count).toBe(5);
    expect(surface.advisory_only).toBe(true);
  });
});
