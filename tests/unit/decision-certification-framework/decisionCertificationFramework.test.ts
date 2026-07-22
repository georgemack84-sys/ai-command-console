import { describe, expect, it } from "vitest";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_EVIDENCE_TYPES,
  CERTIFICATION_FAILURE_CLASSES,
  CERTIFICATION_LIFECYCLE_STATES,
  CERTIFICATION_STATES,
  computeCertificationTestRegistryEntryHash,
  getCertificationFrameworkFoundation,
  replayCertificationFramework,
  runCertificationFramework,
} from "@/services/decision-certification-framework";
import type { CertificationFrameworkFailure, CertificationFrameworkInput } from "@/types/decision-certification-framework";

describe("Mission Control Phase 9.12.1 Certification Framework & Test Contract", () => {
  it("publishes the canonical certification framework foundation", () => {
    const foundation = getCertificationFrameworkFoundation();

    expect(foundation.framework_version).toBe("decision-certification-framework/v1");
    expect(foundation.lifecycle_states).toEqual(CERTIFICATION_LIFECYCLE_STATES);
    expect(foundation.certification_states).toEqual(CERTIFICATION_STATES);
    expect(foundation.categories).toEqual(CERTIFICATION_CATEGORIES);
    expect(foundation.evidence_types).toEqual(CERTIFICATION_EVIDENCE_TYPES);
    expect(foundation.failure_classes).toEqual(CERTIFICATION_FAILURE_CLASSES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("registers every certification category with deterministic registry integrity", () => {
    const result = runCertificationFramework();

    expect(result.test_registry).toHaveLength(CERTIFICATION_CATEGORIES.length);
    expect(result.test_registry.map((entry) => entry.certification_category)).toEqual(CERTIFICATION_CATEGORIES);
    expect(result.test_registry.every((entry) => computeCertificationTestRegistryEntryHash(entry) === entry.integrity_hash)).toBe(true);
    expect(result.test_registry.every((entry) => entry.replay_requirement === "REQUIRED")).toBe(true);
  });

  it("executes tests and rules in deterministic order", () => {
    const first = runCertificationFramework();
    const second = runCertificationFramework();

    expect(second).toEqual(first);
    expect(first.execution_rules.map((rule) => rule.execution_order)).toEqual(first.execution_rules.map((_, index) => index + 1));
    expect(first.executed_tests.map((test) => test.execution_order)).toEqual(first.executed_tests.map((_, index) => index + 1));
    expect(first.executed_tests.every((test) => test.actual_outcome === "PASS")).toBe(true);
  });

  it("collects complete immutable evidence and metadata", () => {
    const result = runCertificationFramework();

    expect(result.evidence_requirements.map((item) => item.evidence_type)).toEqual(CERTIFICATION_EVIDENCE_TYPES);
    expect(result.evidence_requirements.every((item) => item.complete && item.immutable)).toBe(true);
    expect(result.metadata.replay_reference).toBeTruthy();
    expect(result.metadata.ledger_reference).toBeTruthy();
    expect(result.metadata.digital_signature).toBeTruthy();
  });

  it("applies scoring and certification state definitions", () => {
    const result = runCertificationFramework();

    expect(result.score_components.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(result.certification_contract.certification_score).toBe(100);
    expect(result.certification_contract.certification_state).toBe("PASS");
    expect(result.certification_contract.production_ready).toBe(true);
  });

  it("preserves governance, constitutional, authority, tenant, integrity, and operator controls", () => {
    const result = runCertificationFramework();

    expect(result.certification_contract.governance_validation).toBe("PASS");
    expect(result.certification_contract.constitutional_validation).toBe("PASS");
    expect(result.certification_contract.authority_validation).toBe("PASS");
    expect(result.certification_contract.tenant_validation).toBe("PASS");
    expect(result.certification_contract.integrity_validation).toBe("PASS");
    expect(result.certification_contract.operator_review).toBe("COMPLETED");
    expect(result.validation.advisory_only).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runCertificationFramework();

    expect(replayCertificationFramework(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_certification_or_orchestration).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["INCOMPLETE_CONTRACT", "CERTIFICATION_CONTRACT_INCOMPLETE"],
    ["INCOMPLETE_REGISTRY", "TEST_REGISTRY_INCOMPLETE"],
    ["NONDETERMINISTIC_ORDER", "EXECUTION_ORDER_NONDETERMINISTIC"],
    ["MANDATORY_TEST_FAILURE", "MANDATORY_TEST_FAILED"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["BAD_SCORING", "SCORING_NONDETERMINISTIC"],
    ["BAD_FAILURE_CLASSIFICATION", "FAILURE_CLASSIFICATION_INCONSISTENT"],
    ["MISSING_GOVERNANCE_VALIDATION", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_CONSTITUTIONAL_VALIDATION", "CONSTITUTIONAL_VALIDATION_MISSING"],
    ["MISSING_AUTHORITY_VALIDATION", "AUTHORITY_VALIDATION_MISSING"],
    ["MISSING_TENANT_VALIDATION", "TENANT_VALIDATION_MISSING"],
    ["MISSING_INTEGRITY_VALIDATION", "INTEGRITY_VALIDATION_MISSING"],
    ["MISSING_OPERATOR_REVIEW", "OPERATOR_REVIEW_MISSING"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MUTABLE_LINEAGE", "CERTIFICATION_LINEAGE_MUTABLE"],
    ["CROSS_TENANT", "CROSS_TENANT_CERTIFICATION_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "CERTIFICATION_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<CertificationFrameworkInput["scenario"]>, CertificationFrameworkFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runCertificationFramework({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_certification_or_orchestration).toBe(false);
  });

  it("fails closed when the role lacks certification visibility", () => {
    const result = runCertificationFramework({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runCertificationFramework();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayCertificationFramework(tampered)).toBe(false);
  });
});
