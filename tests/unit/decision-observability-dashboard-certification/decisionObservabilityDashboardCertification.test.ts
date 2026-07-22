import { describe, expect, it } from "vitest";
import {
  OBSERVABILITY_DASHBOARD_CHECKS,
  OBSERVABILITY_DASHBOARD_SCOPES,
  computeDashboardSnapshotHash,
  getObservabilityDashboardCertificationFoundation,
  replayObservabilityDashboardCertification,
  runObservabilityDashboardCertification,
} from "@/services/decision-observability-dashboard-certification";
import type { ObservabilityDashboardCertificationFailure, ObservabilityDashboardCertificationInput } from "@/types/decision-observability-dashboard-certification";

describe("Mission Control Phase 9.12.9 Observability & Dashboard Certification", () => {
  it("publishes the observability dashboard certification foundation", () => {
    const foundation = getObservabilityDashboardCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-observability-dashboard-certification/v1");
    expect(foundation.scopes).toEqual(OBSERVABILITY_DASHBOARD_SCOPES);
    expect(foundation.checks).toEqual(OBSERVABILITY_DASHBOARD_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates dashboard snapshot coverage across lifecycle surfaces", () => {
    const result = runObservabilityDashboardCertification();

    expect(computeDashboardSnapshotHash(result.dashboard_snapshot)).toBe(result.dashboard_snapshot.integrity_hash);
    expect(result.coverage_report.validation_state).toBe("PASS");
    expect(result.coverage_report.covered_scopes).toEqual(OBSERVABILITY_DASHBOARD_SCOPES);
    expect(result.dashboard_snapshot.active_decisions.length).toBeGreaterThan(0);
    expect(result.dashboard_snapshot.blocked_decisions.length).toBeGreaterThan(0);
  });

  it("validates state, transition, timeline, replay, and governance visibility", () => {
    const result = runObservabilityDashboardCertification();

    expect(result.visibility_report.validation_state).toBe("PASS");
    expect(result.state_report.validation_state).toBe("PASS");
    expect(result.timeline_report.validation_state).toBe("PASS");
    expect(result.timeline_report.replay_chronology_complete).toBe(true);
    expect(result.timeline_report.governance_chronology_complete).toBe(true);
  });

  it("collects immutable evidence and writes observability ledger entries", () => {
    const result = runObservabilityDashboardCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.observability_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.observability_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the observability report for production readiness", () => {
    const result = runObservabilityDashboardCertification();

    expect(result.observability_report.certification_decision).toBe("PASS");
    expect(result.observability_report.production_readiness).toBe("READY");
    expect(result.validation.active_decisions_visible).toBe(true);
    expect(result.validation.operator_actions_visible).toBe(true);
    expect(result.validation.system_health_visible).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runObservabilityDashboardCertification();

    expect(replayObservabilityDashboardCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_dashboard_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["LEDGER_INVALID", "LEDGER_INTEGRITY_CERTIFICATION_INVALID"],
    ["HIDDEN_STATE", "HIDDEN_ORCHESTRATION_STATE"],
    ["HIDDEN_TRANSITION", "HIDDEN_WORKFLOW_TRANSITION"],
    ["MISSING_ACTIVE_DECISION", "MISSING_ACTIVE_DECISION"],
    ["MISSING_BLOCKED_DECISION", "MISSING_BLOCKED_DECISION"],
    ["MISSING_ESCALATION", "MISSING_ESCALATION"],
    ["MISSING_CONFLICT", "MISSING_CONFLICT"],
    ["MISSING_DEPENDENCY", "MISSING_DEPENDENCY"],
    ["MISSING_TIMELINE_EVENT", "MISSING_TIMELINE_EVENT"],
    ["MISSING_REPLAY_STATUS", "MISSING_REPLAY_STATUS"],
    ["MISSING_GOVERNANCE_STATUS", "MISSING_GOVERNANCE_STATUS"],
    ["MISSING_CERTIFICATION_STATUS", "MISSING_CERTIFICATION_STATUS"],
    ["MISSING_OPERATOR_ACTION", "MISSING_OPERATOR_ACTION"],
    ["INCORRECT_DASHBOARD_DATA", "INCORRECT_DASHBOARD_DATA"],
    ["REPLAY_DASHBOARD_INCONSISTENCY", "REPLAY_DASHBOARD_INCONSISTENCY"],
    ["GOVERNANCE_DASHBOARD_INCONSISTENCY", "GOVERNANCE_DASHBOARD_INCONSISTENCY"],
    ["CROSS_TENANT", "CROSS_TENANT_DASHBOARD_DATA_EXPOSURE"],
    ["HIDDEN_SYSTEM_HEALTH", "HIDDEN_SYSTEM_HEALTH_CONDITION"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_VISIBILITY_MISMATCH", "REPLAY_VISIBILITY_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_DASHBOARD_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ObservabilityDashboardCertificationInput["scenario"]>, ObservabilityDashboardCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runObservabilityDashboardCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.observability_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_dashboard_state).toBe(false);
  });

  it("fails closed when the role lacks observability visibility", () => {
    const result = runObservabilityDashboardCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects observability certification tampering", () => {
    const result = runObservabilityDashboardCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayObservabilityDashboardCertification(tampered)).toBe(false);
  });
});
