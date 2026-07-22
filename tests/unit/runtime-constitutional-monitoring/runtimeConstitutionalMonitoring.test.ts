import { describe, expect, it } from "vitest";
import {
  buildRuntimeConstitutionalMonitoringObservabilitySurface,
  getRuntimeConstitutionalMonitoringEngine,
  getRuntimeConstitutionHealth,
  listRuntimeComplianceStatus,
  listRuntimeConstitutionalAuditRecords,
  listRuntimeMonitoringLedger,
  listRuntimeMonitoringTimeline,
  listRuntimeRiskIndicators,
  monitorRuntimeConstitutionalCompliance,
  validateRuntimeConstitutionalMonitoring,
} from "@/services/runtime-constitutional-monitoring";
import type { RuntimeConstitutionalFailure, RuntimeConstitutionalScenario, RuntimeMonitoringDomain } from "@/types/runtime-constitutional-monitoring";

const domains: readonly RuntimeMonitoringDomain[] = ["AUTHORITY", "POLICY", "OPERATOR_AUTHORITY", "RUNTIME_CONFIDENCE", "MISSION_STATE", "GOVERNANCE_HEALTH", "EXECUTION_INTEGRITY", "TENANT_ISOLATION", "SYSTEM_DRIFT"];

describe("runtime constitutional monitoring", () => {
  it("publishes the deterministic passive monitoring bundle", () => {
    const bundle = getRuntimeConstitutionalMonitoringEngine();

    expect(bundle.doctrine.engine_version).toBe("runtime-constitutional-monitoring/v8ALT.10.3");
    expect(bundle.doctrine.final_state).toBe("RUNTIME_CONSTITUTIONAL_MONITORING_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.monitoring_only).toBe(true);
    expect(bundle.repository.passive_observer).toBe(true);
    expect(bundle.repository.execution_modification_authorized).toBe(false);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.governance_override_authorized).toBe(false);
    expect(bundle.repository.runtime_intervention_authorized).toBe(false);
    expect(bundle.repository.background_process_authorized).toBe(false);
  });

  it("monitors all runtime constitutional domains", () => {
    const repository = monitorRuntimeConstitutionalCompliance();

    expect(repository.final_state).toBe("RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE");
    expect(repository.statuses.map((status) => status.monitored_domain)).toEqual(domains);
    expect(repository.statuses.every((status) => status.overall_compliance === "COMPLIANT")).toBe(true);
    expect(repository.statuses.every((status) => status.tenant_id === "tenant:alpha")).toBe(true);
    expect(repository.health.overall_health_state).toBe("EXCELLENT");
  });

  it("lists status, health, timeline, risks, ledger, and audits", () => {
    expect(listRuntimeComplianceStatus().length).toBe(domains.length);
    expect(getRuntimeConstitutionHealth().overall_health_state).toBe("EXCELLENT");
    expect(listRuntimeMonitoringTimeline().length).toBe(domains.length);
    expect(listRuntimeRiskIndicators().length).toBe(6);
    expect(listRuntimeMonitoringLedger().length).toBe(domains.length);
    expect(listRuntimeConstitutionalAuditRecords()).toEqual([]);
  });

  it("keeps monitoring deterministic and append-only in evidence shape", () => {
    const first = monitorRuntimeConstitutionalCompliance();
    const second = monitorRuntimeConstitutionalCompliance();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.statuses.map((status) => status.runtime_monitor_id)).toEqual(first.statuses.map((status) => status.runtime_monitor_id));
    expect(second.ledger.map((record) => record.monitoring_record_id)).toEqual(first.ledger.map((record) => record.monitoring_record_id));
    expect(first.ledger.every((record) => record.immutable && record.append_only)).toBe(true);
  });

  it("publishes low risk indicators for compliant runtime", () => {
    const risks = listRuntimeRiskIndicators();

    expect(risks.map((risk) => risk.risk_type)).toEqual(["AUTHORITY_RISK", "GOVERNANCE_RISK", "REPLAY_RISK", "INTEGRITY_RISK", "ISOLATION_RISK", "CONSTITUTIONAL_RISK"]);
    expect(risks.every((risk) => risk.risk_level === "LOW")).toBe(true);
    expect(risks.every((risk) => risk.risk_score < 0.1)).toBe(true);
  });

  it.each([
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["OPERATOR_AUTHORITY_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["POLICY_ENFORCEMENT_FAILURE", "POLICY_ENFORCEMENT_FAILURE_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["EXECUTION_NONDETERMINISM", "EXECUTION_NONDETERMINISM_DETECTED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILURE_DETECTED"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH_DETECTED"],
    ["UNAUTHORIZED_LEARNING", "UNAUTHORIZED_LEARNING_DETECTED"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION_DETECTED"],
    ["UNAUTHORIZED_RECOVERY", "UNAUTHORIZED_RECOVERY_DETECTED"],
    ["MONITORING_EVIDENCE_CORRUPTION", "MONITORING_EVIDENCE_CORRUPTION_DETECTED"],
    ["CONSTITUTIONAL_HEALTH_UNAVAILABLE", "CONSTITUTIONAL_HEALTH_UNAVAILABLE"],
    ["MISSING_RUNTIME_VISIBILITY", "RUNTIME_VISIBILITY_MISSING"],
    ["INCOMPLETE_MONITORING_LINEAGE", "MONITORING_LINEAGE_INCOMPLETE"],
  ] satisfies [RuntimeConstitutionalScenario, RuntimeConstitutionalFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = monitorRuntimeConstitutionalCompliance({ scenario });
    const validation = validateRuntimeConstitutionalMonitoring(repository);

    expect(repository.final_state).toBe("RUNTIME_CONSTITUTIONAL_MONITORING_FAIL_CLOSED");
    expect(repository.health.overall_health_state).toBe("NON_COMPLIANT");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.statuses.some((status) => status.failure === failure)).toBe(true);
    expect(repository.audit_records.some((record) => record.failure === failure)).toBe(true);
    expect(repository.runtime_intervention_authorized).toBe(false);
  });

  it("publishes runtime constitutional monitoring observability", () => {
    const surface = buildRuntimeConstitutionalMonitoringObservabilitySurface();

    expect(surface.final_state).toBe("RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE");
    expect(surface.status_count).toBe(domains.length);
    expect(surface.timeline_count).toBe(domains.length);
    expect(surface.risk_count).toBe(6);
    expect(surface.ledger_count).toBe(domains.length);
    expect(surface.runtime_intervention_authorized).toBe(false);
    expect(surface.health_state).toBe("EXCELLENT");
    expect(surface.integrity_hash).toBeTruthy();
  });
});
