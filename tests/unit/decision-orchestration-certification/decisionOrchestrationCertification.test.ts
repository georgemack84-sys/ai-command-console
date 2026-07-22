import { describe, expect, it } from "vitest";
import {
  buildDecisionCertificationObservability,
  evaluateProductionReadiness,
  getDecisionOrchestrationCertificationGate,
  replayCertification,
  runDecisionOrchestrationCertification,
  validateCertificationResults,
} from "@/services/decision-orchestration-certification";
import type { DecisionCertificationScenario } from "@/types/decision-orchestration-certification";

describe("decision orchestration contract certification gate", () => {
  it("certifies the complete Phase 9.1 foundation on PASS", () => {
    const gate = getDecisionOrchestrationCertificationGate();

    expect(gate.report.certification_record.certification_result).toBe("PASS");
    expect(gate.validation.production_authorized).toBe(true);
    expect(gate.replay.replay_valid).toBe(true);
    expect(gate.readiness.production_authorized).toBe(true);
    expect(gate.report.failures).toEqual([]);
    expect(gate.report.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates complete immutable certification evidence", () => {
    const report = runDecisionOrchestrationCertification();

    expect(report.certification_record.phase_id).toBe("9.1.12");
    expect(report.certification_record.certification_tests.length).toBeGreaterThan(40);
    expect(report.evidence_package.testing_evidence.length).toBeGreaterThan(0);
    expect(report.evidence_package.certification_evidence.length).toBe(report.certification_record.certification_tests.length);
    expect(report.certification_record.replay_refs.length).toBeGreaterThan(0);
    expect(report.certification_record.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates certification completeness and deterministic replay", () => {
    const report = runDecisionOrchestrationCertification();
    const validation = validateCertificationResults(report);
    const replay = replayCertification(report);

    expect(validation.validation_status).toBe("PASS");
    expect(validation.completeness_verified).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_outcome).toBe("PASS");
  });

  it("allows conditional pass only for non-architectural documentation gaps", () => {
    const report = runDecisionOrchestrationCertification({ scenario: "CONDITIONAL_DOCUMENTATION_GAP" });
    const validation = validateCertificationResults(report);
    const readiness = evaluateProductionReadiness(report);

    expect(report.certification_record.certification_result).toBe("CONDITIONAL_PASS");
    expect(validation.validation_status).toBe("PASS");
    expect(validation.production_authorized).toBe(false);
    expect(readiness.production_authorized).toBe(false);
    expect(readiness.outstanding_findings).toContain("Documentation or developer-experience gaps remain before PASS.");
  });

  it.each<[
    DecisionCertificationScenario,
    string,
  ]>([
    ["TEST_EVIDENCE_MISSING", "CERTIFICATION_EVIDENCE_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_REFERENCE_MISSING"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_REFERENCE_MISSING"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_VIOLATION"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_FAILURE"],
    ["API_INCOMPATIBILITY", "SDK_INCOMPATIBILITY"],
  ])("fails closed for %s", (scenario, failure) => {
    const report = runDecisionOrchestrationCertification({ scenario });
    const validation = validateCertificationResults(report);

    expect(report.certification_record.certification_result).toBe("FAIL");
    expect(report.failures).toContain(failure);
    expect(validation.production_authorized).toBe(false);
  });

  it("emits certification observability", () => {
    const pass = runDecisionOrchestrationCertification();
    const fail = runDecisionOrchestrationCertification({ scenario: "AUTHORITY_ESCALATION" });
    const observability = buildDecisionCertificationObservability([pass, fail]);

    expect(observability.certification_pass_rate).toBe(0.5);
    expect(observability.replay_fidelity).toBe(1);
    expect(observability.integrity_verification_rate).toBe(1);
    expect(observability.governance_compliance_rate).toBe(1);
    expect(observability.authority_violations).toBeGreaterThan(0);
    expect(observability.certification_evidence_completeness).toBe(1);
  });
});
