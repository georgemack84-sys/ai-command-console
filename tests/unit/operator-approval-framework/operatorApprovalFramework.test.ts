import { describe, expect, it } from "vitest";
import {
  OPERATOR_APPROVAL_CHECKS,
  OPERATOR_APPROVAL_DECISION_TYPES,
  OPERATOR_APPROVAL_LEVELS,
  OPERATOR_APPROVAL_STATUSES,
  computeOperatorApprovalHash,
  getOperatorApprovalFrameworkFoundation,
  replayOperatorApprovalFramework,
  runOperatorApprovalFramework,
} from "@/services/operator-approval-framework";
import type { OperatorApprovalFailure, OperatorApprovalFrameworkInput } from "@/types/operator-approval-framework";

describe("Mission Control Phase 10.0.7 Operator Approval Framework", () => {
  it("publishes the operator approval foundation", () => {
    const foundation = getOperatorApprovalFrameworkFoundation();

    expect(foundation.approval_framework_version).toBe("operator-approval-framework/v1");
    expect(foundation.checks).toEqual(OPERATOR_APPROVAL_CHECKS);
    expect(foundation.approval_levels).toEqual(OPERATOR_APPROVAL_LEVELS);
    expect(foundation.approval_statuses).toEqual(OPERATOR_APPROVAL_STATUSES);
    expect(foundation.decision_types).toEqual(OPERATOR_APPROVAL_DECISION_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("requires human approval for every adaptive recommendation", () => {
    const result = runOperatorApprovalFramework();

    expect(result.human_approval_required).toBe(true);
    expect(result.approval_contract.approval_required).toBe(true);
    expect(result.approval_contract.advisory_only_until_approved).toBe(true);
    expect(result.approval_policy.approval_required).toBe(true);
  });

  it("creates an integrity-protected operator approval record", () => {
    const result = runOperatorApprovalFramework();

    expect(computeOperatorApprovalHash(result.approval_record)).toBe(result.approval_record.integrity_hash);
    expect(result.approval_record.approval_id).toBe("operator_approval_001");
    expect(result.approval_record.approval_level).toBe("LEVEL_2_MISSION");
    expect(result.approval_record.approval_status).toBe("APPROVED");
  });

  it("enforces governance before operator review", () => {
    const result = runOperatorApprovalFramework();

    expect(result.approval_workflow.governance_completed_before_review).toBe(true);
    expect(result.approval_workflow.transition_history).toEqual(["PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "APPROVED"]);
    expect(result.validation.governance_complete).toBe(true);
  });

  it("validates operator authority and separation of duties", () => {
    const result = runOperatorApprovalFramework();

    expect(result.authority_validation.operator_authorized).toBe(true);
    expect(result.authority_validation.operator_identity_verified).toBe(true);
    expect(result.authority_validation.separation_of_duties_verified).toBe(true);
    expect(result.validation.operator_authorized).toBe(true);
  });

  it("records deterministic approval decisions and replay", () => {
    const result = runOperatorApprovalFramework();

    expect(result.approval_decision.decision_type).toBe("APPROVE");
    expect(result.approval_decision.decision_outcome).toBe("PASS");
    expect(result.approval_replay.replay_result).toBe("PASS");
    expect(replayOperatorApprovalFramework(result)).toBe(true);
  });

  it("maintains an immutable approval ledger and dashboard", () => {
    const result = runOperatorApprovalFramework();

    expect(result.approval_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.approval_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
    expect(result.dashboard.approval_metrics.unauthorized_approvals).toBe(0);
    expect(result.dashboard.approval_metrics.automatic_adoptions).toBe(0);
  });

  it("keeps adaptive intelligence advisory-only and non-executing", () => {
    const result = runOperatorApprovalFramework();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.recommendation_available_for_implementation).toBe(true);
    expect(result.permits_automatic_adoption).toBe(false);
    expect(result.permits_execution).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("supports rejection without granting implementation availability", () => {
    const result = runOperatorApprovalFramework({ decision_type: "REJECT" });

    expect(result.approval_record.approval_status).toBe("REJECTED");
    expect(result.approval_decision.decision_type).toBe("REJECT");
    expect(result.recommendation_available_for_implementation).toBe(false);
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("supports revision request workflow outcomes", () => {
    const result = runOperatorApprovalFramework({ decision_type: "REQUEST_REVISION" });

    expect(result.approval_record.approval_status).toBe("REVISION_REQUESTED");
    expect(result.dashboard.revision_requests.length).toBe(1);
    expect(result.recommendation_available_for_implementation).toBe(false);
  });

  it("supports escalation workflow outcomes", () => {
    const result = runOperatorApprovalFramework({ decision_type: "ESCALATE", approval_level: "LEVEL_4_EXECUTIVE" });

    expect(result.approval_record.approval_status).toBe("ESCALATED");
    expect(result.approval_policy.escalation_required).toBe(true);
    expect(result.recommendation_available_for_implementation).toBe(false);
  });

  it("supports deferral workflow outcomes", () => {
    const result = runOperatorApprovalFramework({ decision_type: "DEFER" });

    expect(result.approval_record.approval_status).toBe("DEFERRED");
    expect(result.approval_decision.decision_type).toBe("DEFER");
    expect(result.recommendation_available_for_implementation).toBe(false);
  });

  it.each([
    ["GOVERNANCE_INCOMPLETE", "GOVERNANCE_VALIDATION_INCOMPLETE"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_INVALID", "AUTHORITY_VALIDATION_FAILED"],
    ["REPLAY_INCOMPLETE", "REPLAY_VALIDATION_INCOMPLETE"],
    ["MISSING_APPROVAL_ID", "APPROVAL_IDENTIFIER_MISSING"],
    ["POLICY_VIOLATION", "APPROVAL_POLICY_VIOLATED"],
    ["APPROVAL_NOT_REQUIRED", "APPROVAL_REQUIREMENT_MISSING"],
    ["INVALID_APPROVAL_LEVEL", "APPROVAL_LEVEL_INVALID"],
    ["UNAUTHORIZED_OPERATOR", "OPERATOR_NOT_AUTHORIZED"],
    ["OPERATOR_IMPERSONATION", "OPERATOR_IMPERSONATION"],
    ["SEPARATION_OF_DUTIES", "SEPARATION_OF_DUTIES_VIOLATED"],
    ["TENANT_MISMATCH", "TENANT_SCOPE_MISMATCH"],
    ["AUTHORITY_SCOPE_EXCEEDED", "AUTHORITY_SCOPE_EXCEEDED"],
    ["WORKFLOW_BYPASS", "WORKFLOW_BYPASS"],
    ["AUTOMATIC_ADOPTION", "AUTOMATIC_ADOPTION_ATTEMPTED"],
    ["SELF_APPROVAL", "SELF_APPROVAL_ATTEMPTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_AUDIT_REFS", "AUDIT_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION_REFS", "CERTIFICATION_REFERENCES_MISSING"],
    ["APPROVAL_REPLAY_OMITTED", "APPROVAL_REPLAY_OMITTED"],
    ["AUDIT_DELETION", "AUDIT_TRAIL_DELETION"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS"],
    ["HIDDEN_APPROVAL", "HIDDEN_APPROVAL"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_APPROVAL_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<OperatorApprovalFrameworkInput["scenario"]>, OperatorApprovalFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOperatorApprovalFramework({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.recommendation_available_for_implementation).toBe(false);
    expect(result.permits_automatic_adoption).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks approval visibility", () => {
    const result = runOperatorApprovalFramework({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects approval framework tampering", () => {
    const result = runOperatorApprovalFramework();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorApprovalFramework(tampered)).toBe(false);
  });
});
