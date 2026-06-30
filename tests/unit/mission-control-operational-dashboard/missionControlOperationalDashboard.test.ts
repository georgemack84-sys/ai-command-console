import { describe, expect, it } from "vitest";
import {
  buildMissionControlOperationalDashboardObservabilitySurface,
  computeMissionControlOperationalDashboardHash,
  getMissionControlOperationalDashboardContract,
  runMissionControlOperationalDashboard,
  validateMissionControlOperationalDashboard,
} from "@/services/mission-control-operational-dashboard";
import type { MissionControlOperationalDashboardScenario, OperationalDashboardFailure } from "@/types/mission-control-operational-dashboard";

describe("Mission Control Phase 8J.2 Operational Dashboard", () => {
  it("defines operational dashboard doctrine and controlled states", () => {
    const contract = getMissionControlOperationalDashboardContract();

    expect(contract.doctrine.schema_version).toBe("mission-control-operational-dashboard/v8J.2");
    expect(contract.doctrine.principles).toContain("read-only-visibility");
    expect(contract.doctrine.principles).toContain("operator-supremacy");
    expect(contract.doctrine.timeline_event_types).toContain("CHECKPOINT_CREATED");
    expect(contract.doctrine.execution_states).toEqual(["PLANNING", "READY", "RUNNING", "WAITING", "PAUSED", "INTERVENED", "COMPLETED", "FAILED", "ROLLED_BACK"]);
    expect(contract.doctrine.refresh_modes).toEqual(["REAL_TIME", "EVENT_DRIVEN", "REPLAY_MODE", "SNAPSHOT_MODE"]);
    expect(contract.doctrine.no_execution_authority).toBe(true);
  });

  it("builds a valid deterministic operational dashboard", () => {
    const report = runMissionControlOperationalDashboard();
    const validation = validateMissionControlOperationalDashboard(report);

    expect(report.phase_version).toBe("8J.2");
    expect(report.validation_outcome).toBe("VALID");
    expect(report.timeline.length).toBe(13);
    expect(report.state_monitor.current_state).toBe("COMPLETED");
    expect(report.governance_panel?.governance_status).toBe("PASS");
    expect(report.confidence_monitor.overall_confidence).toBe(0.89);
    expect(report.risk_monitor.length).toBe(4);
    expect(report.supervision_monitor?.supervision_state).toBe("STABLE");
    expect(report.mission_summary.execution_progress).toBe(1);
    expect(report.alerts.length).toBe(5);
    expect(report.advisory_only).toBe(true);
    expect(report.execution_authority_granted).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it("displays timeline coverage for current, pending, failed, retry, checkpoint, rollback, and completed work", () => {
    const timeline = runMissionControlOperationalDashboard().timeline;

    expect(timeline.map((event) => event.event_type)).toContain("EXECUTION_STARTED");
    expect(timeline.map((event) => event.execution_state)).toContain("WAITING");
    expect(timeline.map((event) => event.event_type)).toContain("FAILURE_DETECTED");
    expect(timeline.map((event) => event.event_type)).toContain("RETRY_STARTED");
    expect(timeline.some((event) => event.checkpoint_reference)).toBe(true);
    expect(timeline.some((event) => event.rollback_reference)).toBe(true);
    expect(timeline.map((event) => event.event_type)).toContain("MISSION_COMPLETED");
    expect(timeline.every((event, index) => event.step_order === index + 1)).toBe(true);
  });

  it("preserves replay, lineage, and integrity references across displayed elements", () => {
    const report = runMissionControlOperationalDashboard();

    expect(report.timeline.every((event) => event.replay_reference)).toBe(true);
    expect(report.timeline.every((event) => event.lineage_reference)).toBe(true);
    expect(report.timeline.every((event) => event.integrity_hash)).toBe(true);
    expect(report.state_monitor.replay_reference).toBeTruthy();
    expect(report.governance_panel?.evidence_reference).toBeTruthy();
    expect(report.confidence_monitor.confidence_factors.length).toBeGreaterThan(0);
    expect(report.risk_monitor.every((risk) => risk.mitigation.length > 0)).toBe(true);
    expect(report.supervision_monitor?.drift_status).toBe("MINOR");
  });

  it("supports replay and snapshot refresh modes with immutable historical snapshots", () => {
    const replay = runMissionControlOperationalDashboard({ refresh_mode: "REPLAY_MODE" });
    const snapshot = runMissionControlOperationalDashboard({ refresh_mode: "SNAPSHOT_MODE" });

    expect(replay.refresh_record.replay_frozen_at).toBeTruthy();
    expect(replay.refresh_record.historical_snapshot_immutable).toBe(true);
    expect(snapshot.refresh_record.replay_frozen_at).toBeTruthy();
    expect(snapshot.refresh_record.historical_snapshot_immutable).toBe(true);
  });

  it("repeats identical dashboards with identical hashes", () => {
    const first = runMissionControlOperationalDashboard();
    const second = runMissionControlOperationalDashboard();

    expect(second.dashboard_hash).toBe(first.dashboard_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.timeline.map((event) => event.event_hash)).toEqual(first.timeline.map((event) => event.event_hash));
    expect(first.dashboard_hash).toBe(computeMissionControlOperationalDashboardHash(first));
  });

  it.each([
    ["INCOMPLETE_TIMELINE", "EXECUTION_TIMELINE_INCOMPLETE"],
    ["NONDETERMINISTIC_STATE", "DASHBOARD_STATE_NONDETERMINISTIC"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_EXISTS"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_STATUS_MISSING"],
    ["CONFIDENCE_NOT_REPRODUCIBLE", "CONFIDENCE_METRICS_NOT_REPRODUCIBLE"],
    ["RISK_INCONSISTENT", "RISK_INDICATORS_INCONSISTENT"],
    ["SUPERVISION_UNAVAILABLE", "SUPERVISION_HEALTH_UNAVAILABLE"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_LINEAGE_REFERENCE", "LINEAGE_REFERENCE_MISSING"],
    ["MISSING_INTEGRITY_HASH", "INTEGRITY_HASH_MISSING"],
    ["EXECUTION_AUTHORITY_EXPOSED", "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED"],
    ["UNAUTHORIZED_ACCESS", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["CROSS_TENANT_DISPLAY", "CROSS_TENANT_INFORMATION_DISPLAYED"],
  ] as readonly [MissionControlOperationalDashboardScenario, OperationalDashboardFailure][])(
    "invalidates %s with %s",
    (scenario, failure) => {
      const report = runMissionControlOperationalDashboard({ scenario });
      const validation = validateMissionControlOperationalDashboard(report);

      expect(report.validation_outcome).toBe("INVALID");
      expect(report.failures).toContain(failure);
      expect(report.validation_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes operator observability for dashboard failures", () => {
    const surface = buildMissionControlOperationalDashboardObservabilitySurface(runMissionControlOperationalDashboard({ scenario: "SUPERVISION_UNAVAILABLE" }));

    expect(surface.validation_outcome).toBe("INVALID");
    expect(surface.failures).toContain("SUPERVISION_HEALTH_UNAVAILABLE");
    expect(surface.supervision_state).toBeNull();
    expect(surface.timeline_events).toBe(13);
    expect(surface.failed_tests).toBeGreaterThan(0);
  });
});
