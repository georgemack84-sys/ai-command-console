import { describe, expect, it } from "vitest";
import { getTrustContinuousMonitoringBundle, replayTrustContinuousMonitoring, runTrustContinuousMonitoring, validateTrustContinuousMonitoring } from "@/services/trust-continuous-monitoring";
import type { TrustMonitoringFailure } from "@/types/trust-continuous-monitoring";

const FAILURE_MATRIX: readonly TrustMonitoringFailure[] = [
  "P5_12_HUMAN_OVERSIGHT_INVALID",
  "CONTINUOUS_MONITOR_MISSING",
  "TRUST_HEALTH_ENGINE_MISSING",
  "STANDING_OBSERVATION_MISSING",
  "MONITORING_RULES_ENGINE_MISSING",
  "OPERATIONAL_MONITORING_MISSING",
  "TREND_ANALYSIS_MISSING",
  "ALERT_SERVICE_MISSING",
  "TRUST_DASHBOARD_MISSING",
  "MONITORING_LEDGER_MISSING",
  "CERTIFICATION_GATE_MISSING",
  "MONITORING_EVIDENCE_MISSING",
  "MONITORING_EVIDENCE_STALE",
  "MONITORING_EVIDENCE_CONFLICTING",
  "MONITORING_EVIDENCE_UNVERIFIABLE",
  "MONITORING_OUTPUT_NOT_REPLAYABLE",
  "MONITORING_NONDETERMINISTIC",
  "MONITORING_LINEAGE_INCOMPLETE",
  "MONITORING_LEDGER_MUTABLE",
  "HEALTH_NOT_CALCULATED",
  "STANDING_HISTORY_MISSING",
  "RULES_NOT_EXECUTED",
  "OPERATIONAL_CONDITIONS_NOT_CAPTURED",
  "TREND_REPORT_MISSING",
  "ALERTS_NOT_GENERATED",
  "DASHBOARD_INCOMPLETE",
  "MONITORING_FAILURE_IMPROVED_STANDING",
  "TRUST_STANDING_CHANGED_DIRECTLY",
  "TRUST_EVALUATION_EXECUTED",
  "TRUST_DECISION_CREATED",
  "TRUST_QUALIFICATION_EXECUTED",
  "GOVERNANCE_DECISION_CREATED",
  "OPERATOR_APPROVAL_CREATED",
  "SAFETY_QUALIFICATION_EXECUTED",
  "TENANT_ISOLATION_VIOLATED",
  "FAIL_CLOSED_NOT_ENFORCED",
];

describe("P5.13 Trust Continuous Monitoring", () => {
  it("publishes read-only monitoring doctrine", () => {
    const bundle = getTrustContinuousMonitoringBundle();

    expect(bundle.doctrine.version).toBe("trust-continuous-monitoring/v5.13");
    expect(bundle.doctrine.owns_trust_monitoring).toBe(true);
    expect(bundle.doctrine.owns_operational_monitoring).toBe(true);
    expect(bundle.doctrine.owns_trust_health).toBe(true);
    expect(bundle.doctrine.owns_standing_observation).toBe(true);
    expect(bundle.doctrine.changes_trust_standing).toBe(false);
    expect(bundle.doctrine.evaluates_trust).toBe(false);
    expect(bundle.doctrine.creates_trust_decisions).toBe(false);
    expect(bundle.doctrine.qualifies_trust).toBe(false);
    expect(bundle.doctrine.creates_governance_decisions).toBe(false);
    expect(bundle.doctrine.creates_operator_approvals).toBe(false);
    expect(bundle.doctrine.qualifies_safety).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic monitoring records, health reports, alerts, dashboards, and ledger lineage", () => {
    const first = runTrustContinuousMonitoring();
    const second = runTrustContinuousMonitoring();

    expect(first.phase_identifier).toBe("TrustContinuousMonitoring");
    expect(first.human_oversight_ref).toBe("trust-human-oversight-governance/v5.12");
    expect(first.record.evidence_freshness).toBe("FRESH");
    expect(first.record.monitoring_result).toBe("NORMAL");
    expect(first.record.trust_standing).toBe(first.record.observed_trust_standing);
    expect(first.health.health_status).toBe("STABLE");
    expect(first.health.trend).toBe("STABLE");
    expect(first.standing.standing_stability).toBe(true);
    expect(first.report.findings.length).toBeGreaterThan(0);
    expect(first.alerts.length).toBeGreaterThan(0);
    expect(first.dashboard.health_visible).toBe(true);
    expect(first.ledger.immutable).toBe(true);
    expect(first.ledger.lineage_complete).toBe(true);
    expect(first.boundary.trust_standing_changed_directly).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustContinuousMonitoring(first).valid).toBe(true);
    expect(replayTrustContinuousMonitoring(first)).toBe(true);
  });

  it("passes only when all monitoring exit criteria are satisfied", () => {
    const result = runTrustContinuousMonitoring();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.continuous_monitoring_operational).toBe(true);
    expect(result.certification.health_calculated).toBe(true);
    expect(result.certification.standing_observation_operational).toBe(true);
    expect(result.certification.rules_deterministic).toBe(true);
    expect(result.certification.operational_conditions_captured).toBe(true);
    expect(result.certification.trend_analysis_operational).toBe(true);
    expect(result.certification.alerts_generated).toBe(true);
    expect(result.certification.dashboard_complete).toBe(true);
    expect(result.certification.ledger_immutable).toBe(true);
    expect(result.certification.replayable).toBe(true);
    expect(result.certification.monitoring_failures_fail_closed).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails monitoring certification for %s", (failure) => {
    const result = runTrustContinuousMonitoring({ scenario: failure });
    const validation = validateTrustContinuousMonitoring(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without monitoring readiness", () => {
    const result = runTrustContinuousMonitoring({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustContinuousMonitoring(result).valid).toBe(false);
  });

  it.each(["MONITORING_EVIDENCE_MISSING", "MONITORING_EVIDENCE_STALE", "MONITORING_EVIDENCE_CONFLICTING", "MONITORING_EVIDENCE_UNVERIFIABLE"] as const)("does not improve posture when monitoring evidence is invalid for %s", (scenario) => {
    const result = runTrustContinuousMonitoring({ scenario });

    expect(result.record.monitoring_result).toBe("MONITORING_FAILURE");
    expect(result.record.trust_standing).not.toBe("QUALIFIED");
    expect(result.alerts.some((alert) => alert.action === "MAINTAIN_FAIL_CLOSED")).toBe(true);
    expect(result.certification.phase_ready).toBe(false);
  });

  it("detects direct trust standing mutation by monitoring", () => {
    const result = runTrustContinuousMonitoring({ scenario: "TRUST_STANDING_CHANGED_DIRECTLY" });

    expect(result.boundary.trust_standing_changed_directly).toBe(true);
    expect(result.record.trust_standing).not.toBe(result.record.observed_trust_standing);
    expect(result.certification.boundary_respected).toBe(false);
    expect(result.certification.failures).toContain("TRUST_STANDING_CHANGED_DIRECTLY");
  });
});
