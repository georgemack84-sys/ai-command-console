import { describe, expect, it } from "vitest";
import {
  buildContinuousConstitutionalObservabilitySurface,
  getContinuousConstitutionalValidationEngine,
  listConstitutionalComplianceTimeline,
  listConstitutionalTrendAssessments,
  listConstitutionalValidationReports,
  listConstitutionalViolationAlerts,
  listContinuousConstitutionalAuditRecords,
  validateContinuousConstitutionalCompliance,
  validateContinuousConstitutionalRepository,
} from "@/services/continuous-constitutional-validation";
import type { ContinuousConstitutionalFailure, ContinuousConstitutionalScenario, ContinuousConstitutionalSubsystem } from "@/types/continuous-constitutional-validation";

const expectedSubsystems: readonly ContinuousConstitutionalSubsystem[] = ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "RECOVERY", "OPTIMIZATION", "LEARNING", "REPLAY", "VISIBILITY", "INTEGRITY", "GOVERNANCE", "AUTHORITY"];

describe("continuous constitutional validation", () => {
  it("publishes the deterministic continuous validation bundle", () => {
    const bundle = getContinuousConstitutionalValidationEngine();

    expect(bundle.doctrine.engine_version).toBe("continuous-constitutional-validation/v8ALT.10.2");
    expect(bundle.doctrine.final_state).toBe("CONTINUOUS_CONSTITUTIONAL_VALIDATION_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.validation_only).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.execution_modification_authorized).toBe(false);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.governance_override_authorized).toBe(false);
    expect(bundle.repository.background_monitor_authorized).toBe(false);
  });

  it("validates every constitutional subsystem domain", () => {
    const repository = validateContinuousConstitutionalCompliance();

    expect(repository.final_state).toBe("CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE");
    expect(repository.reports.map((report) => report.subsystem)).toEqual(expectedSubsystems);
    expect(repository.reports.every((report) => report.validation_result === "VERIFIED" || report.validation_result === "COMPLIANT")).toBe(true);
    expect(repository.reports.every((report) => report.validated_invariants.length > 0)).toBe(true);
    expect(repository.reports.every((report) => report.tenant_id === "tenant:alpha")).toBe(true);
  });

  it("lists reports, timeline, alerts, trends, and audits", () => {
    expect(listConstitutionalValidationReports().length).toBe(expectedSubsystems.length);
    expect(listConstitutionalComplianceTimeline().length).toBe(expectedSubsystems.length);
    expect(listConstitutionalViolationAlerts()).toEqual([]);
    expect(listConstitutionalTrendAssessments().length).toBeGreaterThan(0);
    expect(listContinuousConstitutionalAuditRecords()).toEqual([]);
  });

  it("keeps validation cycles deterministic and append-only in shape", () => {
    const first = validateContinuousConstitutionalCompliance();
    const second = validateContinuousConstitutionalCompliance();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.reports.map((report) => report.validation_id)).toEqual(first.reports.map((report) => report.validation_id));
    expect(second.timeline.map((entry) => entry.timeline_id)).toEqual(first.timeline.map((entry) => entry.timeline_id));
  });

  it("publishes stable trend assessments", () => {
    const trends = listConstitutionalTrendAssessments();

    expect(trends.map((trend) => trend.domain)).toEqual(["CONSTITUTIONAL_STABILITY", "GOVERNANCE_HEALTH", "AUTHORITY_CONSISTENCY", "REPLAY_CONSISTENCY", "SUBSYSTEM_COMPLIANCE", "CERTIFICATION_READINESS"]);
    expect(trends.every((trend) => trend.score === 1)).toBe(true);
    expect(trends.every((trend) => trend.trend_direction === "STABLE")).toBe(true);
  });

  it.each([
    ["CONSTITUTIONAL_RULE_VIOLATION", "CONSTITUTIONAL_RULE_VIOLATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["OPERATOR_AUTHORITY_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION_DETECTED"],
    ["NONDETERMINISTIC_EXECUTION", "NONDETERMINISTIC_EXECUTION_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILURE_DETECTED"],
    ["HIDDEN_EXECUTION_PATH", "HIDDEN_EXECUTION_PATH_DETECTED"],
    ["HIDDEN_AUTONOMOUS_LEARNING", "HIDDEN_AUTONOMOUS_LEARNING_DETECTED"],
    ["POLICY_MUTATION", "POLICY_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_MUTATION", "CONSTITUTIONAL_MUTATION_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["INCOMPLETE_VALIDATION_LINEAGE", "VALIDATION_LINEAGE_INCOMPLETE"],
    ["UNVERIFIED_AUTONOMOUS_SUBSYSTEM", "UNVERIFIED_AUTONOMOUS_SUBSYSTEM_DETECTED"],
  ] satisfies [ContinuousConstitutionalScenario, ContinuousConstitutionalFailure][])("fails closed and alerts %s", (scenario, failure) => {
    const repository = validateContinuousConstitutionalCompliance({ scenario });
    const validation = validateContinuousConstitutionalRepository(repository);

    expect(repository.final_state).toBe("CONTINUOUS_CONSTITUTIONAL_VALIDATION_BLOCKED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.alerts.some((alert) => alert.alert_type === failure)).toBe(true);
    expect(repository.alerts.every((alert) => alert.fail_closed && alert.operator_visible)).toBe(true);
    expect(repository.audit_records.some((record) => record.failure === failure)).toBe(true);
    expect(repository.execution_modification_authorized).toBe(false);
  });

  it("publishes continuous constitutional observability", () => {
    const surface = buildContinuousConstitutionalObservabilitySurface();

    expect(surface.final_state).toBe("CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE");
    expect(surface.report_count).toBe(expectedSubsystems.length);
    expect(surface.timeline_count).toBe(expectedSubsystems.length);
    expect(surface.alert_count).toBe(0);
    expect(surface.trend_count).toBeGreaterThan(0);
    expect(surface.background_monitor_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
