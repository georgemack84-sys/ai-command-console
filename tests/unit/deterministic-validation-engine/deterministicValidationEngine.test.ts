import { describe, expect, it, vi } from "vitest";
import {
  buildDeterministicValidationObservabilitySurface,
  computeDeterministicValidationReportHash,
  getDeterministicValidationContract,
  runDeterministicValidation,
  validateDeterministicValidationReport,
} from "@/services/deterministic-validation-engine";
import type { DeterministicValidationFailure, DeterministicValidationScenario } from "@/types/deterministic-validation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8K.2 Deterministic Validation Engine", () => {
  it("defines deterministic validation doctrine, states, and scope", () => {
    const contract = getDeterministicValidationContract();

    expect(contract.doctrine.engine_version).toBe("deterministic-validation-engine/v8K.2");
    expect(contract.doctrine.principles).toContain("input-determinism");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.validation_states).toEqual(["REGISTERED", "INPUT_VALIDATION", "ENVIRONMENT_VALIDATION", "BASELINE_EXECUTION", "REPEAT_EXECUTION", "COMPARISON", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "GOVERNANCE_VALIDATION", "AUTHORITY_VALIDATION", "VISIBILITY_VALIDATION", "TENANT_VALIDATION", "ASSESSMENT", "COMPLETE"]);
    expect(contract.doctrine.validation_scope).toEqual(["PLANNING", "ORCHESTRATION", "DELEGATION", "RUNTIME_SUPERVISION", "REPLAY", "INTEGRITY", "GOVERNANCE", "AUTHORITY", "VISIBILITY", "TENANT_ISOLATION"]);
  });

  it("validates identical certified inputs as deterministic", () => {
    const report = runDeterministicValidation();
    const validation = validateDeterministicValidationReport(report);

    expect(report.engine_version).toBe("deterministic-validation-engine/v8K.2");
    expect(report.validation_state).toBe("COMPLETE");
    expect(report.deterministic_result).toBe("DETERMINISTIC");
    expect(report.severity).toBe("NONE");
    expect(report.detected_differences).toEqual([]);
    expect(report.baseline_execution.signature_hash).toBe(report.comparison_execution.signature_hash);
    expect(report.comparisons.length).toBe(10);
    expect(report.comparisons.every((comparison) => comparison.status === "MATCH")).toBe(true);
    expect(report.evidence.length).toBe(10);
    expect(report.certification_contract.certification_decision).toBe("PASS");
    expect(validation.valid).toBe(true);
  });

  it("preserves normalized signatures and immutable validation evidence", () => {
    const report = runDeterministicValidation();

    expect(report.input_signature).toBe(report.baseline_execution.input_signature);
    expect(report.environment_signature).toBe(report.baseline_execution.environment_signature);
    expect(report.state_signature).toBe(report.comparison_execution.state_signature);
    expect(report.decision_signature).toBe(report.comparison_execution.decision_signature);
    expect(report.confidence_signature).toBe(report.comparison_execution.confidence_signature);
    expect(report.replay_signature).toBe(report.comparison_execution.replay_signature);
    expect(report.integrity_signature).toBe(report.comparison_execution.integrity_signature);
    expect(report.governance_signature).toBe(report.comparison_execution.governance_signature);
    expect(report.authority_signature).toBe(report.comparison_execution.authority_signature);
    expect(report.visibility_signature).toBe(report.comparison_execution.visibility_signature);
    expect(report.tenant_signature).toBe(report.comparison_execution.tenant_signature);
    expect(report.evidence.every((evidence) => evidence.replay_reference && evidence.lineage_reference && evidence.integrity_hash && evidence.immutable_reference)).toBe(true);
  });

  it("repeats deterministic validation reports with identical hashes", () => {
    const first = runDeterministicValidation({ component: "CONTROLLED_AUTONOMY" });
    const second = runDeterministicValidation({ component: "CONTROLLED_AUTONOMY" });

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.comparisons.map((comparison) => comparison.comparison_hash)).toEqual(first.comparisons.map((comparison) => comparison.comparison_hash));
    expect(first.report_hash).toBe(computeDeterministicValidationReportHash(first));
  });

  it.each([
    ["PLANNING_DIVERGENCE", "PLANNING_DIVERGENCE_DETECTED"],
    ["EXECUTION_DIVERGENCE", "EXECUTION_DIVERGENCE_DETECTED"],
    ["DELEGATION_DIVERGENCE", "DELEGATION_DIVERGENCE_DETECTED"],
    ["SUPERVISION_DIVERGENCE", "SUPERVISION_DIVERGENCE_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH_DETECTED"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_MISMATCH_DETECTED"],
    ["VISIBILITY_MISMATCH", "VISIBILITY_MISMATCH_DETECTED"],
    ["LINEAGE_MISMATCH", "LINEAGE_MISMATCH_DETECTED"],
    ["REPLAY_CORRUPTION", "REPLAY_CORRUPTION_DETECTED"],
    ["HIDDEN_EXECUTION_STATE", "HIDDEN_EXECUTION_STATE_DETECTED"],
    ["HIDDEN_GOVERNANCE_STATE", "HIDDEN_GOVERNANCE_STATE_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["CROSS_TENANT_STATE_LEAKAGE", "CROSS_TENANT_STATE_LEAKAGE_DETECTED"],
    ["NONDETERMINISTIC_STATE_TRANSITIONS", "NONDETERMINISTIC_STATE_TRANSITIONS_DETECTED"],
    ["MUTABLE_HISTORICAL_EVIDENCE", "MUTABLE_HISTORICAL_EVIDENCE_DETECTED"],
  ] as readonly [DeterministicValidationScenario, DeterministicValidationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runDeterministicValidation({ scenario });
      const validation = validateDeterministicValidationReport(report);

      expect(report.deterministic_result).toBe("NONDETERMINISTIC");
      expect(report.detected_differences).toContain(failure);
      expect(report.comparisons.some((comparison) => comparison.status === "MISMATCH")).toBe(true);
      expect(report.comparisons.map((comparison) => comparison.detected_failure)).toContain(failure);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("escalates critical tenant and mutable-history failures", () => {
    const tenant = runDeterministicValidation({ scenario: "CROSS_TENANT_STATE_LEAKAGE" });
    const mutable = runDeterministicValidation({ scenario: "MUTABLE_HISTORICAL_EVIDENCE" });

    expect(tenant.severity).toBe("CRITICAL");
    expect(mutable.severity).toBe("CRITICAL");
  });

  it("exposes deterministic validation observability", () => {
    const surface = buildDeterministicValidationObservabilitySurface(runDeterministicValidation({ scenario: "REPLAY_CORRUPTION" }));

    expect(surface.deterministic_result).toBe("NONDETERMINISTIC");
    expect(surface.failures).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(surface.validation_state).toBe("COMPLETE");
    expect(surface.comparison_count).toBe(10);
    expect(surface.mismatches).toBeGreaterThan(0);
    expect(surface.evidence_records).toBe(10);
    expect(surface.severity).toBe("HIGH");
  });
});
