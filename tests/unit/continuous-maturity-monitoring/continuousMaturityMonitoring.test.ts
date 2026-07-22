import { describe, expect, it } from "vitest";
import {
  buildContinuousMaturityMonitoringObservabilitySurface,
  getContinuousMaturityMonitoringBundle,
  listMaturityMonitoringAlerts,
  listMaturityMonitoringChanges,
  listMaturityMonitoringLedger,
  listMaturityMonitoringTriggers,
  runContinuousMaturityMonitoring,
  validateContinuousMaturityMonitoring,
} from "@/services/continuous-maturity-monitoring";
import type { ContinuousMaturityMonitoringFailure, ContinuousMaturityMonitoringScenario } from "@/types/continuous-maturity-monitoring";

describe("continuous maturity monitoring", () => {
  it("publishes deterministic advisory-only monitoring bundle", () => {
    const bundle = getContinuousMaturityMonitoringBundle();

    expect(bundle.doctrine.engine_version).toBe("continuous-maturity-monitoring/v8ALT.11.11");
    expect(bundle.doctrine.final_state).toBe("CONTINUOUS_MATURITY_MONITORING_READY");
    expect(bundle.repository.final_state).toBe("CONTINUOUS_MATURITY_MONITORING_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.runtime_behavior_modification_authorized).toBe(false);
    expect(bundle.repository.maturity_level_change_authorized).toBe(false);
    expect(bundle.repository.certification_approval_authorized).toBe(false);
    expect(bundle.repository.operator_authority_bypass_authorized).toBe(false);
  });

  it("builds monitoring cycle artifacts without starting background jobs", () => {
    const repository = runContinuousMaturityMonitoring();

    expect(repository.rules).toHaveLength(11);
    expect(repository.changes).toHaveLength(11);
    expect(repository.triggers).toHaveLength(11);
    expect(repository.schedules).toHaveLength(7);
    expect(repository.alerts).toHaveLength(11);
    expect(repository.ledger).toHaveLength(1);
    expect(repository.schedules.every((schedule) => schedule.background_job_started === false && schedule.advisory_only)).toBe(true);
    expect(repository.triggers.every((trigger) => trigger.assessment_execution_authorized === false && trigger.advisory_only)).toBe(true);
    expect(repository.failures).toEqual([]);
  });

  it("maps runtime monitoring through canonical maturity domains", () => {
    const runtimeChange = runContinuousMaturityMonitoring().changes.find((change) => change.monitored_domain === "RUNTIME");

    expect(runtimeChange?.affected_maturity_domains).toEqual(["EXECUTION_INTELLIGENCE", "RESILIENCE", "VISIBILITY"]);
    expect(runtimeChange?.affected_maturity_domains).not.toContain("RUNTIME_ASSURANCE");
  });

  it("keeps monitoring deterministic and exposes slices", () => {
    const first = runContinuousMaturityMonitoring();
    const second = runContinuousMaturityMonitoring();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.audit_report.integrity_hash).toBe(first.audit_report.integrity_hash);
    expect(listMaturityMonitoringChanges()).toHaveLength(11);
    expect(listMaturityMonitoringTriggers()).toHaveLength(11);
    expect(listMaturityMonitoringAlerts()).toHaveLength(11);
    expect(listMaturityMonitoringLedger()).toHaveLength(1);
  });

  it.each([
    ["CHANGES_NOT_DETECTED", "MONITORED_CHANGES_NOT_DETECTED"],
    ["TRIGGER_MISMATCH", "ASSESSMENT_TRIGGERS_DIFFERED_FOR_IDENTICAL_EVENTS"],
    ["NONDETERMINISTIC_ALERTS", "ALERTS_NONDETERMINISTIC"],
    ["MONITORING_HISTORY_MODIFIED", "MONITORING_HISTORY_MODIFIED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["GOVERNANCE_CHANGES_MISSED", "GOVERNANCE_CHANGES_MISSED"],
    ["CONSTITUTIONAL_CHANGES_MISSED", "CONSTITUTIONAL_CHANGES_MISSED"],
    ["CERTIFICATION_CHANGES_MISSED", "CERTIFICATION_CHANGES_MISSED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_MONITORING_LOGIC", "HIDDEN_MONITORING_LOGIC_DETECTED"],
    ["RUNTIME_BEHAVIOR_MODIFICATION", "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED"],
    ["OPERATOR_AUTHORITY_BYPASS", "OPERATOR_AUTHORITY_BYPASSED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
  ] satisfies [ContinuousMaturityMonitoringScenario, ContinuousMaturityMonitoringFailure][])("invalidates %s", (scenario, failure) => {
    const repository = runContinuousMaturityMonitoring({ scenario });
    const validation = validateContinuousMaturityMonitoring(repository);

    expect(repository.final_state).toBe("CONTINUOUS_MATURITY_MONITORING_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.runtime_behavior_modification_authorized).toBe(false);
    expect(repository.operator_authority_bypass_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "CHANGES_NOT_DETECTED" })).changes_detected).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "TRIGGER_MISMATCH" })).triggers_deterministic).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "NONDETERMINISTIC_ALERTS" })).alerts_deterministic).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "MONITORING_HISTORY_MODIFIED" })).history_immutable).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "REPLAY_RECONSTRUCTION_MISMATCH" })).replay_reconstruction_verified).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "GOVERNANCE_CHANGES_MISSED" })).governance_changes_detected).toBe(false);
    expect(validateContinuousMaturityMonitoring(runContinuousMaturityMonitoring({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without runtime authority", () => {
    const surface = buildContinuousMaturityMonitoringObservabilitySurface(runContinuousMaturityMonitoring({ scenario: "HIDDEN_MONITORING_LOGIC" }));

    expect(surface.final_state).toBe("CONTINUOUS_MATURITY_MONITORING_FAILED");
    expect(surface.rule_count).toBe(11);
    expect(surface.change_count).toBe(11);
    expect(surface.trigger_count).toBe(11);
    expect(surface.schedule_count).toBe(7);
    expect(surface.alert_count).toBe(11);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.runtime_behavior_modification_authorized).toBe(false);
  });
});
