import { describe, expect, it } from "vitest";
import {
  OPERATOR_WORKFLOW_CHECKS,
  OPERATOR_WORKFLOW_SCOPES,
  computeWorkflowValidationReportHash,
  getOperatorWorkflowCertificationFoundation,
  replayOperatorWorkflowCertification,
  runOperatorWorkflowCertification,
} from "@/services/decision-operator-workflow-certification";
import type { OperatorWorkflowCertificationFailure, OperatorWorkflowCertificationInput } from "@/types/decision-operator-workflow-certification";

describe("Mission Control Phase 9.12.7 Operator Workflow Certification", () => {
  it("publishes the operator workflow certification foundation", () => {
    const foundation = getOperatorWorkflowCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-operator-workflow-certification/v1");
    expect(foundation.scopes).toEqual(OPERATOR_WORKFLOW_SCOPES);
    expect(foundation.checks).toEqual(OPERATOR_WORKFLOW_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates complete workflow state transitions", () => {
    const result = runOperatorWorkflowCertification();

    expect(computeWorkflowValidationReportHash(result.workflow_report)).toBe(result.workflow_report.integrity_hash);
    expect(result.workflow_report.validation_state).toBe("PASS");
    expect(result.workflow_report.final_workflow_state).toBe("RECORDED");
    expect(result.workflow_report.state_transitions).toEqual(["PENDING->UNDER_REVIEW", "UNDER_REVIEW->APPROVED", "APPROVED->RECORDED"]);
  });

  it("validates approval and override auditability", () => {
    const result = runOperatorWorkflowCertification();

    expect(result.approval_report.validation_state).toBe("PASS");
    expect(result.approval_report.approvals_present).toHaveLength(result.approval_report.required_approvers.length);
    expect(result.override_report.validation_state).toBe("PASS");
    expect(result.override_report.original_recommendation_ref).toBe(result.intelligence_certification.alternative_explainability_report.recommendation_ref);
    expect(result.override_report.override_justification_ref).toBeTruthy();
  });

  it("validates operator history and replay reconstruction", () => {
    const result = runOperatorWorkflowCertification();

    expect(result.history_report.validation_state).toBe("PASS");
    expect(result.history_report.immutable).toBe(true);
    expect(result.replay_report.validation_state).toBe("PASS");
    expect(result.replay_report.workflow_reconstruction_complete).toBe(true);
    expect(result.replay_report.final_state_reproduced).toBe(true);
  });

  it("collects immutable evidence and writes workflow ledger entries", () => {
    const result = runOperatorWorkflowCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.workflow_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.workflow_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the workflow certification report for production readiness", () => {
    const result = runOperatorWorkflowCertification();

    expect(result.workflow_certification_report.certification_decision).toBe("PASS");
    expect(result.workflow_certification_report.production_readiness).toBe("READY");
    expect(result.validation.required_approvals_present).toBe(true);
    expect(result.validation.original_recommendation_preserved).toBe(true);
    expect(result.validation.advisory_only).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runOperatorWorkflowCertification();

    expect(replayOperatorWorkflowCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_workflow_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["INTELLIGENCE_INVALID", "DECISION_INTELLIGENCE_CERTIFICATION_INVALID"],
    ["MISSING_APPROVAL", "MISSING_REQUIRED_APPROVAL"],
    ["UNAUTHORIZED_APPROVAL", "UNAUTHORIZED_APPROVAL"],
    ["UNAUTHORIZED_REJECTION", "UNAUTHORIZED_REJECTION"],
    ["UNAUTHORIZED_OVERRIDE", "UNAUTHORIZED_OVERRIDE"],
    ["MISSING_OVERRIDE_JUSTIFICATION", "MISSING_OVERRIDE_JUSTIFICATION"],
    ["ORIGINAL_RECOMMENDATION_LOST", "ORIGINAL_RECOMMENDATION_MODIFIED_OR_LOST"],
    ["UNAUTHORIZED_DEFERRAL", "UNAUTHORIZED_DEFERRAL"],
    ["UNAUTHORIZED_ESCALATION", "UNAUTHORIZED_ESCALATION"],
    ["INCORRECT_ESCALATION_ROUTING", "INCORRECT_ESCALATION_ROUTING"],
    ["MISSING_OPERATOR_HISTORY", "MISSING_OPERATOR_HISTORY"],
    ["INCOMPLETE_RECONSTRUCTION", "INCOMPLETE_WORKFLOW_RECONSTRUCTION"],
    ["REPLAY_MISMATCH", "WORKFLOW_REPLAY_MISMATCH"],
    ["INVALID_STATE_TRANSITION", "INVALID_STATE_TRANSITION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["AUTHORITY_BOUNDARY_VIOLATION", "AUTHORITY_BOUNDARY_VIOLATION"],
    ["CROSS_TENANT", "CROSS_TENANT_WORKFLOW_CONTAMINATION"],
    ["HIDDEN_OPERATOR_ACTION", "HIDDEN_OPERATOR_ACTION"],
    ["MUTABLE_AUDIT_HISTORY", "MUTABLE_AUDIT_HISTORY"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_WORKFLOW_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<OperatorWorkflowCertificationInput["scenario"]>, OperatorWorkflowCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOperatorWorkflowCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.workflow_certification_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_workflow_state).toBe(false);
  });

  it("fails closed when the role lacks workflow visibility", () => {
    const result = runOperatorWorkflowCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects workflow certification tampering", () => {
    const result = runOperatorWorkflowCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorWorkflowCertification(tampered)).toBe(false);
  });
});
