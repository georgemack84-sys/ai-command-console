import { describe, expect, it } from "vitest";
import {
  buildRecommendationCertificationContract,
  buildRecommendationCertificationDoctrine,
  buildRecommendationCertificationRecord,
  buildRecommendationCertificationReport,
  computeRecommendationCertificationHash,
  replayRecommendationCertification,
  runRecommendationCertification,
  validateRecommendationCertificationRecord,
} from "@/services/recommendation-certification";

describe("Mission Control Phase 7E.5 Recommendation Certification Gate", () => {
  it("defines the certification doctrine, scope, input corpus, and baseline PASS", () => {
    const doctrine = buildRecommendationCertificationDoctrine();
    const contract = buildRecommendationCertificationContract();
    expect(doctrine.contract_version).toBe("RECOMMENDATION-CERTIFICATION-V1");
    expect(doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(doctrine.certification_scope).toEqual(["7E.1", "7E.2", "7E.3", "7E.4"]);
    expect(doctrine.blocking_failure_classes).toContain("EXECUTION_AUTHORITY_ACCEPTED");
    expect(contract.baseline_certification.certification_state).toBe("PASS");
    expect(contract.baseline_certification.input_set.critical_risk_case).toBe("CRITICAL_RISK");
  });

  it("passes when the full 7E stack is deterministic, replayable, tenant-safe, advisory-only, and ledger-linked", () => {
    const record = runRecommendationCertification();
    expect(record.certification_state).toBe("PASS");
    expect(record.failed_tests).toEqual([]);
    expect(record.blocking_findings).toEqual([]);
    expect(validateRecommendationCertificationRecord(record).validation_state).toBe("VALID");
    expect(replayRecommendationCertification(record).replay_state).toBe("REPRODUCED");
  });

  it("certifies 7E.1 contract presence, schema validity, type control, scope, and advisory boundary", () => {
    const record = runRecommendationCertification();
    expect(record.contract_certification_result.status).toBe("PASS");
    expect(record.contract_certification_result.test_count).toBeGreaterThanOrEqual(4);
    const fail = runRecommendationCertification({ component_overrides: { contract_certification_result: { status: "FAIL", failure_class: "CONTRACT_MISSING_ACCEPTED" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("CONTRACT_MISSING_ACCEPTED");
  });

  it("certifies 7E.2 generation reproducibility across recommendation categories", () => {
    const record = runRecommendationCertification();
    expect(record.generation_certification_result.status).toBe("PASS");
    expect(record.generation_certification_result.deterministic).toBe(true);
    const fail = runRecommendationCertification({ component_overrides: { generation_certification_result: { status: "FAIL", failure_class: "GENERATION_MISMATCH", deterministic: false } } });
    expect(fail.failed_tests).toContain("generation_certification_result");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("GENERATION_MISMATCH");
  });

  it("certifies 7E.3 alternative paths, ordering, comparison, and required path coverage", () => {
    const record = runRecommendationCertification();
    expect(record.alternative_path_certification_result.status).toBe("PASS");
    const fail = runRecommendationCertification({ component_overrides: { alternative_path_certification_result: { status: "FAIL", failure_class: "PATH_ORDERING_MISMATCH" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("PATH_ORDERING_MISMATCH");
  });

  it("certifies 7E.4 validation determinism and boundary decisions", () => {
    const record = runRecommendationCertification();
    expect(record.validation_certification_result.status).toBe("PASS");
    const fail = runRecommendationCertification({ component_overrides: { validation_certification_result: { status: "FAIL", failure_class: "UNSUPPORTED_RECOMMENDATION_VALIDATED" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("UNSUPPORTED_RECOMMENDATION_VALIDATED");
  });

  it("certifies replay across generation, paths, validation, and certification decision", () => {
    const record = runRecommendationCertification();
    expect(record.replay_certification_result.status).toBe("PASS");
    expect(record.replay_refs.length).toBeGreaterThan(0);
    const fail = runRecommendationCertification({ component_overrides: { replay_certification_result: { status: "FAIL", failure_class: "REPLAY_MISMATCH", replay_state: "MISMATCH" } } });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toContain("REPLAY_MISMATCH");
  });

  it("certifies evidence, risk, and confidence harnesses and fails closed on accepted gaps", () => {
    const record = runRecommendationCertification();
    expect(record.evidence_certification_result.status).toBe("PASS");
    expect(record.risk_certification_result.status).toBe("PASS");
    expect(record.confidence_certification_result.status).toBe("PASS");
    const fail = runRecommendationCertification({
      component_overrides: {
        evidence_certification_result: { status: "FAIL", failure_class: "MISSING_EVIDENCE_ACCEPTED" },
        risk_certification_result: { status: "FAIL", failure_class: "CRITICAL_RISK_ESCALATION_MISSING" },
        confidence_certification_result: { status: "FAIL", failure_class: "CONFIDENCE_INFLATION_ACCEPTED" },
      },
    });
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toEqual(expect.arrayContaining(["MISSING_EVIDENCE_ACCEPTED", "CRITICAL_RISK_ESCALATION_MISSING", "CONFIDENCE_INFLATION_ACCEPTED"]));
  });

  it("certifies governance boundary, advisory-only authority, and tenant isolation", () => {
    const record = runRecommendationCertification();
    expect(record.governance_boundary_result.status).toBe("PASS");
    expect(record.advisory_only_result.status).toBe("PASS");
    expect(record.tenant_isolation_result.status).toBe("PASS");
    const fail = runRecommendationCertification({
      component_overrides: {
        governance_boundary_result: { status: "FAIL", failure_class: "CONSTITUTIONAL_CONFLICT_ACCEPTED" },
        advisory_only_result: { status: "FAIL", failure_class: "EXECUTION_AUTHORITY_ACCEPTED", advisory_only: false },
        tenant_isolation_result: { status: "FAIL", failure_class: "TENANT_ISOLATION_FAILURE", tenant_safe: false },
      },
    });
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.blocking_findings.map((finding) => finding.failure_class)).toEqual(expect.arrayContaining(["CONSTITUTIONAL_CONFLICT_ACCEPTED", "EXECUTION_AUTHORITY_ACCEPTED", "TENANT_ISOLATION_FAILURE"]));
  });

  it("certifies Truth Ledger records and operator visibility", () => {
    const record = runRecommendationCertification();
    expect(record.truth_ledger_result.status).toBe("PASS");
    expect(record.operator_visibility_result.status).toBe("PASS");
    expect(record.truth_ledger_refs.length).toBeGreaterThan(0);
    const fail = runRecommendationCertification({
      component_overrides: {
        truth_ledger_result: { status: "FAIL", failure_class: "TRUTH_LEDGER_LINKAGE_MISSING" },
        operator_visibility_result: { status: "FAIL", failure_class: "OPERATOR_VISIBILITY_INCOMPLETE" },
      },
    });
    expect(fail.failed_tests).toEqual(expect.arrayContaining(["truth_ledger_result", "operator_visibility_result"]));
  });

  it("allows conditional pass only for minor visibility, explanation, or confidence calibration gaps", () => {
    const record = runRecommendationCertification({
      component_overrides: {
        operator_visibility_result: { status: "CONDITIONAL_PASS", failure_class: "MINOR_VISIBILITY_GAP", rationale: "minor operator wording gap" },
      },
    });
    expect(record.certification_state).toBe("CONDITIONAL_PASS");
    expect(record.conditional_findings.map((finding) => finding.failure_class)).toContain("MINOR_VISIBILITY_GAP");
    expect(record.blocking_findings).toEqual([]);
    expect(replayRecommendationCertification(record).replay_state).toBe("REPRODUCED");
  });

  it("validates certification records and rejects malformed states, hash mismatches, tenant leaks, hidden state, and state inconsistency", () => {
    const record = runRecommendationCertification();
    expect(validateRecommendationCertificationRecord(undefined).errors.some((error) => error.failure_class === "CONTRACT_MISSING_ACCEPTED")).toBe(true);
    expect(validateRecommendationCertificationRecord(buildRecommendationCertificationRecord({ certification_state: "BAD" as never })).errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH")).toBe(true);
    expect(validateRecommendationCertificationRecord(buildRecommendationCertificationRecord({ certification_hash: "tampered" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateRecommendationCertificationRecord({ ...record, truth_ledger_refs: ["truth_ledger_tenant_beta_leak"] } as never).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateRecommendationCertificationRecord({ ...record, hidden_certification_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateRecommendationCertificationRecord({ ...record, certification_state: "PASS", replay_certification_result: { ...record.replay_certification_result, status: "FAIL", failure_class: "REPLAY_MISMATCH" } } as never).errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH")).toBe(true);
  });

  it("computes stable certification hashes and detects certification decision mismatch", () => {
    const record = runRecommendationCertification();
    expect(computeRecommendationCertificationHash(record)).toBe(record.certification_hash);
    expect(replayRecommendationCertification(record).reconstructed_state).toBe("PASS");
    const mismatch = buildRecommendationCertificationRecord({ certification_hash: "tampered" });
    expect(replayRecommendationCertification(mismatch).replay_state).toBe("MISMATCH");
  });

  it("exposes an operator report with certification state, evidence, replay, tenant, advisory, ledger, visibility, and remediation", () => {
    const record = runRecommendationCertification({
      component_overrides: {
        operator_visibility_result: { status: "CONDITIONAL_PASS", failure_class: "MINOR_EXPLANATION_GAP" },
      },
    });
    const report = buildRecommendationCertificationReport(record);
    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.evidence_status).toBe("COMPLETE");
    expect(report.replay_status).toBe("REPRODUCED");
    expect(report.tenant_isolation_status).toBe("PRESERVED");
    expect(report.advisory_only_status).toBe("ENFORCED");
    expect(report.truth_ledger_status).toBe("COMPLETE");
    expect(report.operator_visibility_status).toBe("COMPLETE");
    expect(report.required_remediation.length).toBe(1);
  });
});
