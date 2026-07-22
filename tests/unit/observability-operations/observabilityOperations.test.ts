import { describe, expect, it } from "vitest";
import {
  getObservabilityOperationsBundle,
  replayObservabilityOperations,
  runObservabilityOperations,
  validateObservabilityOperations,
} from "@/services/observability-operations";
import type { ObservabilityOperationsFailure } from "@/types/observability-operations";

describe("Mission Control Phase 14.11 Observability & Operations", () => {
  it("publishes observability operations doctrine", () => {
    const bundle = getObservabilityOperationsBundle();

    expect(bundle.doctrine.version).toBe("observability-operations/v14.11");
    expect(bundle.doctrine.upstream_phase).toBe("replay-integrity-explainability/v14.10");
    expect(bundle.doctrine.dashboard_views).toEqual(["Validation Overview", "Environment Status", "Scenario Execution", "Replay Health", "Certification Status", "Dependency Health", "Integrity Status", "Boundary Violations", "Remediation Progress", "Alert Summary"]);
    expect(bundle.doctrine.alert_categories).toHaveLength(10);
    expect(bundle.doctrine.alert_severities).toEqual(["INFORMATION", "WARNING", "HIGH", "CRITICAL"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("renders a deterministic read-only dashboard", () => {
    const result = runObservabilityOperations();

    expect(result.dashboard.views).toHaveLength(10);
    expect(result.dashboard.widget_registry).toHaveLength(10);
    expect(result.dashboard.layout_engine).toBe("DETERMINISTIC_GRID");
    expect(result.dashboard.rendering_service).toBe("READ_ONLY_RENDERER");
    expect(result.dashboard.state_manager).toBe("IMMUTABLE_DASHBOARD_STATE");
    expect(result.dashboard.execution_authority).toBe(false);
    expect(result.dashboard.tenant_isolated).toBe(true);
  });

  it("monitors validation, dependency, replay, lineage, boundary, and certification operations", () => {
    const result = runObservabilityOperations();

    expect(result.monitors.map((monitor) => monitor.component)).toEqual(["VALIDATION_PROGRESS", "DEPENDENCY_VERIFICATION", "REPLAY_HEALTH", "LINEAGE_INTEGRITY", "BOUNDARY_VIOLATION", "CERTIFICATION_REMEDIATION"]);
    expect(result.monitors.every((monitor) => monitor.status === "HEALTHY" && monitor.deterministic)).toBe(true);
    expect(result.monitors.find((monitor) => monitor.component === "VALIDATION_PROGRESS")?.metrics).toContain("execution backlog");
    expect(result.monitors.find((monitor) => monitor.component === "REPLAY_HEALTH")?.metrics).toContain("replay reproducibility");
  });

  it("generates deterministic alerts with evidence and replay references", () => {
    const result = runObservabilityOperations();

    expect(result.alerts).toHaveLength(10);
    expect(result.alerts.map((alert) => alert.category)).toEqual(["VALIDATION_ALERT", "DEPENDENCY_ALERT", "REPLAY_ALERT", "CERTIFICATION_ALERT", "LINEAGE_ALERT", "INTEGRITY_ALERT", "GOVERNANCE_ALERT", "BOUNDARY_ALERT", "REMEDIATION_ALERT", "SUPERSESSION_ALERT"]);
    expect(result.alerts.every((alert) => alert.severity === "INFORMATION" && alert.deterministic && alert.evidence_refs.length > 0 && alert.replay_refs.length > 0 && alert.lineage_refs.length > 0)).toBe(true);
  });

  it("publishes complete advisory-only operational runbooks", () => {
    const result = runObservabilityOperations();

    expect(result.runbooks).toHaveLength(10);
    expect(result.runbooks.map((runbook) => runbook.name)).toEqual(["Validation Failure Response", "Replay Divergence Investigation", "Dependency Verification Failure", "Certification Failure", "Boundary Violation Response", "Integrity Investigation", "Remediation Workflow", "Supersession Verification", "Alert Escalation", "Operational Recovery"]);
    expect(result.runbooks.every((runbook) => runbook.sections.length === 8 && runbook.deterministic && runbook.advisory_only)).toBe(true);
  });

  it("records immutable operational observations", () => {
    const result = runObservabilityOperations();

    expect(result.evidence_ledger).toHaveLength(10);
    expect(result.evidence_ledger.every((record) => record.tenant_id === result.dashboard.tenant_id)).toBe(true);
    expect(result.evidence_ledger.every((record) => record.evidence_refs.length > 0 && record.replay_refs.length > 0 && record.validation_refs.length > 0 && record.certification_refs.length > 0 && record.lineage_refs.length > 0)).toBe(true);
    expect(result.evidence_ledger.map((record) => record.dashboard_view)).toEqual(result.dashboard.views);
  });

  it("is deterministic and replayable", () => {
    const first = runObservabilityOperations();
    const second = runObservabilityOperations();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateObservabilityOperations(first).valid).toBe(true);
    expect(replayObservabilityOperations(first)).toBe(true);
  });

  it("executes the complete operational certification matrix", () => {
    const result = runObservabilityOperations();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Dashboard coverage complete",
      "Validation monitoring visible",
      "Dependency monitoring complete",
      "Replay monitoring operational",
      "Lineage monitoring complete",
      "Boundary monitoring complete",
      "Certification visible",
      "Remediation traceable",
      "Alerts deterministic",
      "Runbooks complete",
      "Evidence ledger immutable",
      "Replay reproducible",
      "Tenant isolation enforced",
      "Constitutional compliance preserved",
    ]);
  });

  it("supports conditional pass for non-constitutional operational warnings", () => {
    const result = runObservabilityOperations({ scenario: "NON_CONSTITUTIONAL_OPERATIONAL_WARNING" });
    const validation = validateObservabilityOperations(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "DASHBOARD_COVERAGE_INCOMPLETE",
    "VALIDATION_NOT_OBSERVABLE",
    "DEPENDENCY_VISIBILITY_INCOMPLETE",
    "REPLAY_MONITORING_DEGRADED",
    "LINEAGE_MONITORING_INCOMPLETE",
    "BOUNDARY_MONITORING_INCOMPLETE",
    "CERTIFICATION_NOT_VISIBLE",
    "REMEDIATION_NOT_TRACEABLE",
    "ALERTS_NON_DETERMINISTIC",
    "RUNBOOKS_INCOMPLETE",
    "EVIDENCE_LEDGER_MUTABLE",
    "REPLAY_NOT_REPRODUCIBLE",
    "TENANT_ISOLATION_BROKEN",
    "CONSTITUTIONAL_BOUNDARY_BREACH",
  ] as const)("fails certification for %s", (scenario: ObservabilityOperationsFailure) => {
    const result = runObservabilityOperations({ scenario });
    const validation = validateObservabilityOperations(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested dashboard tampering", () => {
    const result = runObservabilityOperations();
    const tampered = {
      ...result,
      dashboard: {
        ...result.dashboard,
        execution_authority: true as false,
      },
    };

    expect(validateObservabilityOperations(tampered).valid).toBe(false);
  });
});
