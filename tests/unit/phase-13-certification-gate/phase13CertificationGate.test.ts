import { describe, expect, it } from "vitest";
import {
  getPhase13CertificationGateBundle,
  replayPhase13CertificationGate,
  runPhase13CertificationGate,
  validatePhase13CertificationGate,
} from "@/services/phase-13-certification-gate";
import type { Phase13CertificationScenario } from "@/types/phase-13-certification-gate";

describe("Mission Control Phase 13.12 Certification Gate", () => {
  it("publishes the Phase 13 certification doctrine", () => {
    const bundle = getPhase13CertificationGateBundle();

    expect(bundle.doctrine.version).toBe("phase-13-certification-gate/v13.12");
    expect(bundle.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(bundle.doctrine.complete_phase_certification_required).toBe(true);
    expect(bundle.doctrine.certification_modifies_specifications).toBe(false);
    expect(bundle.doctrine.immutable_evidence_required).toBe(true);
    expect(bundle.doctrine.deterministic_decisions_required).toBe(true);
    expect(bundle.doctrine.replayable_decisions_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("certifies Phase 13 deterministically", () => {
    const first = runPhase13CertificationGate();
    const second = runPhase13CertificationGate();

    expect(first.decision.certification_outcome).toBe("PASS");
    expect(first.final_report.phase_13_normative_language_certified).toBe(true);
    expect(first.final_report.future_specification_foundation_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePhase13CertificationGate(first).valid).toBe(true);
    expect(replayPhase13CertificationGate(first)).toBe(true);
  });

  it("executes the complete certification test matrix", () => {
    const result = runPhase13CertificationGate();

    expect(result.tests).toHaveLength(25);
    expect(result.tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.tests.map((test) => test.name)).toEqual([
      "Constitutional authority hierarchy enforced",
      "Authority precedence deterministic",
      "Operator authority bounded by governance",
      "Governance authority bounded by Constitution",
      "Mission Control advisory-only boundary enforced",
      "Authority Boundary Interface validated",
      "Audit ownership preserved across boundaries",
      "Assurance dependency graph deterministic",
      "PRUNED semantics implemented",
      "Closed assurance result vocabulary enforced",
      "Certification aggregation deterministic",
      "CertificationDecisionRecord immutable",
      "Replay deterministic",
      "Unexplained replay divergence fails closed",
      "Replay evidence preserved",
      "Assurance lineage complete",
      "Integrity verification reproducible",
      "Specification lifecycle governed",
      "Document taxonomy complete",
      "Amendment and addendum governance enforced",
      "Reconciliation process defined",
      "Vocabulary consistency validated",
      "Cross-reference integrity verified",
      "Specification replay reproducible",
      "Specification internally consistent",
    ]);
  });

  it("binds evidence and records immutable certification artifacts", () => {
    const result = runPhase13CertificationGate();

    expect(result.contract.certification_evidence_refs).toHaveLength(9);
    expect(result.evidence_binder.append_only).toBe(true);
    expect(result.evidence_binder.fully_explainable).toBe(true);
    expect(result.evidence_binder.supports_independent_verification).toBe(true);
    expect(result.certification_ledger).toHaveLength(6);
    expect(result.certification_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable)).toBe(true);
    expect(result.replay_validator.deterministic).toBe(true);
    expect(result.replay_validator.identical_outcome).toBe(true);
  });

  it("certifies all Phase 13 domains", () => {
    const result = runPhase13CertificationGate();

    expect(result.constitutional_compliance.outcome).toBe("PASS");
    expect(result.authority_certification.outcome).toBe("PASS");
    expect(result.assurance_certification.outcome).toBe("PASS");
    expect(result.replay_certification.outcome).toBe("PASS");
    expect(result.governance_certification.outcome).toBe("PASS");
    expect(result.specification_integrity_certification.outcome).toBe("PASS");
  });

  it("supports conditional pass for non-constitutional documentation conditions", () => {
    const result = runPhase13CertificationGate({ scenario: "NON_CONSTITUTIONAL_DOCUMENTATION_ISSUE" });
    const validation = validatePhase13CertificationGate(result);

    expect(result.decision.certification_outcome).toBe("CONDITIONAL_PASS");
    expect(result.decision.conditions).toHaveLength(1);
    expect(result.final_report.conditions).toEqual(result.decision.conditions);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "CONSTITUTIONAL_AUTHORITY_FAILURE",
    "AUTHORITY_BOUNDARY_FAILURE",
    "ASSURANCE_DEPENDENCY_FAILURE",
    "ASSURANCE_EVALUATION_FAILURE",
    "REPLAY_DETERMINISM_FAILURE",
    "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED",
    "ASSURANCE_LINEAGE_INCOMPLETE",
    "SPECIFICATION_GOVERNANCE_FAILURE",
    "DOCUMENT_TAXONOMY_FAILURE",
    "AMENDMENT_GOVERNANCE_FAILURE",
    "SPECIFICATION_INTEGRITY_FAILURE",
    "EVIDENCE_BINDING_INCOMPLETE",
    "CERTIFICATION_REPLAY_FAILURE",
    "CERTIFICATION_LEDGER_MUTABLE",
  ] as const)("fails certification for %s", (scenario: Phase13CertificationScenario) => {
    const result = runPhase13CertificationGate({ scenario });
    const validation = validatePhase13CertificationGate(result);

    expect(result.decision.certification_outcome).toBe("FAIL");
    expect(result.final_report.phase_13_normative_language_certified).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("detects nested certification decision tampering", () => {
    const result = runPhase13CertificationGate();
    const tampered = {
      ...result,
      decision: {
        ...result.decision,
        certification_reasoning: "tampered reasoning",
      },
    };

    expect(validatePhase13CertificationGate(tampered).valid).toBe(false);
  });
});
