import { describe, expect, it } from "vitest";
import {
  APPROVAL_STATES,
  APPROVAL_TYPES,
  computeApprovalDependencyHash,
  computeApprovalRecordHash,
  computeApprovalRequestHash,
  createApprovalDependencies,
  createApprovalRecords,
  createApprovalRequests,
  getApprovalManagementFoundation,
  replayApprovalManagement,
  runApprovalManagement,
} from "@/services/approval-management-engine";
import { createOperatorActionRequest, processOperatorAction } from "@/services/operator-action-engine";

const foundation = getApprovalManagementFoundation();
const baseAction = foundation.result.action_result;

describe("Mission Control Phase 9.9.4 Approval Management Engine", () => {
  it("publishes the approval management foundation", () => {
    expect(foundation.approval_management_version).toBe("approval-management-engine/v1");
    expect(foundation.approval_types).toEqual(APPROVAL_TYPES);
    expect(foundation.approval_states).toEqual(APPROVAL_STATES);
    expect(foundation.result.approval_management_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("discovers mandatory approvals, dependencies, completion, and immutable ledger entries deterministically", () => {
    const first = runApprovalManagement({ action_result: baseAction });
    const second = runApprovalManagement({ action_result: baseAction });

    expect(first).toEqual(second);
    expect(first.approval_requests.map((request) => request.approval_type)).toEqual(APPROVAL_TYPES);
    expect(first.approval_dependencies.map((dependency) => [dependency.parent_approval, dependency.child_approval])).toEqual([
      ["GOVERNANCE_APPROVAL", "SUPERVISORY_APPROVAL"],
      ["SUPERVISORY_APPROVAL", "OPERATOR_APPROVAL"],
      ["OPERATOR_APPROVAL", "CERTIFICATION_APPROVAL"],
    ]);
    expect(first.completion.workflow_progression_authorized).toBe(true);
    expect(first.approval_ledger).toHaveLength(4);
    expect(first.approval_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("validates approval authority and completion for every required approval type", () => {
    const result = runApprovalManagement({ action_result: baseAction });

    expect(result.approval_records.map((record) => record.authority_level)).toEqual([
      "Governance Authority",
      "Supervisor",
      "Operator",
      "Certification Authority",
    ]);
    expect(result.validation.approvers_authorized).toBe(true);
    expect(result.validation.required_approvals_present).toBe(true);
    expect(result.completion.completed_approvals).toEqual(APPROVAL_TYPES);
  });

  it("fails closed when mandatory governance or certification approvals are missing", () => {
    const action = baseAction;
    const requests = createApprovalRequests(action).filter((request) => request.approval_type !== "GOVERNANCE_APPROVAL");
    const records = createApprovalRecords(action, requests).filter((record) => record.approval_type !== "CERTIFICATION_APPROVAL");
    const result = runApprovalManagement({ action_result: action, approval_requests: requests, approval_records: records });

    expect(result.approval_management_status).toBe("FAIL");
    expect(result.failures).toEqual(expect.arrayContaining(["REQUIRED_APPROVAL_MISSING", "GOVERNANCE_APPROVAL_MISSING", "CERTIFICATION_APPROVAL_MISSING"]));
    expect(result.completion.workflow_progression_authorized).toBe(false);
  });

  it("fails closed for unauthorized approvers, incomplete dependencies, duplicates, and invalid approval types", () => {
    const action = baseAction;
    const requests = createApprovalRequests(action);
    const dependencies = createApprovalDependencies(action);
    const records = createApprovalRecords(action, requests);
    const weakRecord = { ...records[0]!, authority_level: "Reviewer", integrity_hash: computeApprovalRecordHash({ ...records[0]!, authority_level: "Reviewer" }) };
    const incompleteDependency = { ...dependencies[0]!, dependency_status: "INCOMPLETE" as const, integrity_hash: computeApprovalDependencyHash({ ...dependencies[0]!, dependency_status: "INCOMPLETE" as const }) };
    const duplicateRequests = [requests[0]!, requests[0]!, ...requests.slice(1)];
    const invalidRequest = { ...requests[0]!, approval_type: "SHADOW_APPROVAL", integrity_hash: computeApprovalRequestHash({ ...requests[0]!, approval_type: "SHADOW_APPROVAL" }) };

    expect(runApprovalManagement({ action_result: action, approval_records: [weakRecord, ...records.slice(1)] }).failures).toContain("APPROVER_UNAUTHORIZED");
    expect(runApprovalManagement({ action_result: action, approval_dependencies: [incompleteDependency, ...dependencies.slice(1)] }).failures).toContain("APPROVAL_DEPENDENCY_INCOMPLETE");
    expect(runApprovalManagement({ action_result: action, approval_requests: duplicateRequests }).failures).toContain("DUPLICATE_APPROVAL_DETECTED");
    expect(runApprovalManagement({ action_result: action, approval_requests: [invalidRequest, ...requests.slice(1)] }).failures).toContain("APPROVAL_TYPE_INVALID");
  });

  it("enforces action engine, tenant, mission, replay, lineage, advisory-only, and integrity requirements", () => {
    const action = baseAction;
    const validActionRequest = createOperatorActionRequest(action.workflow_result);
    const badActionRequest = {
      ...validActionRequest,
      requested_action: "OVERRIDE_RECOMMENDATION",
      authority_level: "Reviewer",
    };
    const action_result = processOperatorAction({
      workflow_result: action.workflow_result,
      action_request: { ...badActionRequest, integrity_hash: validActionRequest.integrity_hash },
    });
    const requests = createApprovalRequests(action);
    const badTenant = { ...requests[0]!, tenant_id: "tenant_beta", integrity_hash: computeApprovalRequestHash({ ...requests[0]!, tenant_id: "tenant_beta" }) };
    const badMission = { ...requests[0]!, mission_id: "mission_beta", integrity_hash: computeApprovalRequestHash({ ...requests[0]!, mission_id: "mission_beta" }) };
    const missingReplay = { ...requests[0]!, replay_ref: "", lineage_ref: "", integrity_hash: computeApprovalRequestHash({ ...requests[0]!, replay_ref: "", lineage_ref: "" }) };
    const notAdvisory = { ...requests[0]!, advisory_only: false as true, integrity_hash: computeApprovalRequestHash({ ...requests[0]!, advisory_only: false as true }) };

    expect(runApprovalManagement({ action_result }).failures).toEqual(expect.arrayContaining(["ACTION_ENGINE_FAILED", "WORKFLOW_STATE_INVALID"]));
    expect(runApprovalManagement({ action_result: action, approval_requests: [badTenant, ...requests.slice(1)] }).failures).toContain("TENANT_MISMATCH");
    expect(runApprovalManagement({ action_result: action, approval_requests: [badMission, ...requests.slice(1)] }).failures).toContain("MISSION_MISMATCH");
    expect(runApprovalManagement({ action_result: action, approval_requests: [missingReplay, ...requests.slice(1)] }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_UNAVAILABLE", "LINEAGE_REFERENCE_MISSING"]));
    expect(runApprovalManagement({ action_result: action, approval_requests: [notAdvisory, ...requests.slice(1)] }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(runApprovalManagement({ action_result: action, approval_requests: [{ ...requests[0]!, assigned_approver: "tampered" }, ...requests.slice(1)] }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("replays approval management deterministically and detects replay divergence", () => {
    const valid = runApprovalManagement({ action_result: baseAction });
    const replay = replayApprovalManagement(valid);
    const mismatch = runApprovalManagement({ action_result: baseAction, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayApprovalManagement({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.approval_sequence).toEqual(APPROVAL_TYPES);
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
