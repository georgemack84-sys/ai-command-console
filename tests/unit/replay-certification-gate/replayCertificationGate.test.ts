import { describe, expect, it } from "vitest";
import {
  buildReplayCertificationVisibilitySurface,
  getReplayCertificationGateContract,
  runReplayCertificationGate,
} from "@/services/replay-certification-gate";
import type { ReplayCertificationFailure, ReplayCertificationScenario } from "@/types/replay-certification-gate";

describe("Mission Control Phase 8G.5 Replay Certification Gate", () => {
  it("publishes replay certification doctrine", () => {
    const contract = getReplayCertificationGateContract();

    expect(contract.doctrine.certification_version).toBe("replay-certification-gate/v8G.5");
    expect(contract.doctrine.principles).toContain("deterministic-replay-certified");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.areas).toContain("EXPLAINABILITY");
    expect(contract.doctrine.workflow.at(0)).toBe("REGISTER_CERTIFICATION");
  });

  it("certifies the baseline Phase 8G replay stack", () => {
    const report = runReplayCertificationGate();

    expect(report.phase).toBe("8G.5");
    expect(report.certification_result.certification_state).toBe("PASS");
    expect(report.readiness.readiness_status).toBe("PRODUCTION_READY");
    expect(report.downstream_autonomy_unlocked).toBe(true);
    expect(report.certification_checks.every((check) => check.passed)).toBe(true);
    expect(report.deterministic).toBe(true);
    expect(report.governance_compliant).toBe(true);
    expect(report.constitutionally_compliant).toBe(true);
    expect(report.tenant_isolated).toBe(true);
  });

  it("records immutable evidence, audit, readiness, ledger, metrics, and signature", () => {
    const report = runReplayCertificationGate();

    expect(report.certification_evidence.phase).toBe("8G.5");
    expect(report.certification_evidence.evidence_hashes.length).toBeGreaterThan(3);
    expect(report.certification_evidence.replay_references.length).toBeGreaterThan(3);
    expect(report.audit_report.integrity_verification).toBe("VALID");
    expect(report.ledger_entry.append_only).toBe(true);
    expect(report.quality_metrics.overall_score).toBe(1);
    expect(report.digital_signature).toBeTruthy();
  });

  it("is deterministic across repeated certification runs", () => {
    const first = runReplayCertificationGate();
    const second = runReplayCertificationGate();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.digital_signature).toBe(first.digital_signature);
    expect(second.certification_evidence.evidence_hash).toBe(first.certification_evidence.evidence_hash);
    expect(second.certification_checks.map((check) => check.check_hash)).toEqual(first.certification_checks.map((check) => check.check_hash));
  });

  it("allows conditional pass only for non-critical metadata gaps", () => {
    const report = runReplayCertificationGate({ scenario: "MINOR_REPLAY_METADATA_GAP" });

    expect(report.certification_result.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.certification_result.warning_count).toBe(1);
    expect(report.certification_result.critical_failure_count).toBe(0);
    expect(report.downstream_autonomy_unlocked).toBe(false);
    expect(report.readiness.readiness_status).toBe("BLOCKED_PENDING_FULL_PASS");
  });

  it.each([
    "REPLAY_CONTRACT_INVALID",
    "EXECUTION_MISMATCH",
    "PLANNING_MISMATCH",
    "DECISION_MISMATCH",
    "DELEGATION_MISMATCH",
    "SUPERVISION_MISMATCH",
    "INTERVENTION_MISMATCH",
    "ROLLBACK_MISMATCH",
    "PAUSE_MISMATCH",
    "CONFIDENCE_MISMATCH",
    "EXECUTION_ORDERING_NONDETERMINISTIC",
    "CHECKPOINT_MISMATCH",
    "GOVERNANCE_EVIDENCE_MISSING",
    "INTEGRITY_HASH_VERIFICATION_FAILED",
    "REPLAY_LINEAGE_INCOMPLETE",
    "TENANT_ISOLATION_VIOLATION",
    "AUTHORITY_ESCALATION_DETECTED",
    "CONSTITUTIONAL_COMPLIANCE_BROKEN",
    "REPLAY_NOT_EXPLAINABLE",
  ] as readonly ReplayCertificationScenario[])("fails certification for %s", (scenario) => {
    const report = runReplayCertificationGate({ scenario });
    const failed = report.certification_checks.find((check) => check.failure_reason === scenario as ReplayCertificationFailure);

    expect(report.certification_result.certification_state).toBe("FAIL");
    expect(report.certification_result.failed_tests).toContain(scenario as ReplayCertificationFailure);
    expect(report.readiness.readiness_status).toBe("CERTIFICATION_DENIED");
    expect(report.downstream_autonomy_unlocked).toBe(false);
    expect(failed?.passed).toBe(false);
  });

  it("exposes replay certification visibility", () => {
    const surface = buildReplayCertificationVisibilitySurface({ scenario: "TENANT_ISOLATION_VIOLATION" });

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.readiness_status).toBe("CERTIFICATION_DENIED");
    expect(surface.downstream_autonomy_unlocked).toBe(false);
    expect(surface.blocking_issues).toContain("TENANT_ISOLATION_VIOLATION");
    expect(surface.integrity_status).toBe("VALID");
  });
});
