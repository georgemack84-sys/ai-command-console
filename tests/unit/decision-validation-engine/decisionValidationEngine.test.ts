import { describe, expect, it } from "vitest";
import {
  buildDecisionValidationObservability,
  classifyValidationError,
  generateValidationReport,
  getDecisionValidationEngine,
  getValidationRules,
  replayValidation,
  validateDecisionContract,
  validateDomain,
} from "@/services/decision-validation-engine";
import type { DecisionValidationDomain, DecisionValidationErrorClass, DecisionValidationScenario } from "@/types/decision-validation-engine";

describe("decision validation engine", () => {
  it("validates the baseline decision contract before orchestration", () => {
    const engine = getDecisionValidationEngine();

    expect(engine.validation_order).toEqual(["SCHEMA", "LIFECYCLE", "GOVERNANCE", "CONSTITUTION", "AUTHORITY", "REPLAY", "LINEAGE", "INTEGRITY"]);
    expect(engine.report.validation_result).toBe("PASS");
    expect(engine.report.failures).toEqual([]);
    expect(engine.report.advisory_only).toBe(true);
    expect(engine.replay.replay_valid).toBe(true);
  });

  it("registers deterministic fail-closed rules for every domain", () => {
    const rules = getValidationRules();

    expect(rules).toHaveLength(8);
    expect(rules.map((rule) => rule.validation_domain)).toEqual(["SCHEMA", "LIFECYCLE", "GOVERNANCE", "CONSTITUTION", "AUTHORITY", "REPLAY", "LINEAGE", "INTEGRITY"]);
    expect(rules.every((rule) => rule.fail_closed && rule.replay_supported)).toBe(true);
  });

  it("supports conditional pass for approved non-functional warnings", () => {
    const report = validateDecisionContract({ scenario: "CONDITIONAL_WARNING" });

    expect(report.validation_result).toBe("CONDITIONAL_PASS");
    expect(report.failures).toEqual([]);
    expect(report.warnings).toContain("OPTIONAL_VISUALIZATION_METADATA_MISSING");
  });

  it.each<[
    DecisionValidationScenario,
    DecisionValidationDomain,
    DecisionValidationErrorClass,
  ]>([
    ["SCHEMA_INVALID", "SCHEMA", "REPLAY_ERROR"],
    ["LIFECYCLE_INVALID", "LIFECYCLE", "LIFECYCLE_ERROR"],
    ["GOVERNANCE_MISSING", "GOVERNANCE", "GOVERNANCE_ERROR"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTION", "CONSTITUTION_ERROR"],
    ["AUTHORITY_ESCALATION", "AUTHORITY", "AUTHORITY_ERROR"],
    ["REPLAY_INCONSISTENCY", "REPLAY", "REPLAY_ERROR"],
    ["LINEAGE_CORRUPTION", "LINEAGE", "LINEAGE_ERROR"],
    ["INTEGRITY_MISMATCH", "INTEGRITY", "INTEGRITY_ERROR"],
    ["UNSUPPORTED_VERSION", "SCHEMA", "VERSION_ERROR"],
    ["TENANT_VIOLATION", "SCHEMA", "TENANT_ERROR"],
  ])("fails closed for %s", (scenario, domain, errorClass) => {
    const report = validateDecisionContract({ scenario });

    expect(report.validation_result).toBe("FAIL");
    expect(report.failures.some((failure) => failure.validation_domain === domain)).toBe(true);
    expect(report.failures.some((failure) => failure.error_class === errorClass)).toBe(true);
    expect(report.failures.every((failure) => failure.fail_closed)).toBe(true);
  });

  it("validates individual domains with immutable evidence", () => {
    const replay = validateDomain("REPLAY", { scenario: "REPLAY_INCONSISTENCY" });
    const integrity = validateDomain("INTEGRITY", { scenario: "INTEGRITY_MISMATCH" });

    expect(replay.validation_result).toBe("FAIL");
    expect(replay.replay_refs.length).toBeGreaterThan(0);
    expect(integrity.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates reproducible validation reports", () => {
    const domains = [
      validateDomain("SCHEMA"),
      validateDomain("LIFECYCLE"),
      validateDomain("GOVERNANCE"),
      validateDomain("CONSTITUTION"),
      validateDomain("AUTHORITY"),
      validateDomain("REPLAY"),
      validateDomain("LINEAGE"),
      validateDomain("INTEGRITY"),
    ];

    const first = generateValidationReport(domains);
    const second = generateValidationReport(domains);

    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayValidation(first)).toEqual(replayValidation(second));
  });

  it("classifies validation errors deterministically", () => {
    expect(classifyValidationError("SCHEMA", "UNSUPPORTED_CONTRACT_VERSION")).toBe("VERSION_ERROR");
    expect(classifyValidationError("INTEGRITY", "HASH_MISMATCH")).toBe("INTEGRITY_ERROR");
    expect(classifyValidationError("LINEAGE", "CIRCULAR_LINEAGE")).toBe("LINEAGE_ERROR");
    expect(classifyValidationError("AUTHORITY", "PRIVILEGE_ESCALATION")).toBe("AUTHORITY_ERROR");
  });

  it("emits observability for reports, failures, and replay fidelity", () => {
    const reports = [
      validateDecisionContract(),
      validateDecisionContract({ scenario: "CONDITIONAL_WARNING" }),
      validateDecisionContract({ scenario: "INTEGRITY_MISMATCH" }),
    ];

    const observability = buildDecisionValidationObservability(reports);

    expect(observability.validation_requests).toBe(3);
    expect(observability.pass_rate).toBe(1 / 3);
    expect(observability.conditional_pass_rate).toBe(1 / 3);
    expect(observability.failure_rate).toBe(1 / 3);
    expect(observability.validation_domain_failures.INTEGRITY).toBeGreaterThan(0);
    expect(observability.deterministic_replay_success_rate).toBe(1);
  });
});
