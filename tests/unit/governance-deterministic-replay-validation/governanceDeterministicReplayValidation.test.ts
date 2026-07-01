import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceDeterministicReplayValidationObservabilitySurface,
  getGovernanceDeterministicReplayValidationContract,
  runGovernanceDeterministicReplayValidation,
} from "@/services/governance-deterministic-replay-validation";
import type { GovernanceDeterministicReplayScenario, GovernanceReplayValidationComponent, GovernanceReplayValidationState } from "@/types/governance-deterministic-replay-validation";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7L.2 Deterministic Replay Validation", () => {
  it("defines deterministic replay validation doctrine", () => {
    const contract = getGovernanceDeterministicReplayValidationContract();

    expect(contract.doctrine.schema_version).toBe("governance-deterministic-replay-validation/v7L.2");
    expect(contract.doctrine.principles).toContain("binary-output-equality");
    expect(contract.doctrine.principles).toContain("lineage-equality");
    expect(contract.doctrine.failure_states).toContain("LINEAGE_FAILED");
    expect(contract.doctrine.components).toContain("GOVERNANCE_STATE");
  });

  it("validates baseline replay as deterministic and identical", () => {
    const report = runGovernanceDeterministicReplayValidation();

    expect(report.phase_version).toBe("7L.2");
    expect(report.replay_validation_run.validation_result).toBe("PASS");
    expect(report.validation_outcome.overall_result).toBe("PASS");
    expect(report.validation_outcome.failure_count).toBe(0);
    expect(report.comparisons.every((comparison) => comparison.comparison_result === "PASS")).toBe(true);
    expect(report.timeline.at(-1)?.state).toBe("VALIDATED");
  });

  it("compares all replay domains", () => {
    const report = runGovernanceDeterministicReplayValidation();
    const components = report.comparisons.map((comparison) => comparison.component);

    expect(components).toEqual(["POLICY", "RECOMMENDATION", "COMPLIANCE", "RISK", "ESCALATION", "LINEAGE", "GOVERNANCE_STATE", "OUTPUT", "ORDERING", "CONFIDENCE"]);
    expect(report.validation_outcome.policy_result).toBe("PASS");
    expect(report.validation_outcome.recommendation_result).toBe("PASS");
    expect(report.validation_outcome.compliance_result).toBe("PASS");
    expect(report.validation_outcome.risk_result).toBe("PASS");
    expect(report.validation_outcome.escalation_result).toBe("PASS");
    expect(report.validation_outcome.lineage_result).toBe("PASS");
    expect(report.validation_outcome.governance_state_result).toBe("PASS");
  });

  it("is deterministic across repeated validation runs", () => {
    const first = runGovernanceDeterministicReplayValidation();
    const second = runGovernanceDeterministicReplayValidation();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.validation_outcome.outcome_hash).toBe(first.validation_outcome.outcome_hash);
    expect(second.comparisons.map((comparison) => comparison.comparison_hash)).toEqual(first.comparisons.map((comparison) => comparison.comparison_hash));
  });

  it("stores replay evidence immutably", () => {
    const report = runGovernanceDeterministicReplayValidation();

    expect(report.evidence_package.immutable_evidence_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.replay_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.lineage_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.integrity_hashes.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.comparison_hashes).toEqual(report.comparisons.map((comparison) => comparison.comparison_hash));
  });

  it.each([
    ["POLICY_MISMATCH", "POLICY", "COMPARISON_FAILED"],
    ["RECOMMENDATION_MISMATCH", "RECOMMENDATION", "COMPARISON_FAILED"],
    ["COMPLIANCE_MISMATCH", "COMPLIANCE", "COMPARISON_FAILED"],
    ["RISK_MISMATCH", "RISK", "COMPARISON_FAILED"],
    ["ESCALATION_MISMATCH", "ESCALATION", "COMPARISON_FAILED"],
    ["LINEAGE_MISMATCH", "LINEAGE", "LINEAGE_FAILED"],
    ["GOVERNANCE_STATE_MISMATCH", "GOVERNANCE_STATE", "STATE_FAILED"],
    ["OUTPUT_MISMATCH", "OUTPUT", "COMPARISON_FAILED"],
    ["ORDERING_MISMATCH", "ORDERING", "COMPARISON_FAILED"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE", "COMPARISON_FAILED"],
    ["REPLAY_EVIDENCE_MISSING", "OUTPUT", "REPLAY_FAILED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "OUTPUT", "INTEGRITY_FAILED"],
    ["TENANT_ISOLATION_VIOLATION", "GOVERNANCE_STATE", "STATE_FAILED"],
    ["HIDDEN_REPLAY_STATE", "GOVERNANCE_STATE", "STATE_FAILED"],
  ] as readonly [GovernanceDeterministicReplayScenario, GovernanceReplayValidationComponent, GovernanceReplayValidationState][])("fails closed for %s", (scenario, component, finalState) => {
    const report = runGovernanceDeterministicReplayValidation({ scenario });
    const failed = report.comparisons.find((comparison) => comparison.component === component);

    expect(report.replay_validation_run.validation_result).toBe("FAIL");
    expect(report.validation_outcome.failure_count).toBeGreaterThan(0);
    expect(report.timeline.at(-1)?.state).toBe(finalState);
    expect(failed?.comparison_result).toBe("FAIL");
    expect(failed?.difference_type).not.toBe("NONE");
  });

  it("keeps replay read-only, advisory-only, and tenant isolated", () => {
    const report = runGovernanceDeterministicReplayValidation();

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.replay_mutation_allowed).toBe(false);
    expect(report.governance_execution_allowed).toBe(false);
    expect(report.tenant_isolated).toBe(true);
    expect(report.replay_lineage_preserved).toBe(true);
  });

  it("exposes observability", () => {
    const surface = buildGovernanceDeterministicReplayValidationObservabilitySurface({ scenario: "LINEAGE_MISMATCH" });

    expect(surface.validation_result).toBe("FAIL");
    expect(surface.validation_state).toBe("LINEAGE_FAILED");
    expect(surface.comparison_count).toBeGreaterThan(0);
    expect(surface.mismatch_count).toBeGreaterThan(0);
    expect(surface.replay_success_rate).toBe(0);
    expect(surface.report_hash).toBeTruthy();
  });
});
