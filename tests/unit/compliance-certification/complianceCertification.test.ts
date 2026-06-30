import { describe, expect, it } from "vitest";
import {
  buildComplianceCertificationContract,
  buildComplianceCertificationDoctrine,
  buildComplianceCertificationRecord,
  buildComplianceCertificationReport,
  buildComplianceRemediationRecords,
  computeComplianceCertificationHash,
  replayComplianceCertification,
  runComplianceCertification,
  validateComplianceCertificationRecord,
} from "@/services/compliance-certification";

describe("Mission Control Phase 7D.5 Compliance Certification Gate", () => {
  it("defines the certification doctrine, gate scope, ledger, replay snapshot, and remediation model", () => {
    const doctrine = buildComplianceCertificationDoctrine();
    const contract = buildComplianceCertificationContract();
    const record = runComplianceCertification();
    expect(doctrine.contract_version).toBe("COMPLIANCE-CERTIFICATION-V1");
    expect(doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(doctrine.blocking_failure_classes).toContain("CROSS_TENANT_COMPLIANCE_LEAKAGE");
    expect(contract.certification_scope.component_id).toBe("7D.5");
    expect(record.certification_ledger_record.certification_ledger_id).toBeTruthy();
    expect(record.replay_snapshot.test_suite_version).toBe("COMPLIANCE-CERT-SUITE-V1");
  });

  it("passes when the full 7D compliance stack is deterministic, replayable, tenant-safe, and evidence-backed", () => {
    const record = runComplianceCertification();
    expect(record.certification_state).toBe("PASS");
    expect(record.certification_score).toBe(100);
    expect(record.failed_tests).toEqual([]);
    expect(record.blocking_failures).toEqual([]);
    expect(validateComplianceCertificationRecord(record).validation_state).toBe("VALID");
    expect(replayComplianceCertification(record).replay_state).toBe("REPRODUCED");
  });

  it("allows conditional pass only for non-critical visibility or calibration gaps", () => {
    const record = runComplianceCertification({
      component_overrides: {
        operator_visibility: { status: "CONDITIONAL_PASS", failure_class: "MINOR_VISIBILITY_GAP", actual_output: "operator dashboard has a minor explanatory gap" },
      },
    });
    expect(record.certification_state).toBe("CONDITIONAL_PASS");
    expect(record.conditional_findings.map((finding) => finding.failure_class)).toContain("MINOR_VISIBILITY_GAP");
    expect(record.blocking_failures).toEqual([]);
    expect(buildComplianceRemediationRecords(record)[0].severity).toBe("LOW");
  });

  it("fails closed for replay, tenant, evidence, confidence, and threshold blockers", () => {
    const record = runComplianceCertification({
      component_overrides: {
        replay_determinism: { status: "FAIL", failure_class: "REPLAY_MISMATCH" },
        tenant_isolation: { status: "FAIL", failure_class: "CROSS_TENANT_COMPLIANCE_LEAKAGE", tenant_safe: false },
        evidence_completeness: { status: "FAIL", failure_class: "INCOMPLETE_EVIDENCE_ACCEPTED" },
        confidence_reproducibility: { status: "FAIL", failure_class: "CONFIDENCE_CALCULATION_MISMATCH" },
        threshold_enforcement: { status: "FAIL", failure_class: "THRESHOLD_VIOLATION_UNDETECTED" },
      },
    });
    expect(record.certification_state).toBe("FAIL");
    expect(record.blocking_failures.map((failure) => failure.failure_class)).toEqual(expect.arrayContaining(["REPLAY_MISMATCH", "CROSS_TENANT_COMPLIANCE_LEAKAGE", "INCOMPLETE_EVIDENCE_ACCEPTED", "CONFIDENCE_CALCULATION_MISMATCH", "THRESHOLD_VIOLATION_UNDETECTED"]));
  });

  it("validates contract and schema presence and rejects malformed certification records", () => {
    const record = runComplianceCertification();
    expect(record.test_results.contract_validation.status).toBe("PASS");
    expect(record.test_results.schema_validation.status).toBe("PASS");
    expect(validateComplianceCertificationRecord(undefined).errors.some((error) => error.reason === "CERTIFICATION_RECORD_MISSING")).toBe(true);
    expect(validateComplianceCertificationRecord(buildComplianceCertificationRecord({ certification_state: "BAD" as never })).errors.some((error) => error.reason === "UNKNOWN_CERTIFICATION_STATE")).toBe(true);
  });

  it("certifies evaluation reproducibility and detects evaluation mismatches as failures", () => {
    const pass = runComplianceCertification();
    expect(pass.test_results.evaluation_reproducibility.status).toBe("PASS");
    const fail = runComplianceCertification({ component_overrides: { evaluation_reproducibility: { status: "FAIL", failure_class: "EVALUATION_MISMATCH" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.failed_tests).toContain("evaluation_reproducibility");
  });

  it("certifies policy, constitutional, authority, and operational replay categories", () => {
    const record = runComplianceCertification();
    expect(record.test_results.policy_replay.status).toBe("PASS");
    expect(record.test_results.constitutional_replay.status).toBe("PASS");
    expect(record.test_results.authority_replay.status).toBe("PASS");
    expect(record.test_results.operational_replay.status).toBe("PASS");
  });

  it("blocks certification when constitutional or operator supremacy failures are accepted", () => {
    const record = runComplianceCertification({
      component_overrides: {
        constitutional_replay: { status: "FAIL", failure_class: "CONSTITUTIONAL_VIOLATION_MISSED" },
        authority_replay: { status: "FAIL", failure_class: "UNAUTHORIZED_EXECUTION_AUTHORITY_ACCEPTED" },
      },
    });
    expect(record.certification_state).toBe("FAIL");
    expect(record.blocking_failures.map((failure) => failure.failure_class)).toEqual(expect.arrayContaining(["CONSTITUTIONAL_VIOLATION_MISSED", "UNAUTHORIZED_EXECUTION_AUTHORITY_ACCEPTED"]));
  });

  it("certifies threshold enforcement and refuses undetected threshold violations", () => {
    const pass = runComplianceCertification();
    expect(pass.test_results.threshold_enforcement.status).toBe("PASS");
    const fail = runComplianceCertification({ component_overrides: { threshold_enforcement: { status: "FAIL", failure_class: "THRESHOLD_VIOLATION_UNDETECTED" } } });
    expect(fail.blocking_failures.map((failure) => failure.failure_class)).toContain("THRESHOLD_VIOLATION_UNDETECTED");
  });

  it("certifies trend replay, recurring failure detection, and corrective action lineage", () => {
    const record = runComplianceCertification();
    expect(record.test_results.trend_reproducibility.status).toBe("PASS");
    expect(record.test_results.recurring_failure_detection.status).toBe("PASS");
    expect(record.test_results.corrective_action_lineage.status).toBe("PASS");
    expect(record.supporting_evidence.some((ref) => ref.includes("CFP-") || ref.includes("CTA-"))).toBe(true);
  });

  it("certifies compliance, evidence, and recommendation confidence reproducibility", () => {
    const record = runComplianceCertification();
    expect(record.test_results.confidence_reproducibility.status).toBe("PASS");
    expect(record.test_results.evidence_confidence.status).toBe("PASS");
    expect(record.test_results.recommendation_confidence.status).toBe("PASS");
  });

  it("proves incomplete evidence, lineage mismatch, replay mismatch, and tenant leakage cannot pass", () => {
    const record = runComplianceCertification({
      component_overrides: {
        evidence_completeness: { status: "FAIL", failure_class: "INCOMPLETE_EVIDENCE_ACCEPTED" },
        lineage_reproduction: { status: "FAIL", failure_class: "LINEAGE_MISMATCH" },
        replay_determinism: { status: "FAIL", failure_class: "REPLAY_MISMATCH" },
        tenant_isolation: { status: "FAIL", failure_class: "TENANT_ISOLATION_FAILURE", tenant_safe: false },
      },
    });
    expect(record.certification_state).toBe("FAIL");
    expect(record.blocking_failures.length).toBeGreaterThanOrEqual(4);
  });

  it("certifies immutable identifiers and historical truth preservation", () => {
    const record = runComplianceCertification();
    expect(record.test_results.identifier_immutability.status).toBe("PASS");
    expect(record.test_results.historical_truth.status).toBe("PASS");
    const fail = runComplianceCertification({ component_overrides: { identifier_immutability: { status: "FAIL", failure_class: "IDENTIFIER_MUTATION_DETECTED" }, historical_truth: { status: "FAIL", failure_class: "TRUTH_LINEAGE_MISMATCH" } } });
    expect(fail.blocking_failures.map((failure) => failure.failure_class)).toEqual(expect.arrayContaining(["IDENTIFIER_MUTATION_DETECTED", "TRUTH_LINEAGE_MISMATCH"]));
  });

  it("creates remediation records for failed and conditional certification findings", () => {
    const record = runComplianceCertification({
      component_overrides: {
        replay_determinism: { status: "FAIL", failure_class: "REPLAY_MISMATCH" },
        operator_visibility: { status: "CONDITIONAL_PASS", failure_class: "MINOR_DASHBOARD_GAP" },
      },
    });
    const remediation = buildComplianceRemediationRecords(record);
    expect(remediation.map((item) => item.failed_test)).toEqual(expect.arrayContaining(["replay_determinism", "operator_visibility"]));
    expect(remediation.find((item) => item.failed_test === "replay_determinism")?.governance_review_required).toBe(true);
  });

  it("detects hash mismatch, replay mismatch, tenant leaks, hidden state, and state inconsistencies", () => {
    const record = runComplianceCertification();
    expect(computeComplianceCertificationHash(record)).toBe(record.certification_hash);
    expect(validateComplianceCertificationRecord(buildComplianceCertificationRecord({ certification_hash: "tampered" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(replayComplianceCertification(buildComplianceCertificationRecord({ certification_hash: "tampered" })).replay_state).toBe("MISMATCH");
    expect(validateComplianceCertificationRecord({ ...record, supporting_evidence: ["evidence_tenant_beta_leak"] } as never).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateComplianceCertificationRecord({ ...record, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateComplianceCertificationRecord({ ...record, certification_state: "PASS", test_results: runComplianceCertification({ component_overrides: { replay_determinism: { status: "FAIL", failure_class: "REPLAY_MISMATCH" } } }).test_results } as never).errors.some((error) => error.reason === "FAILURE_STATE_MISMATCH")).toBe(true);
  });

  it("exposes an operator report with state, evidence, replay, lineage, tenant, confidence, truth, and remediation", () => {
    const record = runComplianceCertification({ component_overrides: { operator_visibility: { status: "CONDITIONAL_PASS", failure_class: "MINOR_VISIBILITY_GAP" } } });
    const report = buildComplianceCertificationReport(record);
    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.evidence_status).toBe("COMPLETE");
    expect(report.replay_status).toBe("REPRODUCED");
    expect(report.lineage_status).toBe("INTACT");
    expect(report.tenant_isolation_status).toBe("PRESERVED");
    expect(report.confidence_status).toBe("REPRODUCED");
    expect(report.historical_truth_status).toBe("PRESERVED");
    expect(report.required_remediation.length).toBe(1);
  });
});
