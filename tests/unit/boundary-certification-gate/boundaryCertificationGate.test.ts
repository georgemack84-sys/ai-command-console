import { describe, expect, it } from "vitest";
import {
  buildBoundaryCertificationVisibilitySurface,
  getBoundaryCertificationGateContract,
  runBoundaryCertificationGate,
} from "@/services/boundary-certification-gate";
import type { BoundaryCertificationFailure, BoundaryCertificationScenario } from "@/types/boundary-certification-gate";

describe("Mission Control Phase 8F.5 Boundary Certification Gate", () => {
  it("publishes boundary certification doctrine", () => {
    const contract = getBoundaryCertificationGateContract();

    expect(contract.doctrine.certification_version).toBe("boundary-certification-gate/v8F.5");
    expect(contract.doctrine.principles).toContain("boundary-enforcement-certified");
    expect(contract.doctrine.principles).toContain("attack-resistant");
    expect(contract.doctrine.states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.areas).toContain("CERTIFICATION_SUITE");
  });

  it("certifies the baseline Phase 8F boundary stack", () => {
    const report = runBoundaryCertificationGate();

    expect(report.phase).toBe("8F.5");
    expect(report.certification_result.overall_state).toBe("PASS");
    expect(report.controlled_autonomy_progression_allowed).toBe(true);
    expect(report.certification_result.progression_decision).toBe("CERTIFIED_FOR_PHASE_8G");
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
    expect(report.operator_supremacy_preserved).toBe(true);
    expect(report.governance_supremacy_preserved).toBe(true);
    expect(report.fail_closed).toBe(true);
  });

  it("records evidence, replay, ledger, stress, attack, and performance artifacts", () => {
    const report = runBoundaryCertificationGate();

    expect(report.certification_evidence.boundary_contract_id).toBeTruthy();
    expect(report.certification_evidence.authority_package_id).toBeTruthy();
    expect(report.certification_evidence.execution_package_id).toBeTruthy();
    expect(report.certification_evidence.governance_package_id).toBe(report.source_governance_package.package_id);
    expect(report.certification_evidence.stress_report_hash).toBeTruthy();
    expect(report.certification_evidence.attack_report_hash).toBeTruthy();
    expect(report.certification_evidence.performance_report_hash).toBeTruthy();
    expect(report.replay_report.reconstructed_pipeline).toContain("Attack Simulation");
    expect(report.ledger_entry.append_only).toBe(true);
    expect(report.digital_signature).toBeTruthy();
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runBoundaryCertificationGate();
    const second = runBoundaryCertificationGate();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.digital_signature).toBe(first.digital_signature);
    expect(second.certification_evidence.evidence_hash).toBe(first.certification_evidence.evidence_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
  });

  it("allows conditional pass only for non-critical visualization gaps", () => {
    const report = runBoundaryCertificationGate({ scenario: "MINOR_VISUALIZATION_GAP" });

    expect(report.certification_result.overall_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
  });

  it.each([
    "AUTHORITY_ESCALATION_PERMITTED",
    "OUTSIDE_SCOPE_EXECUTION_PERMITTED",
    "GOVERNANCE_BYPASS_PERMITTED",
    "POLICY_BYPASS_PERMITTED",
    "CONSTITUTIONAL_VIOLATION_PERMITTED",
    "HIDDEN_RUNTIME_STATE_DETECTED",
    "REPLAY_NONDETERMINISTIC",
    "INTEGRITY_HASH_NOT_REPRODUCIBLE",
    "TENANT_ISOLATION_NOT_ENFORCED",
    "FAIL_CLOSED_NOT_VERIFIED",
    "EVIDENCE_INCOMPLETE",
    "ATTACK_SIMULATION_NOT_BLOCKED",
    "CONSTITUTIONAL_MODIFICATION_PERMITTED",
  ] as readonly BoundaryCertificationScenario[])("fails certification for %s", (scenario) => {
    const report = runBoundaryCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as BoundaryCertificationFailure);

    expect(report.certification_result.overall_state).toBe("FAIL");
    expect(report.certification_result.blocking_failures).toContain(scenario as BoundaryCertificationFailure);
    expect(report.controlled_autonomy_progression_allowed).toBe(false);
    expect(report.certification_result.progression_decision).toBe("BLOCKED_FROM_PHASE_8G");
    expect(failed?.passed).toBe(false);
  });

  it("exposes certification visibility", () => {
    const surface = buildBoundaryCertificationVisibilitySurface({ scenario: "POLICY_BYPASS_PERMITTED" });

    expect(surface.overall_state).toBe("FAIL");
    expect(surface.controlled_autonomy_progression_allowed).toBe(false);
    expect(surface.blocking_failures).toContain("POLICY_BYPASS_PERMITTED");
    expect(surface.integrity_status).toBe("VALID");
  });
});
