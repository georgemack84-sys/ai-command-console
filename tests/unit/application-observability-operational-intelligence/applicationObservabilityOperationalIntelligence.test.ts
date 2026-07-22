import { describe, expect, it } from "vitest";
import {
  getApplicationObservabilityOperationalIntelligenceBundle,
  replayApplicationObservabilityOperationalIntelligence,
  runApplicationObservabilityOperationalIntelligence,
  validateApplicationObservabilityOperationalIntelligence,
} from "@/services/application-observability-operational-intelligence";
import type { ApplicationOperationalScenario } from "@/types/application-observability-operational-intelligence";

describe("Program 4 P4.10 Observability and Operational Intelligence", () => {
  it("publishes application operational visibility doctrine without owning observability infrastructure", () => {
    const bundle = getApplicationObservabilityOperationalIntelligenceBundle();

    expect(bundle.doctrine.version).toBe("application-observability-operational-intelligence/v4.10");
    expect(bundle.doctrine.owns_application_operational_visibility).toBe(true);
    expect(bundle.doctrine.owns_application_dashboards).toBe(true);
    expect(bundle.doctrine.owns_operational_intelligence).toBe(true);
    expect(bundle.doctrine.owns_application_diagnostics).toBe(true);
    expect(bundle.doctrine.owns_application_telemetry_views).toBe(true);
    expect(bundle.doctrine.owns_operational_health_interpretation).toBe(true);
    expect(bundle.doctrine.owns_telemetry_collection).toBe(false);
    expect(bundle.doctrine.owns_metrics_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_tracing_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_log_storage).toBe(false);
    expect(bundle.doctrine.owns_runtime_monitoring_infrastructure).toBe(false);
    expect(bundle.doctrine.generates_agent_runtime_telemetry).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic dashboards, intelligence, diagnostics, telemetry views, health, and alert views", () => {
    const first = runApplicationObservabilityOperationalIntelligence();
    const second = runApplicationObservabilityOperationalIntelligence();

    expect(first.replay_audit_forensics_ref).toBe("application-replay-audit-forensics/v4.9");
    expect(first.cci_observability_ref).toBe("Program 2 - CCI Observability Infrastructure");
    expect(first.caf_runtime_telemetry_ref).toBe("Program 3 - CAF Runtime Telemetry");
    expect(first.dashboards.map((dashboard) => dashboard.dashboard_type)).toEqual(["APPLICATION", "EXECUTIVE", "TENANT", "HEALTH"]);
    expect(first.dashboards.every((dashboard) => dashboard.governed)).toBe(true);
    expect(first.operational_intelligence.availability_status).toBe("AVAILABLE");
    expect(first.diagnostics.length).toBe(3);
    expect(first.telemetry_view.telemetry_sources).toEqual(["cci:metrics", "cci:logs", "cci:traces", "caf:agent-telemetry", "caf:runtime-telemetry", "caf:health-signals"]);
    expect(first.health_intelligence.operational_score).toBe(98);
    expect(first.alert_view.visualizes_alerts).toBe(true);
    expect(first.alert_view.generates_alerts).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationObservabilityOperationalIntelligence(first).valid).toBe(true);
    expect(replayApplicationObservabilityOperationalIntelligence(first)).toBe(true);
  });

  it("certifies the P4.10 exit criteria and cross-program boundaries", () => {
    const result = runApplicationObservabilityOperationalIntelligence();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.dashboards_operational).toBe(true);
    expect(result.certification.operational_intelligence_produced).toBe(true);
    expect(result.certification.diagnostics_complete).toBe(true);
    expect(result.certification.telemetry_views_available).toBe(true);
    expect(result.certification.dependency_health_visible).toBe(true);
    expect(result.certification.application_health_measurable).toBe(true);
    expect(result.certification.executive_dashboards_available).toBe(true);
    expect(result.certification.operational_trends_visible).toBe(true);
    expect(result.certification.tenant_operational_views_complete).toBe(true);
    expect(result.certification.dashboard_governance_implemented).toBe(true);
    expect(result.certification.no_observability_infrastructure_ownership).toBe(true);
    expect(result.certification.no_telemetry_generation).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_9_REPLAY_AUDIT_FORENSICS_INVALID",
    "CCI_OBSERVABILITY_INFRASTRUCTURE_INVALID",
    "CCI_METRICS_INVALID",
    "CCI_LOGS_INVALID",
    "CCI_TRACES_INVALID",
    "CCI_MONITORING_SERVICES_INVALID",
    "CAF_AGENT_TELEMETRY_INVALID",
    "CAF_RUNTIME_TELEMETRY_INVALID",
    "CAF_OPERATIONAL_EVENTS_INVALID",
    "CAF_HEALTH_SIGNALS_INVALID",
    "CAF_EXECUTION_SUMMARIES_INVALID",
    "DASHBOARD_FRAMEWORK_MISSING",
    "APPLICATION_DASHBOARD_MISSING",
    "EXECUTIVE_DASHBOARD_MISSING",
    "TENANT_DASHBOARD_MISSING",
    "DASHBOARD_GOVERNANCE_MISSING",
    "OPERATIONAL_INTELLIGENCE_MISSING",
    "ANOMALY_INTERPRETATION_MISSING",
    "TREND_ANALYSIS_MISSING",
    "DIAGNOSTICS_FRAMEWORK_MISSING",
    "DEPENDENCY_DIAGNOSTICS_MISSING",
    "CAPABILITY_DIAGNOSTICS_MISSING",
    "INTERFACE_DIAGNOSTICS_MISSING",
    "TELEMETRY_VIEW_MISSING",
    "TELEMETRY_AGGREGATION_INVALID",
    "HEALTH_INTELLIGENCE_MISSING",
    "DEPENDENCY_HEALTH_NOT_VISIBLE",
    "APPLICATION_HEALTH_NOT_MEASURABLE",
    "OPERATIONAL_ALERT_VIEW_MISSING",
    "OPERATIONAL_TRENDS_NOT_VISIBLE",
    "TENANT_OPERATIONAL_VIEW_INCOMPLETE",
    "TELEMETRY_COLLECTION_ATTEMPTED",
    "METRICS_INFRASTRUCTURE_ATTEMPTED",
    "TRACING_INFRASTRUCTURE_ATTEMPTED",
    "LOG_STORAGE_ATTEMPTED",
    "RUNTIME_MONITORING_INFRASTRUCTURE_ATTEMPTED",
    "AGENT_TELEMETRY_GENERATION_ATTEMPTED",
    "REPLAY_OWNERSHIP_ATTEMPTED",
    "FORENSIC_EVIDENCE_OWNERSHIP_ATTEMPTED",
    "ALERT_GENERATION_ATTEMPTED",
  ] as const)("fails operational intelligence certification for %s", (scenario: ApplicationOperationalScenario) => {
    const result = runApplicationObservabilityOperationalIntelligence({ scenario });
    const validation = validateApplicationObservabilityOperationalIntelligence(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationObservabilityOperationalIntelligence({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
