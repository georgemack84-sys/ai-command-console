import { describe, expect, it } from "vitest";
import {
  getProductionOperationsObservabilityBundle,
  replayProductionOperationsObservability,
  runProductionOperationsObservability,
  validateProductionOperationsObservability,
} from "@/services/production-operations-observability";
import type { ProductionOperationsObservabilityFailure } from "@/types/production-operations-observability";

describe("Mission Control Phase 17.9 Production Operations & Observability", () => {
  it("publishes production operations observability doctrine", () => {
    const bundle = getProductionOperationsObservabilityBundle();

    expect(bundle.doctrine.version).toBe("production-operations-observability/v17.9");
    expect(bundle.doctrine.upstream_phase).toBe("performance-scalability-validation/v17.8");
    expect(bundle.doctrine.health_states).toContain("UNKNOWN");
    expect(bundle.doctrine.alert_categories).toContain("OBSERVABILITY_FAILURE");
    expect(bundle.validation.valid).toBe(true);
  });

  it("publishes complete passive dashboards", () => {
    const result = runProductionOperationsObservability();

    expect(result.dashboards).toHaveLength(4);
    expect(result.dashboards.every((dashboard) => dashboard.complete && dashboard.passive_only && dashboard.derived_from_authoritative_evidence)).toBe(true);
    expect(result.certification_package.operations_dashboard_complete).toBe(true);
    expect(result.certification_package.infrastructure_dashboard_complete).toBe(true);
  });

  it("registers production metrics and observability events", () => {
    const result = runProductionOperationsObservability();

    expect(result.metrics_registry.metrics).toHaveLength(15);
    expect(result.metrics_registry.deterministic_collection).toBe(true);
    expect(result.event_registry.events_replayable).toBe(true);
    expect(result.event_registry.observability_self_monitoring_enabled).toBe(true);
  });

  it("assesses health deterministically across production domains", () => {
    const result = runProductionOperationsObservability({ component_id: "ops-core" });

    expect(result.health_engine.assessed_domains).toHaveLength(12);
    expect(result.health_engine.deterministic_classification).toBe(true);
    expect(result.health_records).toHaveLength(12);
    expect(result.health_records.every((record) => record.health_state === "HEALTHY" && record.component_id.startsWith("ops-core"))).toBe(true);
  });

  it("generates deterministic governed alerts", () => {
    const result = runProductionOperationsObservability();

    expect(result.alert_policy_registry.equivalent_state_equivalent_alerts).toBe(true);
    expect(result.alert_policy_registry.monitoring_authorizes_actions).toBe(false);
    expect(result.alerts).toHaveLength(10);
    expect(result.alerts.some((alert) => alert.alert_category === "OBSERVABILITY_FAILURE" && alert.response === "FAIL_CLOSED")).toBe(true);
  });

  it("records immutable operational evidence", () => {
    const result = runProductionOperationsObservability();

    expect(result.evidence_ledger).toHaveLength(12);
    expect(result.evidence_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_ref.length > 0)).toBe(true);
    expect(result.certification_package.immutable_operational_evidence_complete).toBe(true);
  });

  it("preserves tenant isolation and governance visibility", () => {
    const result = runProductionOperationsObservability();

    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.governance_visibility).toBe(true);
    expect(result.health_records.every((record) => record.governance_refs.length > 0)).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionOperationsObservability();
    const second = runProductionOperationsObservability();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionOperationsObservability(first).valid).toBe(true);
    expect(replayProductionOperationsObservability(first)).toBe(true);
  });

  it("executes the Phase 17.9 monitoring certification requirements", () => {
    const result = runProductionOperationsObservability();

    expect(result.certification_tests).toHaveLength(15);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional observability warnings", () => {
    const result = runProductionOperationsObservability({ scenario: "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" });
    const validation = validateProductionOperationsObservability(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.monitoring_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("fails closed for unknown operational conditions", () => {
    const result = runProductionOperationsObservability({ scenario: "UNKNOWN_CONDITIONS_NOT_FAIL_CLOSED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.alert_policy_registry.unknown_conditions_fail_closed).toBe(false);
    expect(result.health_records.some((record) => record.health_state === "UNKNOWN")).toBe(true);
  });

  it.each([
    "OPERATIONS_DASHBOARD_INCOMPLETE",
    "CAPACITY_DASHBOARD_INCOMPLETE",
    "TENANT_HEALTH_DASHBOARD_INCOMPLETE",
    "INFRASTRUCTURE_DASHBOARD_INCOMPLETE",
    "OPERATIONAL_VISIBILITY_INCOMPLETE",
    "ALERTS_NOT_VALIDATED",
    "OBSERVABILITY_NOT_REPLAYABLE",
    "MONITORING_NOT_DETERMINISTIC",
    "TENANT_ISOLATION_VIOLATED",
    "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE",
    "MONITORING_NOT_CERTIFIED",
    "OPERATIONAL_READINESS_NOT_CONFIRMED",
    "GOVERNANCE_VISIBILITY_MISSING",
    "UNKNOWN_CONDITIONS_NOT_FAIL_CLOSED",
    "OBSERVABILITY_MODIFIES_PRODUCTION_STATE",
    "PHASE_17_8_SCALABILITY_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ProductionOperationsObservabilityFailure) => {
    const result = runProductionOperationsObservability({ scenario });
    const validation = validateProductionOperationsObservability(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects health record tampering", () => {
    const result = runProductionOperationsObservability();
    const tampered = {
      ...result,
      health_records: [
        {
          ...result.health_records[0],
          health_score: 7,
        },
        ...result.health_records.slice(1),
      ],
    };

    expect(validateProductionOperationsObservability(tampered).valid).toBe(false);
  });
});
