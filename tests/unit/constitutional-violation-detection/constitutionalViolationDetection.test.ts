import { describe, expect, it } from "vitest";
import {
  buildConstitutionalViolationDetectionObservabilitySurface,
  detectConstitutionalViolations,
  getConstitutionalViolationDetectionEngine,
  listConstitutionalSeverityClassifications,
  listConstitutionalViolationAlerts,
  listConstitutionalViolationEvidence,
  listConstitutionalViolationLedger,
  listConstitutionalViolationRecords,
  validateConstitutionalViolationDetection,
} from "@/services/constitutional-violation-detection";
import type { ConstitutionalViolationDomain, ConstitutionalViolationFailure, ConstitutionalViolationScenario, ConstitutionalViolationSeverity } from "@/types/constitutional-violation-detection";

const domains: readonly ConstitutionalViolationDomain[] = ["AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS", "CONSTITUTIONAL_BYPASS", "HIDDEN_EXECUTION", "REPLAY_MISMATCH", "LEARNING_OUTSIDE_POLICY", "UNAUTHORIZED_OPTIMIZATION", "RUNTIME_DRIFT", "INTEGRITY_DEGRADATION", "POLICY_VIOLATION", "TENANT_LEAKAGE"];

describe("constitutional violation detection", () => {
  it("publishes the deterministic detection bundle without enforcement authority", () => {
    const bundle = getConstitutionalViolationDetectionEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-violation-detection/v8ALT.10.4");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_VIOLATION_DETECTION_READY");
    expect(bundle.doctrine.detection_domains).toEqual(domains);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.detection_only).toBe(true);
    expect(bundle.repository.enforcement_authorized).toBe(false);
    expect(bundle.repository.autonomous_remediation_authorized).toBe(false);
    expect(bundle.repository.execution_modification_authorized).toBe(false);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.governance_override_authorized).toBe(false);
  });

  it("observes every detection domain in the baseline repository", () => {
    const repository = detectConstitutionalViolations();

    expect(repository.final_state).toBe("CONSTITUTIONAL_VIOLATION_DETECTION_COMPLETE");
    expect(repository.violations.map((item) => item.violation_category)).toEqual(domains);
    expect(repository.violations.every((item) => item.validation_status === "NO_VIOLATION")).toBe(true);
    expect(repository.violations.every((item) => item.tenant_id === "tenant:alpha")).toBe(true);
    expect(repository.alerts).toEqual([]);
  });

  it("lists records, classifications, evidence, ledger, and alerts", () => {
    expect(listConstitutionalViolationRecords().length).toBe(domains.length);
    expect(listConstitutionalSeverityClassifications().length).toBe(domains.length);
    expect(listConstitutionalViolationEvidence().length).toBe(domains.length);
    expect(listConstitutionalViolationLedger().length).toBe(domains.length);
    expect(listConstitutionalViolationAlerts()).toEqual([]);
  });

  it("keeps repositories deterministic and ledger records immutable", () => {
    const first = detectConstitutionalViolations();
    const second = detectConstitutionalViolations();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.violations.map((item) => item.violation_id)).toEqual(first.violations.map((item) => item.violation_id));
    expect(second.ledger.map((item) => item.violation_record_id)).toEqual(first.ledger.map((item) => item.violation_record_id));
    expect(first.ledger.every((item) => item.immutable && item.append_only)).toBe(true);
    expect(first.evidence_packages.every((item) => item.immutable)).toBe(true);
  });

  it.each([
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED", "CRITICAL"],
    ["OPERATOR_AUTHORITY_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED", "CRITICAL"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED", "CRITICAL"],
    ["GOVERNANCE_MUTATION", "GOVERNANCE_MUTATION_DETECTED", "BLOCKING"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED", "CRITICAL"],
    ["CONSTITUTIONAL_MUTATION", "CONSTITUTIONAL_MUTATION_DETECTED", "BLOCKING"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED", "CRITICAL"],
    ["MONITORING_FAILURE", "MONITORING_FAILURE_DETECTED", "BLOCKING"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED", "HIGH"],
    ["REPLAY_NONDETERMINISM", "REPLAY_NONDETERMINISM_DETECTED", "CRITICAL"],
    ["LEARNING_OUTSIDE_POLICY", "LEARNING_OUTSIDE_POLICY_DETECTED", "HIGH"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION_DETECTED", "HIGH"],
    ["UNAUTHORIZED_RECOVERY", "UNAUTHORIZED_RECOVERY_DETECTED", "HIGH"],
    ["RUNTIME_DRIFT", "RUNTIME_DRIFT_DETECTED", "HIGH"],
    ["INTEGRITY_DEGRADATION", "INTEGRITY_DEGRADATION_DETECTED", "CRITICAL"],
    ["EVIDENCE_TAMPERING", "EVIDENCE_TAMPERING_DETECTED", "CRITICAL"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING", "CRITICAL"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION_DETECTED", "HIGH"],
    ["TENANT_LEAKAGE", "TENANT_LEAKAGE_DETECTED", "CRITICAL"],
  ] satisfies [ConstitutionalViolationScenario, ConstitutionalViolationFailure, ConstitutionalViolationSeverity][])("detects %s deterministically", (scenario, failure, severity) => {
    const repository = detectConstitutionalViolations({ scenario });
    const validation = validateConstitutionalViolationDetection(repository);
    const detected = repository.violations.find((item) => item.failure === failure);

    expect(repository.final_state).toBe("CONSTITUTIONAL_VIOLATION_DETECTION_FAIL_CLOSED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(detected).toBeTruthy();
    expect(detected?.severity).toBe(severity);
    expect(repository.classifications.some((item) => item.violation_id === detected?.violation_id && item.severity === severity)).toBe(true);
    expect(repository.ledger.some((item) => item.violation_id === detected?.violation_id && item.violation_state === "ESCALATED")).toBe(true);
    expect(repository.alerts.some((item) => item.violation_id === detected?.violation_id)).toBe(true);
    expect(repository.enforcement_authorized).toBe(false);
    expect(repository.autonomous_remediation_authorized).toBe(false);
  });

  it("marks critical and blocking violations as fail-closed requirements only", () => {
    const critical = detectConstitutionalViolations({ scenario: "AUTHORITY_ESCALATION" });
    const blocking = detectConstitutionalViolations({ scenario: "CONSTITUTIONAL_MUTATION" });

    expect(critical.violations.find((item) => item.failure === "AUTHORITY_ESCALATION_DETECTED")?.fail_closed_required).toBe(true);
    expect(blocking.violations.find((item) => item.failure === "CONSTITUTIONAL_MUTATION_DETECTED")?.fail_closed_required).toBe(true);
    expect(critical.alerts.every((item) => item.advisory_only && !item.autonomous_response_authorized)).toBe(true);
    expect(blocking.alerts.every((item) => item.advisory_only && !item.autonomous_response_authorized)).toBe(true);
  });

  it("detects evidence, replay, lineage, and tenant isolation defects", () => {
    expect(validateConstitutionalViolationDetection(detectConstitutionalViolations({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalViolationDetection(detectConstitutionalViolations({ scenario: "REPLAY_MISMATCH" })).replay_compatible).toBe(false);
    expect(validateConstitutionalViolationDetection(detectConstitutionalViolations({ scenario: "MONITORING_FAILURE" })).lineage_complete).toBe(false);
    expect(validateConstitutionalViolationDetection(detectConstitutionalViolations({ scenario: "TENANT_LEAKAGE" })).tenant_isolated).toBe(false);
  });

  it("publishes an observability surface for certification readiness", () => {
    const surface = buildConstitutionalViolationDetectionObservabilitySurface(detectConstitutionalViolations({ scenario: "GOVERNANCE_BYPASS" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_VIOLATION_DETECTION_FAIL_CLOSED");
    expect(surface.violation_count).toBe(domains.length);
    expect(surface.classification_count).toBe(domains.length);
    expect(surface.evidence_count).toBe(domains.length);
    expect(surface.ledger_count).toBe(domains.length);
    expect(surface.alert_count).toBe(1);
    expect(surface.critical_or_blocking_count).toBe(1);
    expect(surface.enforcement_authorized).toBe(false);
    expect(surface.autonomous_remediation_authorized).toBe(false);
  });
});
