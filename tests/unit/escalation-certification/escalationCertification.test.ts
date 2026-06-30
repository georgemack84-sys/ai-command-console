import { describe, expect, it } from "vitest";
import {
  buildEscalationCertificationContract,
  buildEscalationCertificationDoctrine,
  buildEscalationCertificationRecord,
  buildEscalationCertificationReport,
  computeEscalationCertificationHash,
  replayEscalationCertification,
  runEscalationCertification,
  validateEscalationCertificationRecord,
} from "@/services/escalation-certification";

describe("Mission Control Phase 7F.5 Escalation Certification Gate", () => {
  it("defines certification doctrine, scope, input corpus, and baseline PASS", () => {
    const doctrine = buildEscalationCertificationDoctrine();
    const contract = buildEscalationCertificationContract();
    expect(doctrine.contract_version).toBe("ESCALATION-CERTIFICATION-V1");
    expect(doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(doctrine.certification_scope).toEqual(["7F.1", "7F.2", "7F.3", "7F.4"]);
    expect(doctrine.blocking_failure_classes).toContain("EXECUTION_AUTHORITY_ACCEPTED");
    expect(contract.baseline_certification.certification_state).toBe("PASS");
    expect(contract.baseline_certification.input_set.constitutional_case).toBe("CONSTITUTIONAL_RISK");
  });

  it("passes when the full 7F pipeline is deterministic, replayable, tenant-safe, ledger-linked, and advisory-only", () => {
    const record = runEscalationCertification();
    expect(record.certification_state).toBe("PASS");
    expect(record.failed_tests).toEqual([]);
    expect(record.blocking_findings).toEqual([]);
    expect(validateEscalationCertificationRecord(record).validation_state).toBe("VALID");
    expect(replayEscalationCertification(record).replay_state).toBe("REPRODUCED");
  });

  it("certifies 7F.1 contract integrity and fails closed when the contract is missing or invalid", () => {
    const record = runEscalationCertification();
    expect(record.contract_certification_result.status).toBe("PASS");
    expect(record.contract_certification_result.test_count).toBeGreaterThanOrEqual(6);
    const fail = runEscalationCertification({ component_overrides: { contract_certification_result: { status: "FAIL", failure_class: "CONTRACT_MISSING_ACCEPTED" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("CONTRACT_MISSING_ACCEPTED");
  });

  it("certifies 7F.2 detection determinism, supported triggers, category replay, and fail-closed trigger handling", () => {
    const record = runEscalationCertification();
    expect(record.detection_certification_result.status).toBe("PASS");
    expect(record.detection_certification_result.deterministic).toBe(true);
    const fail = runEscalationCertification({ component_overrides: { detection_certification_result: { status: "FAIL", failure_class: "UNSUPPORTED_TRIGGER_ACCEPTED", deterministic: false } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.failed_tests).toContain("detection_certification_result");
  });

  it("certifies 7F.3 prioritization thresholds, confidence, lineage, replay, and severity gates", () => {
    const record = runEscalationCertification();
    expect(record.prioritization_certification_result.status).toBe("PASS");
    const fail = runEscalationCertification({ component_overrides: { prioritization_certification_result: { status: "FAIL", failure_class: "SEVERITY_THRESHOLD_MISMATCH" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("SEVERITY_THRESHOLD_MISMATCH");
  });

  it("certifies 7F.4 recommendation reproducibility, decision matrix behavior, confidence, and advisory boundaries", () => {
    const record = runEscalationCertification();
    expect(record.recommendation_certification_result.status).toBe("PASS");
    const fail = runEscalationCertification({ component_overrides: { recommendation_certification_result: { status: "FAIL", failure_class: "RECOMMENDATION_MISMATCH" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("RECOMMENDATION_MISMATCH");
  });

  it("certifies replay, evidence, lineage, confidence, Truth Ledger, and explainability categories", () => {
    const record = runEscalationCertification();
    expect(record.replay_certification_result.status).toBe("PASS");
    expect(record.evidence_certification_result.status).toBe("PASS");
    expect(record.lineage_certification_result.status).toBe("PASS");
    expect(record.confidence_certification_result.status).toBe("PASS");
    expect(record.truth_ledger_result.status).toBe("PASS");
    expect(record.explainability_result.status).toBe("PASS");
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.truth_ledger_refs.length).toBeGreaterThan(0);
  });

  it("fails closed on replay, evidence, lineage, confidence, ledger, or explainability certification failures", () => {
    const fail = runEscalationCertification({
      component_overrides: {
        replay_certification_result: { status: "FAIL", failure_class: "REPLAY_MISMATCH", replay_state: "MISMATCH" },
        evidence_certification_result: { status: "FAIL", failure_class: "INCOMPLETE_EVIDENCE_ACCEPTED" },
        lineage_certification_result: { status: "FAIL", failure_class: "LINEAGE_RECONSTRUCTION_MISMATCH" },
        confidence_certification_result: { status: "FAIL", failure_class: "CONFIDENCE_MISMATCH" },
        truth_ledger_result: { status: "FAIL", failure_class: "TRUTH_LEDGER_RECORD_MISSING" },
        explainability_result: { status: "FAIL", failure_class: "EXPLAINABILITY_INCOMPLETE" },
      },
    });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toEqual(expect.arrayContaining(["REPLAY_MISMATCH", "INCOMPLETE_EVIDENCE_ACCEPTED", "LINEAGE_RECONSTRUCTION_MISMATCH", "CONFIDENCE_MISMATCH", "TRUTH_LEDGER_RECORD_MISSING", "EXPLAINABILITY_INCOMPLETE"]));
  });

  it("certifies governance boundaries, advisory-only behavior, tenant isolation, and metadata completeness", () => {
    const record = runEscalationCertification();
    expect(record.governance_boundary_result.status).toBe("PASS");
    expect(record.advisory_only_result.status).toBe("PASS");
    expect(record.tenant_isolation_result.status).toBe("PASS");
    expect(record.certification_metadata_result.status).toBe("PASS");
    const fail = runEscalationCertification({
      component_overrides: {
        governance_boundary_result: { status: "FAIL", failure_class: "AUTHORITY_EXPANSION_ACCEPTED" },
        advisory_only_result: { status: "FAIL", failure_class: "EXECUTION_AUTHORITY_ACCEPTED", advisory_only: false },
        tenant_isolation_result: { status: "FAIL", failure_class: "TENANT_ISOLATION_FAILURE", tenant_safe: false },
        certification_metadata_result: { status: "FAIL", failure_class: "CERTIFICATION_METADATA_INCOMPLETE" },
      },
    });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toEqual(expect.arrayContaining(["AUTHORITY_EXPANSION_ACCEPTED", "EXECUTION_AUTHORITY_ACCEPTED", "TENANT_ISOLATION_FAILURE", "CERTIFICATION_METADATA_INCOMPLETE"]));
  });

  it("allows conditional pass only for minor explainability, visibility, or reporting gaps", () => {
    const record = runEscalationCertification({
      component_overrides: {
        explainability_result: { status: "CONDITIONAL_PASS", failure_class: "MINOR_EXPLAINABILITY_GAP", rationale: "minor wording gap" },
      },
    });
    expect(record.certification_state).toBe("CONDITIONAL_PASS");
    expect(record.conditional_findings.map((finding) => finding.failure_class)).toContain("MINOR_EXPLAINABILITY_GAP");
    expect(record.blocking_findings).toEqual([]);
    expect(replayEscalationCertification(record).replay_state).toBe("REPRODUCED");
  });

  it("validates certification records and rejects malformed states, hash mismatches, tenant leaks, hidden state, and decision inconsistency", () => {
    const record = runEscalationCertification();
    expect(validateEscalationCertificationRecord(undefined).errors.some((error) => error.failure_class === "CONTRACT_MISSING_ACCEPTED")).toBe(true);
    expect(validateEscalationCertificationRecord(buildEscalationCertificationRecord({ certification_state: "BAD" as never })).errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH")).toBe(true);
    expect(validateEscalationCertificationRecord(buildEscalationCertificationRecord({ certification_hash: "tampered" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateEscalationCertificationRecord({ ...record, truth_ledger_refs: ["truth_ledger_tenant_beta_leak"] } as never).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateEscalationCertificationRecord({ ...record, hidden_certification_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateEscalationCertificationRecord({ ...record, certification_state: "PASS", replay_certification_result: { ...record.replay_certification_result, status: "FAIL", failure_class: "REPLAY_MISMATCH" } } as never).errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH")).toBe(true);
  });

  it("computes stable certification hashes and detects replay mismatch", () => {
    const record = runEscalationCertification();
    expect(computeEscalationCertificationHash(record)).toBe(record.certification_hash);
    expect(replayEscalationCertification(record).reconstructed_state).toBe("PASS");
    const mismatch = buildEscalationCertificationRecord({ certification_hash: "tampered" });
    expect(replayEscalationCertification(mismatch).replay_state).toBe("MISMATCH");
  });

  it("exposes an operator report with certification state, evidence, replay, tenant, advisory, ledger, metadata, and remediation", () => {
    const record = runEscalationCertification({
      component_overrides: {
        explainability_result: { status: "CONDITIONAL_PASS", failure_class: "MINOR_REPORTING_GAP" },
      },
    });
    const report = buildEscalationCertificationReport(record);
    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.evidence_status).toBe("COMPLETE");
    expect(report.replay_status).toBe("REPRODUCED");
    expect(report.tenant_isolation_status).toBe("PRESERVED");
    expect(report.advisory_only_status).toBe("ENFORCED");
    expect(report.truth_ledger_status).toBe("COMPLETE");
    expect(report.metadata_status).toBe("COMPLETE");
    expect(report.required_remediation.length).toBe(1);
  });
});
