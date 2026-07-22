import { describe, expect, it } from "vitest";
import { summarizeGovernanceAuthority } from "@/services/governance-authority-summary";
import {
  OPERATOR_WORKFLOW_STATES,
  SUPPORTED_OPERATOR_ACTIONS,
  computeApprovalPathRecordHash,
  computeCertificationRequirementRecordHash,
  computeDecisionActionSummaryHash,
  computeEscalationWorkflowRecordHash,
  computeOperatorActionRecordHash,
  computeOperatorActionWorkflowHash,
  createDecisionActionSummary,
  generateApprovalPath,
  generateCertificationRequirements,
  generateEscalationWorkflow,
  generateOperatorActionApprovalPath,
  generateOperatorActions,
  getOperatorActionApprovalFoundation,
  replayOperatorActionApprovalPath,
} from "@/services/operator-action-approval-path";

describe("Mission Control Phase 9.8.8 Operator Action & Approval Path Generator", () => {
  it("publishes the operator action approval foundation", () => {
    const foundation = getOperatorActionApprovalFoundation();

    expect(foundation.workflow_version).toBe("operator-action-approval-path/v1");
    expect(foundation.workflow_states).toEqual(OPERATOR_WORKFLOW_STATES);
    expect(foundation.supported_actions).toEqual(SUPPORTED_OPERATOR_ACTIONS);
    expect(foundation.result.workflow_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic operator actions and approval workflows without executing actions", () => {
    const first = generateOperatorActionApprovalPath();
    const second = generateOperatorActionApprovalPath();

    expect(first).toEqual(second);
    expect(first.action_records.map((action) => action.action_type)).toEqual(SUPPORTED_OPERATOR_ACTIONS);
    expect(first.action_records.some((action) => action.action_available)).toBe(true);
    expect(first.workflow.operator_summary).toContain("Available actions");
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.workflow_ledger).toHaveLength(1);
    expect(first.advisory_only).toBe(true);
  });

  it("builds approval, escalation, certification, and action summary records", () => {
    const result = generateOperatorActionApprovalPath();

    expect(result.approval_path.approval_sequence.length).toBeGreaterThan(0);
    expect(result.approval_path.governance_reviews.length).toBeGreaterThan(0);
    expect(result.escalation_workflow.escalation_targets).toContain("mission operator");
    expect(result.certification_requirements.required_certifications).toContain("Governance Validation");
    expect(result.action_summary.available_action_types).toEqual(result.action_records.filter((action) => action.action_available).map((action) => action.action_type));
    expect(result.workflow.available_actions).toEqual(result.action_records);
  });

  it("fails closed when actions, approval path, escalation workflow, certification, authority, or governance data are incomplete", () => {
    const compliance = summarizeGovernanceAuthority();
    const actions = generateOperatorActions(compliance);
    const approval = generateApprovalPath(compliance);
    const escalation = generateEscalationWorkflow(compliance);
    const certification = generateCertificationRequirements(compliance);
    const summary = createDecisionActionSummary(compliance, actions, approval, escalation, certification);

    expect(generateOperatorActionApprovalPath({ action_records: actions.map((action) => ({ ...action, action_available: false, integrity_hash: computeOperatorActionRecordHash({ ...action, action_available: false }) })) }).failures).toContain("OPERATOR_ACTIONS_UNAVAILABLE");
    expect(generateOperatorActionApprovalPath({ approval_path: { ...approval, approval_sequence: [], integrity_hash: computeApprovalPathRecordHash({ ...approval, approval_sequence: [] }) } }).failures).toContain("APPROVAL_PATH_INCOMPLETE");
    expect(generateOperatorActionApprovalPath({ escalation_workflow: { ...escalation, escalation_targets: [], integrity_hash: computeEscalationWorkflowRecordHash({ ...escalation, escalation_targets: [] }) } }).failures).toContain("ESCALATION_WORKFLOW_MISSING");
    expect(generateOperatorActionApprovalPath({ certification_requirements: { ...certification, required_certifications: [], integrity_hash: computeCertificationRequirementRecordHash({ ...certification, required_certifications: [] }) } }).failures).toContain("CERTIFICATION_REQUIREMENTS_ABSENT");
    expect(generateOperatorActionApprovalPath({ action_records: actions.map((action) => ({ ...action, authority_required: "", integrity_hash: computeOperatorActionRecordHash({ ...action, authority_required: "" }) })) }).failures).toContain("AUTHORITY_VALIDATION_MISSING");
    expect(generateOperatorActionApprovalPath({ approval_path: { ...approval, governance_reviews: [], integrity_hash: computeApprovalPathRecordHash({ ...approval, governance_reviews: [] }) }, action_summary: summary }).failures).toContain("GOVERNANCE_VALIDATION_MISSING");
  });

  it("rejects replay gaps, lineage gaps, integrity tampering, tenant mismatch, advisory violations, and unauthorized approve exposure", () => {
    const valid = generateOperatorActionApprovalPath();
    const workflow = valid.workflow;
    const approve = valid.action_records.find((action) => action.action_type === "approve")!;
    const blockedCompliance = {
      ...valid.compliance_result,
      summary: {
        ...valid.compliance_result.summary,
        blockers: ["manual blocker"],
      },
    };

    expect(generateOperatorActionApprovalPath({ workflow: { ...workflow, replay_ref: "", integrity_hash: computeOperatorActionWorkflowHash({ ...workflow, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(generateOperatorActionApprovalPath({ workflow: { ...workflow, lineage_ref: "", integrity_hash: computeOperatorActionWorkflowHash({ ...workflow, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(generateOperatorActionApprovalPath({ workflow: { ...workflow, operator_summary: "tampered" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(generateOperatorActionApprovalPath({ workflow: { ...workflow, tenant_id: "tenant_beta", integrity_hash: computeOperatorActionWorkflowHash({ ...workflow, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(generateOperatorActionApprovalPath({ workflow: { ...workflow, advisory_only: false as true, integrity_hash: computeOperatorActionWorkflowHash({ ...workflow, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(generateOperatorActionApprovalPath({ compliance_result: blockedCompliance, action_records: [{ ...approve, action_available: true, integrity_hash: computeOperatorActionRecordHash({ ...approve, action_available: true }) }] }).failures).toContain("UNAUTHORIZED_ACTION_EXPOSED");
  });

  it("detects invalid compliance, unauthorized access, replay divergence, and summary tampering", () => {
    const valid = generateOperatorActionApprovalPath();
    const badCompliance = { ...valid.compliance_result, summary_status: "FAIL" as const };

    expect(generateOperatorActionApprovalPath({ compliance_result: badCompliance }).failures).toContain("COMPLIANCE_SUMMARY_INVALID");
    expect(generateOperatorActionApprovalPath({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_OPERATOR_WORKFLOW_ACCESS");
    expect(generateOperatorActionApprovalPath({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(generateOperatorActionApprovalPath({ action_summary: { ...valid.action_summary, authority_limitations: [], integrity_hash: computeDecisionActionSummaryHash({ ...valid.action_summary, authority_limitations: [] }) } }).failures).toContain("AUTHORITY_VALIDATION_MISSING");
  });

  it("replays operator action approval paths deterministically", () => {
    const result = generateOperatorActionApprovalPath();
    const replay = replayOperatorActionApprovalPath(result);
    const tampered = replayOperatorActionApprovalPath({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.workflow_id).toBe(result.workflow.workflow_id);
    expect(replay.action_types).toEqual(result.workflow.available_actions.filter((action) => action.action_available).map((action) => action.action_type));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
