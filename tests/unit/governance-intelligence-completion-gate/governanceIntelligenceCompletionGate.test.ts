import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceCompletionGateObservabilitySurface,
  getGovernanceIntelligenceCompletionGateContract,
  runGovernanceIntelligenceCompletionGate,
} from "@/services/governance-intelligence-completion-gate";
import type { GovernanceCompletionFailure, GovernanceCompletionScenario, GovernanceCompletionState } from "@/types/governance-intelligence-completion-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7M Governance Intelligence Completion Gate", () => {
  it("defines the integrated completion gate doctrine", () => {
    const contract = getGovernanceIntelligenceCompletionGateContract();

    expect(contract.doctrine.schema_version).toBe("governance-intelligence-completion-gate/v7M");
    expect(contract.doctrine.principles).toContain("integrated-certification");
    expect(contract.doctrine.principles).toContain("phase8-gated");
    expect(contract.doctrine.completion_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.areas).toContain("CERTIFICATION_SUITE");
  });

  it("certifies the baseline Governance Intelligence ecosystem for Phase 8", () => {
    const report = runGovernanceIntelligenceCompletionGate();

    expect(report.phase_version).toBe("7M");
    expect(report.completion_result.overall_state).toBe("PASS");
    expect(report.completion_run.phase8_progression_allowed).toBe(true);
    expect(report.production_deployment_allowed).toBe(true);
    expect(report.completion_result.phase8_decision).toBe("APPROVED_FOR_CONTROLLED_AUTONOMY");
    expect(report.timeline.at(-1)?.state).toBe("CERTIFIED");
  });

  it("validates all integrated completion areas", () => {
    const report = runGovernanceIntelligenceCompletionGate();
    const areas = new Set(report.completion_checks.map((check) => check.area));

    expect(areas).toEqual(new Set(["FOUNDATION", "POLICY", "RISK", "COMPLIANCE", "RECOMMENDATION", "ESCALATION", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION", "CERTIFICATION_SUITE", "ENTERPRISE"]));
    expect(report.completion_checks.length).toBeGreaterThan(40);
    expect(report.completion_checks.every((check) => check.passed)).toBe(true);
  });

  it("is deterministic across repeated completion gate runs", () => {
    const first = runGovernanceIntelligenceCompletionGate();
    const second = runGovernanceIntelligenceCompletionGate();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.completion_result.result_hash).toBe(first.completion_result.result_hash);
    expect(second.completion_checks.map((check) => check.check_hash)).toEqual(first.completion_checks.map((check) => check.check_hash));
  });

  it("records completion evidence in an append-only truth ledger record", () => {
    const report = runGovernanceIntelligenceCompletionGate();

    expect(report.evidence_package.certification_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.replay_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.integrity_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.authority_refs.length).toBeGreaterThan(0);
    expect(report.evidence_package.isolation_refs.length).toBeGreaterThan(0);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.truth_ledger_record.check_hashes).toEqual(report.completion_checks.map((check) => check.check_hash));
  });

  it("supports conditional pass for non-critical visibility refinements while blocking production Phase 8 certification", () => {
    const report = runGovernanceIntelligenceCompletionGate({ scenario: "MINOR_VISIBILITY_REFINEMENT" });

    expect(report.completion_result.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.completion_result.warning_count).toBe(1);
    expect(report.completion_result.critical_failure_count).toBe(0);
    expect(report.completion_run.phase8_progression_allowed).toBe(false);
    expect(report.production_deployment_allowed).toBe(false);
    expect(report.completion_result.phase8_decision).toBe("LIMITED_INTERNAL_REMEDIATION");
    expect(report.timeline.at(-1)?.state).toBe("CONDITIONAL_CERTIFICATION");
  });

  it.each([
    ["GOVERNANCE_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["POLICY_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["GOVERNANCE_RISK_NOT_OPERATIONAL", "FAIL"],
    ["COMPLIANCE_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["RECOMMENDATION_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["ESCALATION_INTELLIGENCE_NOT_OPERATIONAL", "FAIL"],
    ["GOVERNANCE_LINEAGE_NOT_OPERATIONAL", "FAIL"],
    ["GOVERNANCE_REPLAY_NONDETERMINISTIC", "FAIL"],
    ["GOVERNANCE_INTEGRITY_NOT_VERIFIED", "FAIL"],
    ["VISIBILITY_FRAMEWORK_NOT_OPERATIONAL", "FAIL"],
    ["TENANT_ISOLATION_NOT_ENFORCED", "FAIL"],
    ["CROSS_TENANT_GOVERNANCE_NOT_BLOCKED", "FAIL"],
    ["HIDDEN_GOVERNANCE_STATE_NOT_DETECTED", "FAIL"],
    ["UNSUPPORTED_RECOMMENDATION_ACCEPTED", "FAIL"],
    ["MISSING_EVIDENCE_ACCEPTED", "FAIL"],
    ["REPLAY_MISMATCH_NOT_DETECTED", "FAIL"],
    ["INTEGRITY_VERIFICATION_MISMATCH", "FAIL"],
    ["GOVERNANCE_BYPASS_NOT_DETECTED", "FAIL"],
    ["CONSTITUTIONAL_VIOLATION_ACCEPTED", "FAIL"],
    ["AUTHORITY_EXPANSION_NOT_DETECTED", "FAIL"],
    ["POLICY_CONFLICT_IGNORED", "FAIL"],
    ["COMPLIANCE_VIOLATION_IGNORED", "FAIL"],
    ["ESCALATION_ROUTING_INCONSISTENT", "FAIL"],
    ["LINEAGE_RECONSTRUCTION_MISMATCH", "FAIL"],
    ["GOVERNANCE_VISIBILITY_INCOMPLETE", "FAIL"],
    ["CERTIFICATION_SUITE_NOT_PASSING", "FAIL"],
  ] as readonly [GovernanceCompletionScenario, GovernanceCompletionState][])("blocks Phase 8 for %s", (scenario, state) => {
    const report = runGovernanceIntelligenceCompletionGate({ scenario });
    const failed = report.completion_checks.find((check) => check.failure_reason === scenario as GovernanceCompletionFailure);

    expect(report.completion_result.overall_state).toBe(state);
    expect(report.completion_result.critical_failure_count).toBeGreaterThan(0);
    expect(report.completion_result.blocking_failures).toContain(scenario as GovernanceCompletionFailure);
    expect(report.completion_run.phase8_progression_allowed).toBe(false);
    expect(report.completion_result.phase8_decision).toBe("BLOCKED_IN_PHASE_7");
    expect(report.timeline.at(-1)?.state).toBe("BLOCKED");
    expect(failed?.passed).toBe(false);
  });

  it("keeps the completion gate read-only, advisory-only, and governance safe", () => {
    const report = runGovernanceIntelligenceCompletionGate();

    expect(report.read_only).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.phase8_controlled_autonomy_gate).toBe(true);
    expect(report.governance_execution_allowed).toBe(false);
    expect(report.tenant_isolated).toBe(true);
    expect(report.authority_protected).toBe(true);
    expect(report.deterministic).toBe(true);
    expect(report.replayable).toBe(true);
    expect(report.integrity_protected).toBe(true);
    expect(report.operator_visible).toBe(true);
  });

  it("exposes completion gate observability", () => {
    const surface = buildGovernanceCompletionGateObservabilitySurface({ scenario: "CERTIFICATION_SUITE_NOT_PASSING" });

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.lifecycle_state).toBe("BLOCKED");
    expect(surface.completion_test_count).toBeGreaterThan(40);
    expect(surface.critical_failure_count).toBeGreaterThan(0);
    expect(surface.phase8_decision).toBe("BLOCKED_IN_PHASE_7");
    expect(surface.phase8_progression_allowed).toBe(false);
    expect(surface.report_hash).toBeTruthy();
  });
});
