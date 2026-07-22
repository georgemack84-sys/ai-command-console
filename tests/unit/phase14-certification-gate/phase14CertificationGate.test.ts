import { describe, expect, it } from "vitest";
import {
  getPhase14CertificationGateBundle,
  replayPhase14CertificationGate,
  runPhase14CertificationGate,
  validatePhase14CertificationGate,
} from "@/services/phase14-certification-gate";
import type { Phase14CertificationFailure } from "@/types/phase14-certification-gate";

describe("Mission Control Phase 14.12 Phase 14 Certification Gate", () => {
  it("publishes final Phase 14 certification doctrine", () => {
    const bundle = getPhase14CertificationGateBundle();

    expect(bundle.doctrine.version).toBe("phase14-certification-gate/v14.12");
    expect(bundle.doctrine.scope).toEqual(["Synthetic Validation Foundation", "Environment Architecture", "Synthetic Identity Generation", "Scenario Orchestration", "Tenant Isolation Validation", "Advisory Boundary Validation", "Scale & Resilience Validation", "Assurance Dependency Governance", "Certification Lineage", "Replay & Integrity", "Operational Monitoring"]);
    expect(bundle.doctrine.evidence_categories).toEqual(["VALIDATION", "DEPENDENCY", "LINEAGE", "REPLAY", "INTEGRITY", "EXPLAINABILITY", "GOVERNANCE", "TENANT_ISOLATION", "ADVISORY_BOUNDARY", "OPERATIONS"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the constitutional certification framework", () => {
    const result = runPhase14CertificationGate();

    expect(result.contract.certification_authority).toBe("CONSTITUTIONAL_CERTIFICATION_ENGINE");
    expect(result.contract.certification_scope).toHaveLength(11);
    expect(result.contract.required_evidence).toHaveLength(10);
    expect(result.contract.dependency_requirements_enforced).toBe(true);
    expect(result.contract.replay_required).toBe(true);
    expect(result.contract.governance_required).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.execution_authority).toBe(false);
  });

  it("aggregates complete immutable certification evidence", () => {
    const result = runPhase14CertificationGate();

    expect(result.evidence_binder.evidence_refs).toHaveLength(11);
    expect(result.evidence_binder.validation_refs).toHaveLength(11);
    expect(result.evidence_binder.dependency_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.lineage_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.replay_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.integrity_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.explainability_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.operational_refs.length).toBeGreaterThan(0);
    expect(result.evidence_binder.deterministic_ordering).toBe(true);
    expect(result.evidence_binder.immutable).toBe(true);
    expect(result.evidence_binder.complete).toBe(true);
  });

  it("enforces dependency certification rules", () => {
    const result = runPhase14CertificationGate();

    expect(result.dependency_certification.dependency_gate_result).toBe("PASS");
    expect(result.dependency_certification.verified_compatible_manifest_refs.length).toBeGreaterThan(0);
    expect(result.dependency_certification.candidates_excluded_from_certification).toBe(true);
    expect(result.dependency_certification.manifest_authority_deterministic).toBe(true);
    expect(result.dependency_certification.phase_13_gate_enforced).toBe(true);
    expect(result.dependency_certification.unverified_dependencies_blocked).toBe(true);
    expect(result.dependency_certification.promotion_lineage_preserved).toBe(true);
  });

  it("validates lineage, replay, governance, and operations readiness", () => {
    const result = runPhase14CertificationGate();

    expect(result.lineage_certification.immutable_history).toBe(true);
    expect(result.lineage_certification.failed_certifications_visible).toBe(true);
    expect(result.lineage_certification.successor_references_predecessor).toBe(true);
    expect(result.lineage_certification.production_effect_refs.length).toBeGreaterThan(0);
    expect(result.replay_certification.deterministic_replay).toBe(true);
    expect(result.replay_certification.integrity_verified).toBe(true);
    expect(result.replay_certification.explainability_reproducible).toBe(true);
    expect(result.governance_certification.tenant_isolation_enforced).toBe(true);
    expect(result.governance_certification.advisory_only_enforced).toBe(true);
    expect(result.governance_certification.execution_authority_prohibited).toBe(true);
    expect(result.operational_readiness.readiness_verified).toBe(true);
  });

  it("produces the final immutable certification record", () => {
    const result = runPhase14CertificationGate();

    expect(result.outcome).toBe("PASS");
    expect(result.certification_record.certification_outcome).toBe("PASS");
    expect(result.certification_record.certification_decision).toBe("PASS");
    expect(result.certification_record.certification_reasoning).toBe("Phase 14 is certified for Mission Control pre-production synthetic validation.");
    expect(result.certification_record.evidence_bundle_refs).toEqual([result.evidence_binder.integrity_hash]);
    expect(result.certification_record.certification_conditions).toHaveLength(0);
  });

  it("is deterministic and replayable", () => {
    const first = runPhase14CertificationGate();
    const second = runPhase14CertificationGate();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePhase14CertificationGate(first).valid).toBe(true);
    expect(replayPhase14CertificationGate(first)).toBe(true);
  });

  it("executes the complete Phase 14 certification test matrix", () => {
    const result = runPhase14CertificationGate();

    expect(result.certification_tests).toHaveLength(20);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Synthetic Validation Contract valid",
      "Environment qualification deterministic",
      "Synthetic identity reproducible",
      "Tenant isolation enforced",
      "Advisory boundary enforced",
      "Boundary violations immutable",
      "Candidate Dependency Register governed",
      "Candidate and manifest artifacts distinct",
      "Dependency promotion lineage preserved",
      "Manifest authority deterministic",
      "Phase 13 dependency gate enforced",
      "Unverified dependencies cannot satisfy certification",
      "Certification lineage immutable",
      "Failed certification preserved after remediation",
      "Successor certification references predecessor",
      "Production-effect escalation enforced",
      "Replay deterministic",
      "Integrity verified",
      "Explainability reproducible",
      "Operational monitoring complete",
    ]);
  });

  it("supports conditional pass for non-constitutional certification warnings", () => {
    const result = runPhase14CertificationGate({ scenario: "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" });
    const validation = validatePhase14CertificationGate(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_record.certification_conditions).toHaveLength(1);
    expect(validation.valid).toBe(false);
  });

  it.each([
    "SYNTHETIC_VALIDATION_CONTRACT_INVALID",
    "ENVIRONMENT_QUALIFICATION_NON_DETERMINISTIC",
    "SYNTHETIC_IDENTITY_NOT_REPRODUCIBLE",
    "TENANT_ISOLATION_NOT_ENFORCED",
    "ADVISORY_BOUNDARY_NOT_ENFORCED",
    "BOUNDARY_VIOLATIONS_MUTABLE",
    "CANDIDATE_DEPENDENCY_REGISTER_UNGOVERNED",
    "CANDIDATE_MANIFEST_ARTIFACTS_NOT_DISTINCT",
    "DEPENDENCY_PROMOTION_LINEAGE_LOST",
    "MANIFEST_AUTHORITY_NON_DETERMINISTIC",
    "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED",
    "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION",
    "CERTIFICATION_LINEAGE_MUTABLE",
    "FAILED_CERTIFICATION_NOT_PRESERVED",
    "SUCCESSOR_CERTIFICATION_MISSING_PREDECESSOR",
    "PRODUCTION_EFFECT_ESCALATION_NOT_ENFORCED",
    "REPLAY_NON_DETERMINISTIC",
    "INTEGRITY_NOT_VERIFIED",
    "EXPLAINABILITY_NOT_REPRODUCIBLE",
    "OPERATIONAL_MONITORING_INCOMPLETE",
  ] as const)("fails final certification for %s", (scenario: Phase14CertificationFailure) => {
    const result = runPhase14CertificationGate({ scenario });
    const validation = validatePhase14CertificationGate(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(result.certification_record.certification_decision).toBe("FAIL");
    expect(validation.valid).toBe(false);
  });

  it("detects nested certification record tampering", () => {
    const result = runPhase14CertificationGate();
    const tampered = {
      ...result,
      certification_record: {
        ...result.certification_record,
        certification_reasoning: "tampered",
      },
    };

    expect(validatePhase14CertificationGate(tampered).valid).toBe(false);
  });
});
