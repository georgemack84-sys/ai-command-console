import { describe, expect, it } from "vitest";
import {
  SUPPORTED_OPERATOR_ENGINE_ACTIONS,
  computeOperatorActionRequestHash,
  createOperatorActionRequest,
  getOperatorActionEngineFoundation,
  processOperatorAction,
  replayOperatorAction,
} from "@/services/operator-action-engine";
import { runWorkflowStateMachine } from "@/services/workflow-state-machine";

describe("Mission Control Phase 9.9.3 Operator Action Engine", () => {
  it("publishes the operator action engine foundation", () => {
    const foundation = getOperatorActionEngineFoundation();

    expect(foundation.action_engine_version).toBe("operator-action-engine/v1");
    expect(foundation.supported_actions).toEqual(SUPPORTED_OPERATOR_ENGINE_ACTIONS);
    expect(foundation.result.action_engine_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("processes default operator approval deterministically with immutable records", () => {
    const first = processOperatorAction();
    const second = processOperatorAction();

    expect(first).toEqual(second);
    expect(first.action_result.action_status).toBe("EXECUTED");
    expect(first.action_result.previous_state).toBe("PRESENTED");
    expect(first.action_result.resulting_state).toBe("APPROVED");
    expect(first.action_record.execution_status).toBe("EXECUTED");
    expect(first.action_ledger).toHaveLength(1);
    expect(first.action_ledger[0]?.append_only).toBe(true);
    expect(first.advisory_only).toBe(true);
  });

  it("maps supported actions to deterministic resulting workflow states", () => {
    const workflow = runWorkflowStateMachine();
    const base = createOperatorActionRequest(workflow);
    const cases = [
      ["APPROVE", "APPROVED", "Operator"],
      ["REJECT", "REJECTED", "Operator"],
      ["DEFER", "DEFERRED", "Reviewer"],
      ["REQUEST_MORE_EVIDENCE", "DEFERRED", "Reviewer"],
      ["REQUEST_SIMULATION", "DEFERRED", "Reviewer"],
      ["REQUEST_GOVERNANCE_REVIEW", "ESCALATED", "Governance Authority"],
      ["REQUEST_RECOVERY_PLAN", "DEFERRED", "Reviewer"],
      ["OVERRIDE_RECOMMENDATION", "SUPERSEDED", "Executive Authority"],
      ["ESCALATE", "ESCALATED", "Supervisor"],
      ["ARCHIVE", "ARCHIVED", "Supervisor"],
    ] as const;

    for (const [requested_action, resulting_state, authority_level] of cases) {
      const request = {
        ...base,
        action_request_id: `operator_action_request_${requested_action}`,
        requested_action,
        authority_level,
      };
      const actionRequest = { ...request, integrity_hash: computeOperatorActionRequestHash(request) };
      const result = processOperatorAction({ workflow_result: workflow, action_request: actionRequest });

      expect(result.action_engine_status).toBe("PASS");
      expect(result.action_result.resulting_state).toBe(resulting_state);
    }
  });

  it("fails closed for unknown actions, authentication failures, insufficient authority, and missing justification", () => {
    const base = createOperatorActionRequest();
    const unknown = { ...base, requested_action: "LAUNCH_AUTONOMOUS_ACTION", integrity_hash: computeOperatorActionRequestHash({ ...base, requested_action: "LAUNCH_AUTONOMOUS_ACTION" }) };
    const unauthenticated = { ...base, operator_authenticated: false, integrity_hash: computeOperatorActionRequestHash({ ...base, operator_authenticated: false }) };
    const weakAuthority = { ...base, requested_action: "OVERRIDE_RECOMMENDATION", authority_level: "Reviewer", integrity_hash: computeOperatorActionRequestHash({ ...base, requested_action: "OVERRIDE_RECOMMENDATION", authority_level: "Reviewer" }) };
    const noJustification = { ...base, justification: "", integrity_hash: computeOperatorActionRequestHash({ ...base, justification: "" }) };

    expect(processOperatorAction({ action_request: unknown }).failures).toContain("UNKNOWN_ACTION");
    expect(processOperatorAction({ action_request: unauthenticated }).failures).toContain("OPERATOR_AUTHENTICATION_FAILED");
    expect(processOperatorAction({ action_request: weakAuthority }).failures).toContain("AUTHORITY_INSUFFICIENT");
    expect(processOperatorAction({ action_request: noJustification }).failures).toContain("JUSTIFICATION_MISSING");
  });

  it("enforces workflow state, tenant, mission, governance, constitutional, replay, lineage, and advisory validations", () => {
    const base = createOperatorActionRequest();
    const illegalState = { ...base, workflow_state: "CREATED" as const, integrity_hash: computeOperatorActionRequestHash({ ...base, workflow_state: "CREATED" as const }) };
    const archived = { ...base, workflow_state: "ARCHIVED" as const, integrity_hash: computeOperatorActionRequestHash({ ...base, workflow_state: "ARCHIVED" as const }) };
    const badTenant = { ...base, tenant_id: "tenant_beta", integrity_hash: computeOperatorActionRequestHash({ ...base, tenant_id: "tenant_beta" }) };
    const badMission = { ...base, mission_id: "mission_beta", integrity_hash: computeOperatorActionRequestHash({ ...base, mission_id: "mission_beta" }) };
    const badGovernance = { ...base, governance_authorized: false, constitutional_authorized: false, integrity_hash: computeOperatorActionRequestHash({ ...base, governance_authorized: false, constitutional_authorized: false }) };
    const missingReplay = { ...base, replay_ref: "", lineage_ref: "", integrity_hash: computeOperatorActionRequestHash({ ...base, replay_ref: "", lineage_ref: "" }) };
    const notAdvisory = { ...base, advisory_only: false as true, integrity_hash: computeOperatorActionRequestHash({ ...base, advisory_only: false as true }) };

    expect(processOperatorAction({ action_request: illegalState }).failures).toContain("ACTION_NOT_PERMITTED_IN_STATE");
    expect(processOperatorAction({ action_request: archived }).failures).toEqual(expect.arrayContaining(["WORKFLOW_ARCHIVED", "ACTION_NOT_PERMITTED_IN_STATE"]));
    expect(processOperatorAction({ action_request: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(processOperatorAction({ action_request: badMission }).failures).toContain("MISSION_MISMATCH");
    expect(processOperatorAction({ action_request: badGovernance }).failures).toEqual(expect.arrayContaining(["GOVERNANCE_VALIDATION_FAILED", "CONSTITUTIONAL_VALIDATION_FAILED"]));
    expect(processOperatorAction({ action_request: missingReplay }).failures).toEqual(expect.arrayContaining(["REPLAY_REFERENCE_MISSING", "LINEAGE_INCOMPLETE"]));
    expect(processOperatorAction({ action_request: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("integrates with workflow state machine failures and unauthorized engine access", () => {
    const workflow = runWorkflowStateMachine({ authorized_component: "unknown" });
    const request = createOperatorActionRequest(workflow);
    const result = processOperatorAction({ workflow_result: workflow, action_request: request, authorized_component: "unknown" });

    expect(result.action_engine_status).toBe("FAIL");
    expect(result.fail_closed).toBe(true);
    expect(result.failures).toEqual(expect.arrayContaining(["WORKFLOW_ENGINE_FAILED", "UNAUTHORIZED_ACTION_ENGINE_ACCESS"]));
    expect(result.action_result.action_status).toBe("REJECTED");
  });

  it("detects integrity tampering and replay divergence", () => {
    const valid = processOperatorAction();
    const tamperedRequest = { ...valid.action_request, justification: "tampered" };
    const tamperedResult = processOperatorAction({ action_request: tamperedRequest });
    const replayMismatch = processOperatorAction({ replay_expected_hash: `${valid.replay_hash}_wrong` });
    const replay = replayOperatorAction(valid);
    const tamperedReplay = replayOperatorAction({ ...valid, replay_hash: "tampered" });

    expect(tamperedResult.failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(replayMismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(replay.replay_valid).toBe(true);
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
