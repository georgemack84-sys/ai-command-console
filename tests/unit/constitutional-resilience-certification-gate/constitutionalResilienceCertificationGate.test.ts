import { describe, expect, it } from "vitest";
import {
  buildConstitutionalResilienceCertificationObservabilitySurface,
  certifyConstitutionalResilience,
  getConstitutionalCertificationEvidence,
  getConstitutionalCertificationReport,
  getConstitutionalResilienceCertificationGate,
  listConstitutionalCertificationLedger,
  listConstitutionalCertificationTests,
  validateConstitutionalResilienceCertification,
} from "@/services/constitutional-resilience-certification-gate";
import type { ConstitutionalCertificationFailure, ConstitutionalCertificationScenario } from "@/types/constitutional-resilience-certification-gate";

describe("constitutional resilience certification gate", () => {
  it("publishes the deterministic read-only certification bundle", () => {
    const bundle = getConstitutionalResilienceCertificationGate();

    expect(bundle.doctrine.engine_version).toBe("constitutional-resilience-certification-gate/v8ALT.10.10");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_RESILIENCE_CERTIFICATION_READY");
    expect(bundle.doctrine.certification_scope.length).toBe(9);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.record.overall_result).toBe("PASS");
    expect(bundle.repository.read_only).toBe(true);
    expect(bundle.repository.authority_grant_authorized).toBe(false);
    expect(bundle.repository.governance_modification_authorized).toBe(false);
    expect(bundle.repository.mission_execution_influence_authorized).toBe(false);
    expect(bundle.repository.constitutional_state_modification_authorized).toBe(false);
  });

  it("certifies baseline with PASS and complete evidence", () => {
    const repository = certifyConstitutionalResilience();

    expect(repository.final_state).toBe("CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE");
    expect(repository.record.overall_result).toBe("PASS");
    expect(repository.tests.every((test) => test.actual_result === "PASS")).toBe(true);
    expect(repository.evidence_package.certification_state).toBe("PASS");
    expect(repository.evidence_package.cryptographic_verification).toBe("PASS");
    expect(repository.record.finding_count).toBe(0);
    expect(repository.failures).toEqual([]);
  });

  it("lists tests, evidence, report, and ledger", () => {
    expect(listConstitutionalCertificationTests().length).toBeGreaterThan(30);
    expect(getConstitutionalCertificationEvidence().immutable).toBe(true);
    expect(getConstitutionalCertificationReport().executive_summary.length).toBeGreaterThan(0);
    expect(listConstitutionalCertificationLedger().length).toBe(1);
  });

  it("keeps certification deterministic and ledger entries immutable", () => {
    const first = certifyConstitutionalResilience();
    const second = certifyConstitutionalResilience();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.record.integrity_hash).toBe(first.record.integrity_hash);
    expect(first.ledger.every((entry) => entry.immutable && entry.append_only)).toBe(true);
  });

  it("allows conditional pass only for non-risk reporting gaps", () => {
    const repository = certifyConstitutionalResilience({ scenario: "DOCUMENTATION_GAP" });
    const validation = validateConstitutionalResilienceCertification(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE");
    expect(repository.record.overall_result).toBe("CONDITIONAL_PASS");
    expect(repository.failures).toEqual([]);
    expect(repository.findings.every((finding) => finding.severity === "INFO")).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toEqual([]);
  });

  it.each([
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["REPLAY_NONDETERMINISM", "REPLAY_NONDETERMINISM_DETECTED"],
    ["REPLAY_DIVERGENCE_UNDETECTED", "UNDETECTED_REPLAY_DIVERGENCE_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["HIDDEN_LEARNING", "HIDDEN_LEARNING_DETECTED"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION_DETECTED"],
    ["POLICY_MUTATION", "POLICY_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_MUTATION", "CONSTITUTIONAL_MUTATION_DETECTED"],
    ["GOVERNANCE_MUTATION", "GOVERNANCE_MUTATION_DETECTED"],
    ["INTEGRITY_CORRUPTION", "INTEGRITY_CORRUPTION_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["FAIL_OPEN_BEHAVIOR", "FAIL_OPEN_BEHAVIOR_DETECTED"],
    ["INCOMPLETE_AUDIT_TRAIL", "AUDIT_TRAIL_INCOMPLETE"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["CONFIDENCE_INCONSISTENCY", "CONFIDENCE_INCONSISTENCY_DETECTED"],
    ["LINEAGE_INCONSISTENCY", "LINEAGE_INCONSISTENCY_DETECTED"],
    ["RECOMMENDATION_WITH_EXECUTION_AUTHORITY", "RECOMMENDATION_EXECUTION_AUTHORITY_DETECTED"],
  ] satisfies [ConstitutionalCertificationScenario, ConstitutionalCertificationFailure][])("fails certification for %s", (scenario, failure) => {
    const repository = certifyConstitutionalResilience({ scenario });
    const validation = validateConstitutionalResilienceCertification(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_RESILIENCE_CERTIFICATION_FAIL_CLOSED");
    expect(repository.record.overall_result).toBe("FAIL");
    expect(repository.failures).toContain(failure);
    expect(repository.findings.some((finding) => finding.severity === "BLOCKING" && finding.unresolved)).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(repository.authority_grant_authorized).toBe(false);
  });

  it("validates failure-specific certification gates", () => {
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "REPLAY_NONDETERMINISM" })).replay_verified).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "GOVERNANCE_BYPASS" })).governance_verified).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "AUTHORITY_ESCALATION" })).authority_verified).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "OPERATOR_OVERRIDE" })).operator_verified).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "INTEGRITY_CORRUPTION" })).integrity_verified).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "TENANT_ISOLATION_FAILURE" })).tenant_isolated).toBe(false);
    expect(validateConstitutionalResilienceCertification(certifyConstitutionalResilience({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).evidence_complete).toBe(false);
  });

  it("publishes certification observability", () => {
    const surface = buildConstitutionalResilienceCertificationObservabilitySurface(certifyConstitutionalResilience({ scenario: "POLICY_MUTATION" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_RESILIENCE_CERTIFICATION_FAIL_CLOSED");
    expect(surface.overall_result).toBe("FAIL");
    expect(surface.test_count).toBeGreaterThan(30);
    expect(surface.finding_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.ledger_count).toBe(1);
    expect(surface.read_only).toBe(true);
    expect(surface.mission_execution_influence_authorized).toBe(false);
  });
});
