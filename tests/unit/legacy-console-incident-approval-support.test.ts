import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  canActorHandleApproval,
  closeIncidentApprovalReminderHandoffs,
  reroutePendingApproval,
  ensureIncidentApprovalDelegation,
  autoRerouteIncidentApproval,
} = require("../../services/legacyConsoleIncidentApprovalSupport.js");

describe("legacy console incident approval support", () => {
  it("checks whether an actor can handle an approval", () => {
    const deps = {
      canApproveInEnvironment: vi.fn(() => true),
      matchesTargets: vi.fn((target: string, set: Set<string>) => set.has(target)),
      buildActorTargets: vi.fn(() => new Set(["user:alex"])),
    };

    expect(
      canActorHandleApproval(
        { role: "approver" },
        { approverTarget: "user:alex", payload: { workspaceId: "alpha" } },
        {},
        deps,
      ),
    ).toBe(true);

    expect(
      canActorHandleApproval(
        { role: "viewer" },
        { approverTarget: "user:alex", payload: { workspaceId: "alpha" } },
        {},
        {
          ...deps,
          canApproveInEnvironment: () => false,
        },
      ),
    ).toBe(false);
  });

  it("closes open reminder/escalation handoffs for an approval", () => {
    const closeHandoff = vi.fn();
    const closed = closeIncidentApprovalReminderHandoffs("approval_1", {
      loadCollaborationState: () => ({
        handoffs: [
          { id: "handoff_1", status: "open", kind: "incident-approval-reminder", relatedApprovalId: "approval_1" },
          { id: "handoff_2", status: "open", kind: "incident-approval-escalation", relatedApprovalId: "approval_1" },
          { id: "handoff_3", status: "closed", kind: "incident-approval-reminder", relatedApprovalId: "approval_1" },
          { id: "handoff_4", status: "open", kind: "other", relatedApprovalId: "approval_1" },
        ],
      }),
      closeHandoff,
    });

    expect(closed.map((item: { id: string }) => item.id)).toEqual(["handoff_1", "handoff_2"]);
    expect(closeHandoff).toHaveBeenCalledTimes(2);
  });

  it("reroutes approvals and records digest/audit events", () => {
    const appendDigestWorkspaceEvent = vi.fn();
    const appendAuditEvent = vi.fn();
    const updatedRequest = {
      id: "approval_1",
      action: "collaboration:automation-set-status",
      payload: { workspaceId: "alpha" },
    };

    const result = reroutePendingApproval(
      {
        id: "approval_1",
        status: "pending",
      },
      "user:backup",
      { id: "user_1", name: "Alex" },
      "approval:take-over",
      {
        updateApprovalRequest: vi.fn(() => updatedRequest),
        loadCollaborationState: () => ({
          handoffs: [{ id: "handoff_1", status: "open", kind: "incident-approval-reminder", relatedApprovalId: "approval_1" }],
        }),
        closeHandoff: vi.fn(),
        appendDigestWorkspaceEvent,
        appendAuditEvent,
      },
    );

    expect(result).toBe(updatedRequest);
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        type: "incident-approval-rerouted",
        actorName: "Alex",
      }),
    );
    expect(appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "approval:take-over",
      }),
    );
  });

  it("creates reminder and escalation handoffs when approval SLA windows are exceeded", () => {
    const createHandoff = vi
      .fn()
      .mockReturnValueOnce({ id: "reminder_1" })
      .mockReturnValueOnce({ id: "escalation_1" })
      .mockReturnValueOnce({ id: "final_1" });
    const appendDigestWorkspaceEvent = vi.fn();
    const appendAuditEvent = vi.fn();

    const handoff = ensureIncidentApprovalDelegation(
      {
        workspaceId: "alpha",
        workspaceName: "Alpha",
        incidentApproval: {
          id: "approval_1",
          state: "pending",
          approverTarget: "user:primary",
          requestedStatus: "resolved",
          label: "Resolve incident",
          createdAt: "2026-04-09T11:00:00.000Z",
        },
        incidentApprovalSla: {
          ageMs: 3_600_000,
          reminderDelayMs: 10,
          escalated: true,
          finalEscalated: true,
        },
        incidentPolicy: {
          incidentApprovalEscalationTarget: "role:admin",
          incidentApprovalFinalEscalationTarget: "team",
        },
      },
      { handoffs: [] },
      {
        buildIncidentApprovalSla: vi.fn(),
        createHandoff,
        appendDigestWorkspaceEvent,
        appendAuditEvent,
        matchesTargets: vi.fn(() => false),
        normalizeTarget: (value: string) => value,
      },
    );

    expect(handoff).toEqual({ id: "reminder_1" });
    expect(createHandoff).toHaveBeenCalledTimes(3);
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({ type: "incident-approval-reminder" }),
    );
    expect(appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "incident-approval-final-escalation" }),
    );
  });

  it("auto-reroutes approvals to backup approvers and records the change", () => {
    const appendDigestWorkspaceEvent = vi.fn();
    const appendAuditEvent = vi.fn();
    const updateApprovalRequest = vi.fn(() => ({ id: "approval_1", approverTarget: "user:backup" }));
    const closeHandoff = vi.fn();

    const result = autoRerouteIncidentApproval(
      {
        workspaceId: "alpha",
        backupApproverTarget: "user:backup",
        incidentApprovalSla: { finalEscalated: true },
        incidentApproval: {
          id: "approval_1",
          state: "pending",
          approverTarget: "user:primary",
        },
      },
      {
        updateApprovalRequest,
        loadCollaborationState: () => ({
          handoffs: [{ id: "handoff_1", status: "open", kind: "incident-approval-reminder", relatedApprovalId: "approval_1" }],
        }),
        closeHandoff,
        appendDigestWorkspaceEvent,
        appendAuditEvent,
        matchesTargets: vi.fn(() => false),
        normalizeTarget: (value: string) => value,
      },
    );

    expect(result).toEqual({ id: "approval_1", approverTarget: "user:backup" });
    expect(updateApprovalRequest).toHaveBeenCalledWith(
      "approval_1",
      expect.objectContaining({
        approverTarget: "user:backup",
        autoReroutedFrom: "user:primary",
      }),
    );
    expect(closeHandoff).toHaveBeenCalledWith("handoff_1");
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({ type: "incident-approval-auto-rerouted" }),
    );
    expect(appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "incident-approval-auto-rerouted" }),
    );
  });
});
