import { describe, expect, it, vi } from "vitest";
import {
  buildFailureObservationObservabilitySurface,
  getAnomalyLedger,
  getFailureObservationContract,
  getFailureTimeline,
  getSubsystemHealthReport,
  observeFailures,
  replayFailureObservation,
  validateFailureObservation,
} from "@/services/failure-observation-monitoring";
import type { FailureObservationFailure, FailureObservationScenario } from "@/types/failure-observation-monitoring";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.6.3 Failure Observation & Monitoring", () => {
  it("defines deterministic observation doctrine", () => {
    const contract = getFailureObservationContract();

    expect(contract.doctrine.engine_version).toBe("failure-observation-monitoring/v8ALT.6.3");
    expect(contract.doctrine.principles).toContain("deterministic-observations");
    expect(contract.doctrine.principles).toContain("operator-visible-monitoring");
    expect(contract.doctrine.observation_categories).toHaveLength(12);
    expect(contract.validation.valid).toBe(true);
  });

  it("observes every required autonomy monitor domain", () => {
    const ledger = observeFailures();
    const domains = ledger.observations.map((item) => item.observation_category);

    expect(ledger.append_only).toBe(true);
    expect(ledger.observations).toHaveLength(12);
    expect(domains).toContain("PLANNING_STABILITY");
    expect(domains).toContain("EXECUTION_HEALTH");
    expect(domains).toContain("GOVERNANCE_COMPLIANCE");
    expect(domains).toContain("RECOVERY_READINESS");
    expect(validateFailureObservation(ledger).valid).toBe(true);
  });

  it("produces timeline, health report, intervention log, and anomaly ledger", () => {
    const ledger = observeFailures();
    const timeline = getFailureTimeline();
    const report = getSubsystemHealthReport();
    const anomalies = getAnomalyLedger();

    expect(timeline).toHaveLength(12);
    expect(report.recovery_readiness).toBeGreaterThan(0);
    expect(ledger.intervention_log.length).toBeGreaterThan(0);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(ledger.degradation_graph.nodes.length).toBe(12);
  });

  it("replays observations deterministically", () => {
    const ledger = observeFailures();
    const replay = replayFailureObservation(ledger);

    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.original_hash);
    expect(replay.observation_count).toBe(12);
  });

  it.each([
    ["MISSING_STRESS_LEDGER", "STRESS_LEDGER_MISSING"],
    ["NONDETERMINISTIC_OBSERVATION_ORDERING", "OBSERVATION_ORDERING_NONDETERMINISTIC"],
    ["MISSING_MONITOR_DOMAIN", "MONITOR_DOMAIN_MISSING"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_UNDETECTED"],
    ["GOVERNANCE_VISIBILITY_FAILURE", "GOVERNANCE_VISIBILITY_FAILED"],
    ["CONSTITUTIONAL_VISIBILITY_FAILURE", "CONSTITUTIONAL_VISIBILITY_FAILED"],
    ["AUTHORITY_VISIBILITY_FAILURE", "AUTHORITY_VISIBILITY_FAILED"],
    ["INTEGRITY_FAILURE_NOT_DETECTED", "INTEGRITY_HASH_INVALID"],
    ["HIDDEN_OBSERVATION", "HIDDEN_OBSERVATION_DETECTED"],
    ["INCOMPLETE_TELEMETRY_EVIDENCE", "TELEMETRY_EVIDENCE_INCOMPLETE"],
    ["CROSS_TENANT_OBSERVATION", "CROSS_TENANT_OBSERVATION_DETECTED"],
    ["MISSING_ANOMALY_LEDGER", "ANOMALY_LEDGER_MISSING"],
    ["MISSING_RECOVERY_READINESS", "RECOVERY_READINESS_MISSING"],
    ["INTEGRITY_HASH_FAILURE", "INTEGRITY_HASH_INVALID"],
  ] as readonly [FailureObservationScenario, FailureObservationFailure][])("rejects %s", (scenario, failure) => {
    const ledger = observeFailures({ scenario });
    const validation = validateFailureObservation(ledger);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes observation observability", () => {
    const ledger = observeFailures();
    const surface = buildFailureObservationObservabilitySurface(ledger);

    expect(surface.ledger_id).toBe(ledger.ledger_id);
    expect(surface.observation_count).toBe(12);
    expect(surface.anomaly_count).toBe(12);
    expect(surface.monitor_domains).toContain("MISSION_HEALTH");
    expect(surface.append_only).toBe(true);
  });
});
