import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceIntegrityCertificationObservabilitySurface,
  computeGovernanceIntegrityCertificationReportHash,
  getGovernanceIntegrityCertificationContract,
  runGovernanceIntegrityCertification,
  validateGovernanceIntegrityCertificationReport,
} from "@/services/governance-integrity-certification";
import type { GovernanceIntegrityCertificationFailure, GovernanceIntegrityCertificationScenario, GovernanceIntegrityCertificationState } from "@/types/governance-integrity-certification";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7I.5 Governance Integrity Certification Gate", () => {
  it("defines the integrity certification doctrine and states", () => {
    const contract = getGovernanceIntegrityCertificationContract();

    expect(contract.doctrine.schema_version).toBe("governance-integrity-certification/v7I.5");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("deterministic-integrity-certification");
    expect(contract.doctrine.principles).toContain("fail-closed-production-gate");
  });

  it("certifies the full governance integrity framework for production when all tests pass", () => {
    const report = runGovernanceIntegrityCertification();
    const validation = validateGovernanceIntegrityCertificationReport(report);

    expect(report.phase_version).toBe("7I.5");
    expect(report.certification_state).toBe("PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_PRODUCTION");
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(true);
    expect(report.failed_tests).toEqual([]);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(validation.certified).toBe(true);
    expect(validation.validation_state).toBe("VALID");
  });

  it("allows conditional pass only for non-critical reporting gaps", () => {
    const report = runGovernanceIntegrityCertification({ scenario: "MINOR_REPORTING_GAP" });
    const validation = validateGovernanceIntegrityCertificationReport(report);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_STAGING");
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(false);
    expect(report.detected_findings).toContain("MINOR_REPORTING_GAP");
    expect(validation.validation_state).toBe("VALID");
    expect(validation.certified).toBe(false);
  });

  it.each([
    ["INTEGRITY_CONTRACT_INVALID", "INTEGRITY_CONTRACT_INVALID"],
    ["SERIALIZATION_MISMATCH_ACCEPTED", "CANONICAL_SERIALIZATION_NOT_CERTIFIED"],
    ["CONTENT_HASH_MISMATCH_UNDETECTED", "HASH_MISMATCH_NOT_CERTIFIED"],
    ["PREVIOUS_HASH_MISMATCH_ACCEPTED", "PREVIOUS_HASH_NOT_CERTIFIED"],
    ["ROOT_HASH_CORRUPTION_ACCEPTED", "ROOT_HASH_NOT_CERTIFIED"],
    ["CHAIN_DELETION_ACCEPTED", "CHAIN_INTEGRITY_NOT_CERTIFIED"],
    ["CHAIN_REORDERING_ACCEPTED", "CHAIN_INTEGRITY_NOT_CERTIFIED"],
    ["LINEAGE_CORRUPTION_UNDETECTED", "LINEAGE_NOT_CERTIFIED"],
    ["REPLAY_MISMATCH_ACCEPTED", "REPLAY_NOT_CERTIFIED"],
    ["TAMPERING_UNDETECTED", "TAMPER_DETECTION_NOT_CERTIFIED"],
    ["IMMUTABLE_IDENTITY_MODIFICATION_ACCEPTED", "IDENTITY_PROTECTION_NOT_CERTIFIED"],
    ["EVIDENCE_TAMPERING_UNDETECTED", "EVIDENCE_INTEGRITY_NOT_CERTIFIED"],
    ["CROSS_TENANT_LINKAGE_ACCEPTED", "TENANT_ISOLATION_NOT_CERTIFIED"],
    ["INCONSISTENT_VERIFICATION_ACCEPTED", "VERIFICATION_NOT_DETERMINISTIC"],
    ["UNKNOWN_STATE_ACCEPTED", "STATE_CLASSIFICATION_NOT_CERTIFIED"],
    ["MISSING_LEDGER_RECORD_ACCEPTED", "TRUTH_LEDGER_NOT_CERTIFIED"],
    ["OPERATOR_VISIBILITY_INCOMPLETE", "OPERATOR_VISIBILITY_INCOMPLETE"],
  ] as readonly [GovernanceIntegrityCertificationScenario, GovernanceIntegrityCertificationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runGovernanceIntegrityCertification({ scenario });

      expect(report.certification_state).toBe("FAIL" satisfies GovernanceIntegrityCertificationState);
      expect(report.operator_approval_status).toBe("BLOCKED");
      expect(report.mandatory_tests_passed).toBe(false);
      expect(report.detected_findings).toContain(failure);
      expect(report.failed_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validateGovernanceIntegrityCertificationReport(report).validation_state).toBe("INVALID");
    },
  );

  it("produces complete certification evidence and a stable report hash", () => {
    const report = runGovernanceIntegrityCertification();

    expect(report.certification_evidence.verification_report_hash).toBe(report.verification_report.report_hash);
    expect(report.certification_evidence.source_chain_hash).toBe(report.verification_report.source_chain.chain_execution_hash);
    expect(report.certification_evidence.truth_ledger_record_id).toBe(report.verification_report.truth_ledger_record.verification_record_id);
    expect(report.truth_ledger_certification_reference).toMatch(/^truth-ledger:governance-integrity-certification:/);
    expect(report.report_hash).toBe(computeGovernanceIntegrityCertificationReportHash(report));
    expect(runGovernanceIntegrityCertification().report_hash).toBe(report.report_hash);
  });

  it("exposes operator certification dashboard metrics", () => {
    const surface = buildGovernanceIntegrityCertificationObservabilitySurface(runGovernanceIntegrityCertification({ scenario: "CROSS_TENANT_LINKAGE_ACCEPTED" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.failures).toContain("TENANT_ISOLATION_NOT_CERTIFIED");
    expect(surface.operator_approval_status).toBe("BLOCKED");
    expect(surface.truth_ledger_certification_reference).toMatch(/^truth-ledger:/);
    expect(surface.failed_tests).toBeGreaterThan(0);
  });
});
