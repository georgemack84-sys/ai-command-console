import { describe, expect, it } from "vitest";
import {
  getCertificationLineageSupersessionBundle,
  replayCertificationLineageSupersession,
  runCertificationLineageSupersession,
  validateCertificationLineageSupersession,
} from "@/services/certification-lineage-supersession";
import type { CertificationLineageFailure } from "@/types/certification-lineage-supersession";

describe("Mission Control Phase 14.9 Certification Lineage & Supersession", () => {
  it("publishes lineage and supersession doctrine", () => {
    const bundle = getCertificationLineageSupersessionBundle();

    expect(bundle.doctrine.version).toBe("certification-lineage-supersession/v14.9");
    expect(bundle.doctrine.dependency_governance_phase).toBe("assurance-dependency-governance/v14.8");
    expect(bundle.doctrine.violation_lifecycle).toEqual(["DETECTED", "CLASSIFIED", "RECORDED", "LINKED_TO_REMEDIATION", "REPLAY_VERIFIED", "CLOSED"]);
    expect(bundle.doctrine.supersession_reasons).toContain("REMEDIATION_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
  });

  it("preserves immutable certification attempts", () => {
    const result = runCertificationLineageSupersession();

    expect(result.certification_attempts).toHaveLength(2);
    expect(result.certification_attempts[0].outcome).toBe("FAIL");
    expect(result.certification_attempts[0].visible).toBe(true);
    expect(result.certification_attempts[1].outcome).toBe("PASS");
    expect(result.certification_attempts[1].predecessor_certification_id).toBe(result.certification_attempts[0].certification_id);
    expect(result.certification_attempts.every((attempt) => attempt.immutable)).toBe(true);
  });

  it("links violations, remediation, replay, and successor certification", () => {
    const result = runCertificationLineageSupersession({ tenant_id: "tenant_alpha" });

    expect(result.violations[0].tenant_id).toBe("tenant_alpha");
    expect(result.violations[0].lifecycle_state).toBe("CLOSED");
    expect(result.violations[0].remediation_refs).toContain(result.remediation.remediation_id);
    expect(result.remediation.historical_evidence_preserved).toBe(true);
    expect(result.supersession.predecessor_certification_id).toBe(result.certification_attempts[0].certification_id);
    expect(result.supersession.successor_certification_id).toBe(result.certification_attempts[1].certification_id);
  });

  it("governs production escalation without rewriting history", () => {
    const result = runCertificationLineageSupersession();

    expect(result.production_escalation.production_effect).toBe(true);
    expect(result.production_escalation.containment_refs).toHaveLength(1);
    expect(result.production_escalation.forensic_refs).toHaveLength(1);
    expect(result.production_escalation.governance_refs).toHaveLength(1);
    expect(result.production_escalation.successor_certification_refs).toContain(result.certification_attempts[1].certification_id);
    expect(result.production_escalation.escalation_status).toBe("CLOSED");
  });

  it("is deterministic and replayable", () => {
    const first = runCertificationLineageSupersession();
    const second = runCertificationLineageSupersession();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCertificationLineageSupersession(first).valid).toBe(true);
    expect(replayCertificationLineageSupersession(first)).toBe(true);
  });

  it("executes the derived certification matrix", () => {
    const result = runCertificationLineageSupersession();

    expect(result.certification_tests).toHaveLength(18);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Certification lineage complete",
      "Supersession deterministic",
      "Certification attempts immutable",
      "Remediation fully traceable",
      "Successor preserves predecessor lineage",
      "Failed certifications permanently visible",
      "Replay reproducible",
      "Production escalation governed",
      "Forensic evidence immutable",
      "Governance review deterministic",
      "Certification history constitutionally preserved",
      "Violation lifecycle complete",
      "Violation records immutable",
      "Replay references complete",
      "Certification linkage deterministic",
      "Containment precedes remediation",
      "Requalification replay present",
      "Successor certification linked",
    ]);
  });

  it("supports conditional pass for non-constitutional history warnings", () => {
    const result = runCertificationLineageSupersession({ scenario: "NON_CONSTITUTIONAL_HISTORY_WARNING" });
    const validation = validateCertificationLineageSupersession(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "VIOLATION_LIFECYCLE_INVALID",
    "VIOLATION_MUTABLE",
    "REMEDIATION_NOT_TRACEABLE",
    "REPLAY_REFERENCES_INCOMPLETE",
    "CERTIFICATION_LINKAGE_NON_DETERMINISTIC",
    "SUPERSESSION_NON_DETERMINISTIC",
    "PREDECESSOR_NOT_REFERENCED",
    "HISTORICAL_FAIL_REWRITTEN",
    "REPLAY_LINEAGE_INCOMPLETE",
    "CERTIFICATION_IDENTITY_MUTATED",
    "PRODUCTION_ESCALATION_NOT_GOVERNED",
    "CONTAINMENT_AFTER_REMEDIATION",
    "FORENSICS_MUTABLE",
    "GOVERNANCE_REVIEW_MISSING",
    "REQUALIFICATION_REPLAY_MISSING",
    "SUCCESSOR_LINEAGE_MISSING",
    "AUDIT_OWNERSHIP_MISSING",
  ] as const)("fails certification for %s", (scenario: CertificationLineageFailure) => {
    const result = runCertificationLineageSupersession({ scenario });
    const validation = validateCertificationLineageSupersession(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested supersession tampering", () => {
    const result = runCertificationLineageSupersession();
    const tampered = {
      ...result,
      supersession: {
        ...result.supersession,
        predecessor_certification_id: "replacement",
      },
    };

    expect(validateCertificationLineageSupersession(tampered).valid).toBe(false);
  });
});
