import { describe, expect, it, vi } from "vitest";
import {
  buildIntegrityCertificationObservabilitySurface,
  computeIntegrityCertificationReportHash,
  getIntegrityCertificationContract,
  runIntegrityCertification,
  validateIntegrityCertificationReport,
} from "@/services/integrity-certification-gate";
import type { IntegrityCertificationFailure, IntegrityCertificationScenario, IntegrityCertificationState } from "@/types/integrity-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8H.5 Integrity Certification Gate", () => {
  it("defines the integrity certification doctrine and states", () => {
    const contract = getIntegrityCertificationContract();

    expect(contract.doctrine.schema_version).toBe("integrity-certification-gate/v8H.5");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.principles).toContain("complete-autonomy-integrity-certification");
    expect(contract.doctrine.principles).toContain("fail-closed-production-gate");
  });

  it("certifies the full autonomy integrity framework for production when all tests pass", () => {
    const report = runIntegrityCertification();
    const validation = validateIntegrityCertificationReport(report);

    expect(report.phase_version).toBe("8H.5");
    expect(report.certification_state).toBe("PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_PRODUCTION");
    expect(report.downstream_mission_control_enabled).toBe(true);
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(true);
    expect(report.failed_tests).toEqual([]);
    expect(report.certification_tests.every((test) => test.passed)).toBe(true);
    expect(validation.certified).toBe(true);
    expect(validation.validation_state).toBe("VALID");
  });

  it("allows conditional pass only for non-critical reporting gaps", () => {
    const report = runIntegrityCertification({ scenario: "MINOR_REPORTING_GAP" });
    const validation = validateIntegrityCertificationReport(report);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.operator_approval_status).toBe("APPROVED_FOR_STAGING");
    expect(report.downstream_mission_control_enabled).toBe(false);
    expect(report.mandatory_tests_passed).toBe(true);
    expect(report.optional_tests_passed).toBe(false);
    expect(report.detected_findings).toContain("MINOR_REPORTING_GAP");
    expect(validation.validation_state).toBe("VALID");
    expect(validation.certified).toBe(false);
  });

  it.each([
    ["INTEGRITY_CONTRACT_MISSING", "INTEGRITY_CONTRACT_NOT_CERTIFIED"],
    ["INTEGRITY_SCHEMA_INVALID", "INTEGRITY_SCHEMA_NOT_CERTIFIED"],
    ["REPLAY_HASH_NONREPRODUCIBLE", "REPLAY_HASH_NOT_CERTIFIED"],
    ["EXECUTION_HASH_NONREPRODUCIBLE", "EXECUTION_HASH_NOT_CERTIFIED"],
    ["PLANNING_HASH_NONREPRODUCIBLE", "PLANNING_HASH_NOT_CERTIFIED"],
    ["DECISION_HASH_NONREPRODUCIBLE", "DECISION_HASH_NOT_CERTIFIED"],
    ["ORCHESTRATION_HASH_NONREPRODUCIBLE", "ORCHESTRATION_HASH_NOT_CERTIFIED"],
    ["SUPERVISION_HASH_NONREPRODUCIBLE", "SUPERVISION_HASH_NOT_CERTIFIED"],
    ["INTERVENTION_HASH_NONREPRODUCIBLE", "INTERVENTION_HASH_NOT_CERTIFIED"],
    ["HASH_CHAIN_NONDETERMINISTIC", "HASH_CHAIN_NOT_CERTIFIED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_NOT_CERTIFIED"],
    ["LINEAGE_HASH_NONREPRODUCIBLE", "LINEAGE_NOT_CERTIFIED"],
    ["IMMUTABLE_IDENTIFIERS_MODIFIED", "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED"],
    ["TAMPERING_UNDETECTED", "TAMPER_DETECTION_NOT_CERTIFIED"],
    ["CORRUPTION_UNDETECTED", "CORRUPTION_DETECTION_NOT_CERTIFIED"],
    ["UNAUTHORIZED_MODIFICATION_ACCEPTED", "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED"],
    ["DELETED_HISTORY_ACCEPTED", "DELETED_HISTORY_NOT_CERTIFIED"],
    ["ORPHANED_CHAIN_ACCEPTED", "ORPHANED_CHAIN_NOT_CERTIFIED"],
    ["REPLAY_ALTERATION_ACCEPTED", "REPLAY_ALTERATION_NOT_CERTIFIED"],
    ["ORDERING_MUTATION_ACCEPTED", "DETERMINISTIC_ORDERING_NOT_CERTIFIED"],
    ["CONSTITUTIONAL_REFERENCE_LOST", "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED"],
    ["GOVERNANCE_REFERENCE_LOST", "GOVERNANCE_INTEGRITY_NOT_CERTIFIED"],
    ["VERIFICATION_NONREPRODUCIBLE", "VERIFICATION_NOT_DETERMINISTIC"],
    ["CONFIDENCE_NONREPRODUCIBLE", "CONFIDENCE_NOT_DETERMINISTIC"],
    ["REPAIR_RECOMMENDATIONS_NONDETERMINISTIC", "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC"],
    ["TENANT_ISOLATION_BROKEN", "TENANT_ISOLATION_NOT_CERTIFIED"],
    ["CROSS_TENANT_HASH_LINKAGE_ACCEPTED", "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED"],
    ["FAIL_CLOSED_BYPASSED", "FAIL_CLOSED_NOT_CERTIFIED"],
    ["AUTONOMOUS_EXECUTION_MODIFIED_HISTORY", "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED"],
  ] as readonly [IntegrityCertificationScenario, IntegrityCertificationFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runIntegrityCertification({ scenario });

      expect(report.certification_state).toBe("FAIL" satisfies IntegrityCertificationState);
      expect(report.operator_approval_status).toBe("BLOCKED");
      expect(report.downstream_mission_control_enabled).toBe(false);
      expect(report.mandatory_tests_passed).toBe(false);
      expect(report.detected_findings).toContain(failure);
      expect(report.failed_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validateIntegrityCertificationReport(report).validation_state).toBe("INVALID");
    },
  );

  it("produces complete certification evidence and a stable report hash", () => {
    const report = runIntegrityCertification();

    expect(report.certification_evidence.verification_report_hash).toBe(report.verification_report.report_hash);
    expect(report.certification_evidence.verification_evidence_hash).toBe(report.verification_report.verification_record.certification_evidence.certification_evidence_hash);
    expect(report.certification_evidence.hash_chain_terminal_hash).toBe(report.verification_report.source_chain.terminal_hash);
    expect(report.certification_evidence.tamper_forensic_hash).toBe(report.verification_report.tamper_report.forensic_evidence.evidence_hash);
    expect(report.truth_ledger_certification_reference).toMatch(/^truth-ledger:autonomy-integrity-certification:/);
    expect(report.report_hash).toBe(computeIntegrityCertificationReportHash(report));
    expect(runIntegrityCertification().report_hash).toBe(report.report_hash);
  });

  it("records certification status by subsystem", () => {
    const record = runIntegrityCertification().certification_record;

    expect(record.integrity_contract.status).toBe("PASS");
    expect(record.hash_chain.status).toBe("PASS");
    expect(record.replay_verification.status).toBe("PASS");
    expect(record.tamper_detection.status).toBe("PASS");
    expect(record.lineage_verification.status).toBe("PASS");
    expect(record.governance_verification.status).toBe("PASS");
    expect(record.constitutional_verification.status).toBe("PASS");
    expect(record.tenant_isolation.status).toBe("PASS");
  });

  it("exposes operator certification dashboard metrics", () => {
    const surface = buildIntegrityCertificationObservabilitySurface(runIntegrityCertification({ scenario: "CROSS_TENANT_HASH_LINKAGE_ACCEPTED" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.failures).toContain("CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED");
    expect(surface.operator_approval_status).toBe("BLOCKED");
    expect(surface.downstream_mission_control_enabled).toBe(false);
    expect(surface.truth_ledger_certification_reference).toMatch(/^truth-ledger:/);
    expect(surface.failed_tests).toBeGreaterThan(0);
  });
});
