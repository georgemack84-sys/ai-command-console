import { describe, expect, it } from "vitest";
import {
  CERTIFICATION_MONITORING_STATES,
  DIVERGENCE_SEVERITIES,
  DIVERGENCE_STATES,
  REPLAY_INTEGRITY_STATES,
  REPLAY_MONITORING_STATES,
  computeReplayHealthRecordHash,
  getReplayCertificationMonitoringFoundation,
  replayReplayCertificationMonitoring,
  runReplayCertificationMonitoring,
} from "@/services/decision-replay-certification-monitoring";
import type { ReplayCertificationMonitoringFailure, ReplayCertificationMonitoringInput } from "@/types/decision-replay-certification-monitoring";

describe("Mission Control Phase 9.11.7 Replay & Certification Monitoring", () => {
  it("publishes the replay and certification monitoring foundation", () => {
    const foundation = getReplayCertificationMonitoringFoundation();

    expect(foundation.monitoring_version).toBe("decision-replay-certification-monitoring/v1");
    expect(foundation.replay_states).toEqual(REPLAY_MONITORING_STATES);
    expect(foundation.integrity_states).toEqual(REPLAY_INTEGRITY_STATES);
    expect(foundation.certification_states).toEqual(CERTIFICATION_MONITORING_STATES);
    expect(foundation.divergence_states).toEqual(DIVERGENCE_STATES);
    expect(foundation.divergence_severities).toEqual(DIVERGENCE_SEVERITIES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("renders deterministic replay, status, integrity, certification, and divergence monitoring", () => {
    const first = runReplayCertificationMonitoring();
    const second = runReplayCertificationMonitoring();

    expect(second).toEqual(first);
    expect(first.replay_dashboard.replay_state).toBe("VERIFIED");
    expect(first.replay_dashboard.replay_progress).toBe(100);
    expect(first.replay_status_monitor.replay_success_rate).toBe(100);
    expect(first.replay_integrity_dashboard.integrity_state).toBe("VERIFIED");
    expect(first.certification_dashboard.certification_state).toBe("PASS");
    expect(first.divergence_monitor).toHaveLength(0);
  });

  it("preserves health record integrity and immutable replay monitoring evidence", () => {
    const result = runReplayCertificationMonitoring();

    expect(result.health_records.every((record) => computeReplayHealthRecordHash(record) === record.integrity_hash)).toBe(true);
    expect(result.replay_monitoring_ledger).toHaveLength(4);
    expect(result.replay_monitoring_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.replay_monitoring_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("shows replay refs, certification refs, and production readiness", () => {
    const result = runReplayCertificationMonitoring();

    expect(result.replay_dashboard.replay_refs.length).toBeGreaterThan(0);
    expect(result.replay_integrity_dashboard.reconstruction_results.length).toBeGreaterThan(0);
    expect(result.certification_dashboard.completed_tests.length).toBe(7);
    expect(result.certification_dashboard.production_readiness).toBe("READY");
    expect(result.monitoring_record.replay_ref).toBeTruthy();
    expect(result.monitoring_record.certification_ref).toBeTruthy();
  });

  it("remains replayable and advisory-only", () => {
    const result = runReplayCertificationMonitoring();

    expect(replayReplayCertificationMonitoring(result)).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_replay_or_certification).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("validates every monitoring boundary", () => {
    const result = runReplayCertificationMonitoring();

    expect(result.validation.replay_readiness_accurate).toBe(true);
    expect(result.validation.replay_execution_visible).toBe(true);
    expect(result.validation.replay_integrity_complete).toBe(true);
    expect(result.validation.certification_progress_visible).toBe(true);
    expect(result.validation.divergence_events_visible).toBe(true);
    expect(result.validation.deterministic_monitoring).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["BAD_REPLAY_READINESS", "REPLAY_READINESS_INACCURATE"],
    ["HIDE_REPLAY_EXECUTION", "REPLAY_EXECUTION_STATUS_HIDDEN"],
    ["INCOMPLETE_INTEGRITY_RESULTS", "REPLAY_INTEGRITY_RESULTS_INCOMPLETE"],
    ["OMIT_CERTIFICATION_PROGRESS", "CERTIFICATION_PROGRESS_OMITTED"],
    ["SUPPRESS_DIVERGENCE", "DIVERGENCE_EVENTS_SUPPRESSED"],
    ["NONDETERMINISTIC_MONITORING", "REPLAY_MONITORING_NONDETERMINISTIC"],
    ["CERTIFICATION_ENGINE_MISMATCH", "CERTIFICATION_ENGINE_MISMATCH"],
    ["MUTABLE_REPLAY_EVIDENCE", "REPLAY_EVIDENCE_MUTABLE"],
    ["MUTABLE_CERTIFICATION_EVIDENCE", "CERTIFICATION_EVIDENCE_MUTABLE"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["CROSS_TENANT", "CROSS_TENANT_REPLAY_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_MONITORING_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ReplayCertificationMonitoringInput["scenario"]>, ReplayCertificationMonitoringFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runReplayCertificationMonitoring({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_replay_or_certification).toBe(false);
  });

  it("fails closed when the role lacks replay monitoring visibility", () => {
    const result = runReplayCertificationMonitoring({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runReplayCertificationMonitoring();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayReplayCertificationMonitoring(tampered)).toBe(false);
  });
});
