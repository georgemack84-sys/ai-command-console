import { describe, expect, it } from "vitest";
import {
  certifyOperatorFeedbackIntegration,
  getOperatorFeedbackCertificationGateFoundation,
  replayOperatorFeedbackCertificationGate,
} from "@/services/operator-feedback-certification-gate";
import type { OperatorFeedbackCertificationFailure, OperatorFeedbackCertificationScenario } from "@/types/operator-feedback-certification-gate";

describe("Mission Control Phase 10.9.10 Operator Feedback Certification Gate", () => {
  it("publishes the operator feedback certification gate contract", () => {
    const foundation = getOperatorFeedbackCertificationGateFoundation();

    expect(foundation.operator_feedback_certification_gate_version).toBe("operator-feedback-certification-gate/v1");
    expect(foundation.api_surface.certify_feedback_integration).toBe("POST /operator-feedback-certification-gate/certify");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.adaptive_implementation_authorization_supported).toBe(false);
    expect(foundation.result.outcome).toBe("PASS");
  });

  it("certifies the complete Phase 10.9 chain as PASS", () => {
    const result = certifyOperatorFeedbackIntegration();

    expect(result.outcome).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.contract_result.validation_state).toBe("ACCEPTED");
    expect(result.intake_result.intake_decision).toBe("ACCEPTED");
    expect(result.normalization_result.normalization_state).toBe("NORMALIZED");
    expect(result.override_learning_result.replayable).toBe(true);
    expect(result.rejection_learning_result.replayable).toBe(true);
    expect(result.evidence_correlation_result.correlation_state).toBe("CORRELATED");
    expect(result.ledger_result.ledger_state).toBe("CERTIFIED");
    expect(result.governance_result.validation_state).toBe("VALIDATED");
    expect(result.analytics_result.analytics_state).toBe("CERTIFIED");
  });

  it("produces deterministic certification outputs", () => {
    const first = certifyOperatorFeedbackIntegration({ scenario: "BASELINE" });
    const second = certifyOperatorFeedbackIntegration({ scenario: "BASELINE" });

    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.evidence_package.integrity_hash).toBe(second.evidence_package.integrity_hash);
  });

  it("covers every certification domain and matrix test", () => {
    const result = certifyOperatorFeedbackIntegration();

    expect(result.domain_reports.map((report) => report.domain)).toEqual([
      "CONTRACT_INTEGRITY",
      "FEEDBACK_PROCESSING",
      "LEARNING_ANALYSIS",
      "EVIDENCE_CORRELATION",
      "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT",
      "LEDGER_REPLAY_INTEGRITY",
      "ANALYTICS_EXPLAINABILITY",
    ]);
    expect(result.test_matrix).toHaveLength(38);
    expect(result.test_matrix.every((item) => item.actual === "PASS")).toBe(true);
  });

  it("builds the full certification evidence package", () => {
    const result = certifyOperatorFeedbackIntegration();
    const evidence = result.evidence_package;

    expect(evidence.executive_certification_summary).toContain("PASS");
    expect(evidence.test_matrix_results).toHaveLength(38);
    expect(evidence.determinism_report).toBeTruthy();
    expect(evidence.governance_validation_report).toBeTruthy();
    expect(evidence.constitutional_compliance_report).toBeTruthy();
    expect(evidence.authority_boundary_report).toBeTruthy();
    expect(evidence.evidence_lineage_report).toBeTruthy();
    expect(evidence.replay_verification_report).toBeTruthy();
    expect(evidence.ledger_integrity_report).toBeTruthy();
    expect(evidence.analytics_validation_report).toBeTruthy();
    expect(evidence.explainability_assessment).toBeTruthy();
    expect(evidence.audit_completeness_report).toBeTruthy();
    expect(evidence.risk_assessment).toBeTruthy();
    expect(evidence.certification_decision_record).toContain("PASS");
    expect(evidence.evidence_refs.length).toBeGreaterThan(0);
    expect(evidence.replay_refs.length).toBeGreaterThan(0);
    expect(evidence.audit_refs.length).toBeGreaterThan(0);
  });

  it("keeps certification advisory-only and non-mutating", () => {
    const result = certifyOperatorFeedbackIntegration();

    expect(result.advisory_only).toBe(true);
    expect(result.uses_feedback_as_evidence_only).toBe(true);
    expect(result.modifies_feedback).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_governance).toBe(false);
    expect(result.modifies_policy).toBe(false);
    expect(result.authorizes_adaptive_implementation).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
  });

  it.each([
    "DOCUMENTATION_GAP",
    "VISUALIZATION_REPORTING_GAP",
    "USABILITY_GAP",
  ] as const)("returns CONDITIONAL_PASS for minor non-advancing gap %s", (scenario) => {
    const result = certifyOperatorFeedbackIntegration({ scenario });

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.replayable).toBe(false);
    expect(result.evidence_package.certification_decision_record).toContain("blocked");
    expect(result.changes_production_behavior).toBe(false);
  });

  it.each([
    ["CONTRACT_INVALID", "CONTRACT_INVALID"],
    ["UNAUTHORIZED_FEEDBACK_ACCEPTED", "UNAUTHORIZED_FEEDBACK_ACCEPTED"],
    ["NORMALIZATION_NONDETERMINISTIC", "NORMALIZATION_NONDETERMINISTIC"],
    ["OVERRIDE_ANALYSIS_NONDETERMINISTIC", "OVERRIDE_ANALYSIS_NONDETERMINISTIC"],
    ["REJECTION_ANALYSIS_NONDETERMINISTIC", "REJECTION_ANALYSIS_NONDETERMINISTIC"],
    ["MISSING_LINEAGE", "MISSING_EVIDENCE_LINEAGE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_POLICY_OVERRIDE_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VALIDATION_MISSING"],
    ["AUTHORITY_EXPANSION", "AUTHORITY_BOUNDARY_VIOLATED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BROKEN"],
    ["LEDGER_MUTATION", "LEDGER_NOT_APPEND_ONLY"],
    ["HASH_MISMATCH", "LEDGER_HASH_INVALID"],
    ["REPLAY_DIVERGENCE", "REPLAY_NONDETERMINISTIC"],
    ["AUDIT_GAP", "AUDIT_LINEAGE_INCOMPLETE"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_DETECTED"],
    ["POLICY_MUTATION", "GOVERNANCE_POLICY_OVERRIDE_DETECTED"],
    ["ADAPTIVE_IMPLEMENTATION_AUTHORIZATION", "AUTHORITY_BOUNDARY_VIOLATED"],
    ["ANALYTICS_UNEXPLAINED", "EXPLAINABILITY_INCOMPLETE"],
    ["EVIDENCE_PACKAGE_INCOMPLETE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
  ] as readonly [OperatorFeedbackCertificationScenario, OperatorFeedbackCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = certifyOperatorFeedbackIntegration({ scenario });

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(failure);
    expect(result.evidence_package.certification_decision_record).toContain("blocked");
    expect(result.advisory_only).toBe(true);
    expect(result.changes_production_behavior).toBe(false);
  });

  it("replays certification output and detects tampering", () => {
    const result = certifyOperatorFeedbackIntegration();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorFeedbackCertificationGate(result)).toBe(true);
    expect(replayOperatorFeedbackCertificationGate(tampered)).toBe(false);
  });
});
