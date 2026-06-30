import { describe, expect, it, vi } from "vitest";
import {
  buildAutonomyCertificationContract,
  buildAutonomyCertificationContractObservabilitySurface,
  computeAutonomyCertificationContractHash,
  getAutonomyCertificationContract,
  validateAutonomyCertificationContract,
} from "@/services/autonomy-certification-contract";
import type { AutonomyCertificationDecision, AutonomyCertificationFailure, AutonomyCertificationScenario } from "@/types/autonomy-certification-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8K.1 Autonomy Certification Contract", () => {
  it("defines the canonical certification doctrine, lifecycle, scope, and domains", () => {
    const contract = getAutonomyCertificationContract();

    expect(contract.doctrine.contract_version).toBe("autonomy-certification-contract/v8K.1");
    expect(contract.doctrine.principles).toContain("deterministic-certification");
    expect(contract.doctrine.principles).toContain("fail-closed-operation");
    expect(contract.doctrine.certification_decisions).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.lifecycle_states).toEqual(["REGISTERED", "COLLECTING_EVIDENCE", "VALIDATING", "DETERMINISTIC_CHECK", "REPLAY_CHECK", "INTEGRITY_CHECK", "GOVERNANCE_CHECK", "AUTHORITY_CHECK", "CONSTITUTIONAL_CHECK", "VISIBILITY_CHECK", "TENANT_CHECK", "FAIL_CLOSED_CHECK", "SCORING", "CERTIFIED"]);
    expect(contract.doctrine.certification_scope).toContain("CONTROLLED_AUTONOMY");
    expect(contract.doctrine.certification_domains).toContain("TENANT_ISOLATION");
  });

  it("builds a complete PASS certification contract from certified 8J visibility evidence", () => {
    const report = buildAutonomyCertificationContract();
    const validation = validateAutonomyCertificationContract(report);

    expect(report.phase).toBe("8K");
    expect(report.subphase).toBe("8K.1");
    expect(report.contract_version).toBe("autonomy-certification-contract/v8K.1");
    expect(report.certification_state).toBe("CERTIFIED");
    expect(report.certification_decision).toBe("PASS");
    expect(report.overall_score).toBe(1);
    expect(report.certification_scope.length).toBe(11);
    expect(report.evidence.length).toBe(11);
    expect(report.domain_results.length).toBe(12);
    expect(report.certification_tests.length).toBe(23);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(report.operator_required).toBe(false);
    expect(report.approver).toBeTruthy();
    expect(report.visibility_certification.certification_state).toBe("PASS");
    expect(validation.valid).toBe(true);
  });

  it("records lifecycle, rules, metadata, and deterministic domain validations", () => {
    const report = buildAutonomyCertificationContract();

    expect(report.lifecycle.current_state).toBe("CERTIFIED");
    expect(report.lifecycle.valid_transitions).toContain("FAIL_CLOSED_CHECK->SCORING");
    expect(report.lifecycle.deterministic_transitioning).toBe(true);
    expect(report.rule_set.required_rules).toContain("schema valid");
    expect(report.rule_set.prohibited_conditions).toContain("fail-open certification");
    expect(report.rule_set.fail_closed_required).toBe(true);
    expect(report.deterministic_validation.status).toBe("PASS");
    expect(report.replay_validation.status).toBe("PASS");
    expect(report.integrity_validation.status).toBe("PASS");
    expect(report.governance_validation.status).toBe("PASS");
    expect(report.authority_validation.status).toBe("PASS");
    expect(report.constitutional_validation.status).toBe("PASS");
    expect(report.visibility_validation.status).toBe("PASS");
    expect(report.tenant_validation.status).toBe("PASS");
    expect(report.fail_closed_validation.status).toBe("PASS");
    expect(report.metadata.dependency_8j).toBe("Visibility Framework");
  });

  it("allows conditional pass only for non-critical recommendation gaps", () => {
    const report = buildAutonomyCertificationContract({ scenario: "MINOR_RECOMMENDATION_GAP" });
    const validation = validateAutonomyCertificationContract(report);

    expect(report.certification_decision).toBe("CONDITIONAL_PASS");
    expect(report.operator_required).toBe(true);
    expect(report.warnings).toContain("MINOR_RECOMMENDATION_GAP");
    expect(report.detected_failures).toContain("MINOR_RECOMMENDATION_GAP");
    expect(report.certification_tests.filter((test) => !test.passed).every((test) => !test.mandatory)).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.mandatory_tests_passed).toBe(true);
  });

  it.each([
    ["MISSING_CONTRACT", "CERTIFICATION_CONTRACT_MISSING"],
    ["INVALID_SCHEMA", "CERTIFICATION_SCHEMA_INVALID"],
    ["MISSING_IMMUTABLE_ID", "IMMUTABLE_IDENTIFIER_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_LINEAGE_REFERENCE", "LINEAGE_REFERENCE_MISSING"],
    ["MISSING_INTEGRITY_HASH", "INTEGRITY_HASH_MISSING"],
    ["MISSING_GOVERNANCE_REFERENCE", "GOVERNANCE_REFERENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL_REFERENCE", "CONSTITUTIONAL_REFERENCE_MISSING"],
    ["NONDETERMINISTIC_DECISION", "CERTIFICATION_DECISION_NONDETERMINISTIC"],
    ["REPLAY_NOT_REPRODUCIBLE", "REPLAY_VALIDATION_NOT_REPRODUCIBLE"],
    ["INTEGRITY_NOT_VERIFIED", "INTEGRITY_VALIDATION_FAILED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["VISIBILITY_NOT_CERTIFIED", "VISIBILITY_VALIDATION_FAILED"],
    ["CROSS_TENANT_EVIDENCE", "CROSS_TENANT_EVIDENCE_DETECTED"],
    ["FAIL_OPEN_CERTIFICATION", "FAIL_CLOSED_VALIDATION_FAILED"],
    ["INCOMPLETE_EVIDENCE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
    ["HIDDEN_VALIDATION", "HIDDEN_VALIDATION_DETECTED"],
  ] as readonly [AutonomyCertificationScenario, AutonomyCertificationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = buildAutonomyCertificationContract({ scenario });
      const validation = validateAutonomyCertificationContract(report);

      expect(report.certification_decision).toBe("FAIL" satisfies AutonomyCertificationDecision);
      expect(report.operator_required).toBe(true);
      expect(report.detected_failures).toContain(failure);
      expect(report.certification_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("produces complete evidence and a stable contract hash", () => {
    const report = buildAutonomyCertificationContract();

    expect(report.evidence.every((record) => record.immutable_id && record.replay_reference && record.lineage_reference)).toBe(true);
    expect(report.evidence.every((record) => record.integrity_hash && record.governance_reference && record.constitutional_reference)).toBe(true);
    expect(report.replay_reference).toBeTruthy();
    expect(report.lineage_reference).toBeTruthy();
    expect(report.integrity_hash).toBeTruthy();
    expect(report.contract_hash).toBe(computeAutonomyCertificationContractHash(report));
    expect(buildAutonomyCertificationContract().contract_hash).toBe(report.contract_hash);
  });

  it("exposes certification contract observability metrics", () => {
    const surface = buildAutonomyCertificationContractObservabilitySurface(buildAutonomyCertificationContract({ scenario: "CROSS_TENANT_EVIDENCE" }));

    expect(surface.certification_decision).toBe("FAIL");
    expect(surface.failures).toContain("CROSS_TENANT_EVIDENCE_DETECTED");
    expect(surface.operator_required).toBe(true);
    expect(surface.evidence_records).toBe(11);
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.overall_score).toBeLessThan(1);
  });
});
