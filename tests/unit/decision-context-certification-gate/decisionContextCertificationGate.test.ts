import { describe, expect, it } from "vitest";
import {
  buildDecisionContextCertificationObservability,
  certifyDecisionContext,
  createDecisionContextCertificationGateRequest,
  getDecisionContextCertificationGate,
  replayDecisionContextCertification,
} from "@/services/decision-context-certification-gate";
import type { DecisionContextCertificationScenario } from "@/types/decision-context-certification-gate";

describe("Mission Control Phase 9.3.13 Decision Context Certification Gate", () => {
  it("certifies the complete Decision Context Builder on PASS", () => {
    const gate = getDecisionContextCertificationGate();
    const pkg = gate.certification_package;

    expect(pkg.certification.certification_state).toBe("PASS");
    expect(pkg.failures).toEqual([]);
    expect(pkg.production_readiness_report.deployment_recommendation).toBe("AUTHORIZE_PHASE_9_4_ENTRY");
    expect(pkg.certification_tests.every((test) => test.actual === "PASS")).toBe(true);
    expect(gate.replay.replay_valid).toBe(true);
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates complete certification reports and evidence", () => {
    const pkg = certifyDecisionContext();

    expect(pkg.certification.phase).toBe("9.3.13");
    expect(pkg.certification_tests.length).toBeGreaterThan(10);
    expect(pkg.context_certification_report.validation_summary).toContain("certified");
    expect(pkg.replay_validation_report.replay_fidelity).toBe(true);
    expect(pkg.governance_compliance_report.policy_compliance).toBe("PASS");
    expect(pkg.constitutional_compliance_report.constitutional_validation).toBe("PASS");
    expect(pkg.evidence_package.certification_tests).toHaveLength(pkg.certification_tests.length);
    expect(pkg.evidence_package.certification_artifacts.length).toBeGreaterThan(0);
  });

  it("produces identical certification packages for identical inputs", () => {
    const request = createDecisionContextCertificationGateRequest();
    const first = certifyDecisionContext(request);
    const second = certifyDecisionContext(request);

    expect(second.certification).toEqual(first.certification);
    expect(second.certification_tests).toEqual(first.certification_tests);
    expect(second.evidence_package).toEqual(first.evidence_package);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("allows conditional pass only for non-functional reporting gaps", () => {
    const pkg = certifyDecisionContext(createDecisionContextCertificationGateRequest({ scenario: "CONDITIONAL_REPORTING_GAP" }));

    expect(pkg.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(pkg.failures).toEqual([]);
    expect(pkg.production_readiness_report.deployment_recommendation).toBe("BLOCK_PHASE_9_4_ENTRY");
    expect(pkg.context_certification_report.outstanding_issues).toContain("Close non-functional reporting or visualization gap before production progression.");
  });

  it.each<[
    DecisionContextCertificationScenario,
    string,
  ]>([
    ["MISSING_CONTEXT", "MANDATORY_CONTEXT_MISSING"],
    ["REPLAY_UNAVAILABLE", "REPLAY_DIVERGENCE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VIOLATION"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_VIOLATION"],
    ["AUTHORITY_UNRESOLVED", "AUTHORITY_BOUNDARY_VIOLATION"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_FAILURE"],
    ["INTERFACE_INCOMPATIBLE", "ORCHESTRATION_READINESS_INCOMPLETE"],
  ])("fails closed for %s", (scenario, failure) => {
    const pkg = certifyDecisionContext(createDecisionContextCertificationGateRequest({ scenario }));

    expect(pkg.certification.certification_state).toBe("FAIL");
    expect(pkg.failures).toContain(failure);
    expect(pkg.production_readiness_report.deployment_recommendation).toBe("BLOCK_PHASE_9_4_ENTRY");
  });

  it("replays certification deterministically", () => {
    const pkg = certifyDecisionContext();
    const replay = replayDecisionContextCertification(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_outcome).toBe("PASS");
    expect(replay.failures).toEqual([]);
  });

  it("publishes certification observability metrics", () => {
    const pass = certifyDecisionContext();
    const conditional = certifyDecisionContext(createDecisionContextCertificationGateRequest({ scenario: "CONDITIONAL_REPORTING_GAP" }));
    const fail = certifyDecisionContext(createDecisionContextCertificationGateRequest({ scenario: "AUTHORITY_UNRESOLVED" }));

    const metrics = buildDecisionContextCertificationObservability([pass, conditional, fail]);

    expect(metrics.certification_attempts).toBe(3);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.conditional_pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.replay_fidelity_rate).toBe(1);
    expect(metrics.authority_failure_count).toBeGreaterThan(0);
    expect(metrics.evidence_completeness_rate).toBe(1);
  });

  it("exposes the decision context certification gate package", () => {
    const gate = getDecisionContextCertificationGate();

    expect(gate.phase).toBe("9.3.13");
    expect(gate.certification_version).toBe("decision-context-certification-gate/v1");
    expect(gate.certification_package.certification.certification_state).toBe("PASS");
    expect(gate.observability.certification_attempts).toBe(1);
  });
});
