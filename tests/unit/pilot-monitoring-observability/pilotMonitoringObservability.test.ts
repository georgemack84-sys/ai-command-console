import { describe, expect, it } from "vitest";
import {
  getPilotMonitoringObservabilityBundle,
  replayPilotMonitoringObservability,
  runPilotMonitoringObservability,
  validatePilotMonitoringObservability,
} from "@/services/pilot-monitoring-observability";
import type { PilotMonitoringObservabilityFailure } from "@/types/pilot-monitoring-observability";

describe("Mission Control Phase 16.7 Pilot Monitoring & Observability", () => {
  it("publishes pilot monitoring observability doctrine", () => {
    const bundle = getPilotMonitoringObservabilityBundle();

    expect(bundle.doctrine.version).toBe("pilot-monitoring-observability/v16.7");
    expect(bundle.doctrine.upstream_phase).toBe("pilot-performance-reliability-validation/v16.6");
    expect(bundle.doctrine.monitor_types).toEqual(["RUNTIME_HEALTH", "ADVISORY_ACTIVITY", "REPLAY_HEALTH", "EVIDENCE_INGESTION", "OPERATOR_WORKFLOW", "CERTIFICATION_STATUS", "CONSTITUTIONAL_COMPLIANCE"]);
    expect(bundle.doctrine.alert_lifecycle).toEqual(["DETECTED", "VALIDATED", "CLASSIFIED", "NOTIFIED", "ACKNOWLEDGED", "INVESTIGATING", "ESCALATED", "RESOLVED", "CLOSED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("configures the complete pilot dashboard suite", () => {
    const result = runPilotMonitoringObservability();

    expect(result.dashboards).toHaveLength(7);
    expect(result.dashboards.map((dashboard) => dashboard.dashboard_type)).toEqual(["OPERATIONAL", "RUNTIME_HEALTH", "RECOMMENDATION", "REPLAY", "EVIDENCE", "CERTIFICATION", "GOVERNANCE"]);
    expect(result.dashboards.every((dashboard) => dashboard.complete && dashboard.lineage_reproducible && dashboard.informational_only)).toBe(true);
  });

  it("monitors all operational domains continuously", () => {
    const result = runPilotMonitoringObservability();

    expect(result.observability_records).toHaveLength(7);
    expect(result.metrics_registry.deterministic_collection).toBe(true);
    expect(result.metrics_registry.fully_observable).toBe(true);
    expect(result.metrics_registry.runtime_health_metrics.length).toBeGreaterThan(0);
    expect(result.metrics_registry.constitutional_compliance_metrics.length).toBeGreaterThan(0);
  });

  it("maintains observability registry and operational event stream", () => {
    const result = runPilotMonitoringObservability();

    expect(result.observability_registry.complete).toBe(true);
    expect(result.observability_registry.unified_evidence_platform).toBe(true);
    expect(result.event_stream.deterministic).toBe(true);
    expect(result.event_stream.immutable).toBe(true);
    expect(result.event_stream.tenant_isolated).toBe(true);
    expect(result.event_stream.events).toHaveLength(7);
  });

  it("validates deterministic immutable alert lifecycle", () => {
    const result = runPilotMonitoringObservability();

    expect(result.alerts).toHaveLength(6);
    expect(result.alerts.every((alert) => alert.validated && alert.deterministic_lifecycle && alert.immutable && alert.current_state === "CLOSED")).toBe(true);
    expect(result.alerts.every((alert) => alert.lifecycle.length === 9 && alert.replay_refs.length > 0)).toBe(true);
  });

  it("records immutable observability evidence with replay and certification references", () => {
    const result = runPilotMonitoringObservability();

    expect(result.evidence_ledger).toHaveLength(9);
    expect(result.evidence_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.certification_refs.length > 0)).toBe(true);
  });

  it("preserves tenant isolation and advisory-only boundary", () => {
    const result = runPilotMonitoringObservability();

    expect(result.event_stream.tenant_isolated).toBe(true);
    expect(result.observability_records.every((record) => record.tenant_id === "tenant_phase_16_monitoring_observability")).toBe(true);
    expect(result.dashboards.every((dashboard) => dashboard.informational_only)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runPilotMonitoringObservability();
    const second = runPilotMonitoringObservability();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePilotMonitoringObservability(first).valid).toBe(true);
    expect(replayPilotMonitoringObservability(first)).toBe(true);
  });

  it("executes the Phase 16.7 monitoring certification matrix", () => {
    const result = runPilotMonitoringObservability();

    expect(result.certification_tests).toHaveLength(21);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Dashboards complete",
      "Monitoring operational",
      "Runtime health continuously monitored",
      "Advisory activity visible",
      "Replay monitoring operational",
      "Evidence ingestion monitored",
      "Operator workflow visible",
      "Certification status continuously visible",
      "Constitutional compliance continuously monitored",
      "Alerts validated",
      "Alert lifecycle deterministic",
      "Monitoring evidence immutable",
      "Replay references complete",
      "Tenant isolation preserved",
      "Advisory-only boundary maintained",
      "Dashboard lineage reproducible",
      "Operational state fully observable",
      "No hidden operational state",
      "Governance visibility complete",
      "Certification readiness continuously assessable",
      "Phase 16.6 performance reliability valid",
    ]);
  });

  it("supports conditional pass for non-constitutional observability warnings", () => {
    const result = runPilotMonitoringObservability({ scenario: "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" });
    const validation = validatePilotMonitoringObservability(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "DASHBOARDS_INCOMPLETE",
    "MONITORING_NOT_OPERATIONAL",
    "RUNTIME_HEALTH_NOT_MONITORED",
    "ADVISORY_ACTIVITY_NOT_VISIBLE",
    "REPLAY_MONITORING_NOT_OPERATIONAL",
    "EVIDENCE_INGESTION_NOT_MONITORED",
    "OPERATOR_WORKFLOW_NOT_VISIBLE",
    "CERTIFICATION_STATUS_NOT_VISIBLE",
    "CONSTITUTIONAL_COMPLIANCE_NOT_MONITORED",
    "ALERTS_NOT_VALIDATED",
    "ALERT_LIFECYCLE_NON_DETERMINISTIC",
    "MONITORING_EVIDENCE_MUTABLE",
    "REPLAY_REFERENCES_INCOMPLETE",
    "TENANT_ISOLATION_NOT_PRESERVED",
    "ADVISORY_BOUNDARY_NOT_MAINTAINED",
    "DASHBOARD_LINEAGE_NOT_REPRODUCIBLE",
    "OPERATIONAL_STATE_NOT_OBSERVABLE",
    "HIDDEN_OPERATIONAL_STATE_PRESENT",
    "GOVERNANCE_VISIBILITY_INCOMPLETE",
    "CERTIFICATION_READINESS_NOT_ASSESSABLE",
    "PHASE_16_6_PERFORMANCE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: PilotMonitoringObservabilityFailure) => {
    const result = runPilotMonitoringObservability({ scenario });
    const validation = validatePilotMonitoringObservability(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested dashboard tampering", () => {
    const result = runPilotMonitoringObservability();
    const tampered = {
      ...result,
      dashboards: [
        {
          ...result.dashboards[0],
          complete: false,
        },
        ...result.dashboards.slice(1),
      ],
    };

    expect(validatePilotMonitoringObservability(tampered).valid).toBe(false);
  });
});
