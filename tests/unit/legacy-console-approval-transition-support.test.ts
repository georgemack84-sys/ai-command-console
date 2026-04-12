import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  getPendingApprovalOrError,
  approveApprovalRequest,
  rejectApprovalRequest,
  rerouteApprovalRequest,
  rerouteBulkApprovalRequests,
} = require("../../services/legacyConsoleApprovalTransitionSupport.js");

describe("legacy console approval transition support", () => {
  const actor = { id: "user_1", name: "Alex" };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T15:05:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns lookup errors for missing or non-pending approvals", () => {
    expect(
      getPendingApprovalOrError("approval_1", {
        getApprovalRequest: () => null,
      }),
    ).toEqual({
      ok: false,
      error: "Approval request not found: approval_1",
    });

    expect(
      getPendingApprovalOrError("approval_2", {
        getApprovalRequest: () => ({ id: "approval_2", status: "approved" }),
      }),
    ).toEqual({
      ok: false,
      error: "Approval request is already approved.",
      status: "approved",
    });
  });

  it("approves requests and records incident side effects", () => {
    const resolveApprovalRequest = vi.fn();
    const closeIncidentApprovalReminderHandoffs = vi.fn(() => [{ id: "handoff_1" }]);
    const appendDigestWorkspaceEvent = vi.fn();
    const appendAuditEvent = vi.fn();
    const request = {
      id: "approval_1",
      status: "pending",
      approverTarget: "user:user_1",
      action: "collaboration:automation-set-status",
      payload: { workspaceId: "alpha", incidentStatus: "resolved" },
    };

    const result = approveApprovalRequest("approval_1", actor, {}, {
      getApprovalRequest: vi.fn(() => request),
      canActorHandleApproval: vi.fn(() => true),
      resolveApprovalRequest,
      closeIncidentApprovalReminderHandoffs,
      appendDigestWorkspaceEvent,
      appendAuditEvent,
    });

    expect(result).toEqual({
      ok: true,
      request,
      closedReminders: [{ id: "handoff_1" }],
    });
    expect(resolveApprovalRequest).toHaveBeenCalledWith("approval_1", {
      status: "approved",
      approvedById: "user_1",
      approvedByName: "Alex",
    });
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        type: "incident-approval",
        actorName: "Alex",
      }),
    );
    expect(appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "approval:approve",
      }),
    );
  });

  it("rejects requests and preserves rejection notes", () => {
    const resolveApprovalRequest = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const appendAuditEvent = vi.fn();
    const request = {
      id: "approval_2",
      status: "pending",
      approverTarget: "user:user_1",
      action: "collaboration:automation-set-status",
      payload: { workspaceId: "alpha", incidentStatus: "archived" },
    };

    const result = rejectApprovalRequest("approval_2", actor, {}, "Needs more evidence", {
      getApprovalRequest: vi.fn(() => request),
      canActorHandleApproval: vi.fn(() => true),
      resolveApprovalRequest,
      closeIncidentApprovalReminderHandoffs: vi.fn(() => []),
      appendDigestWorkspaceEvent,
      appendAuditEvent,
    });

    expect(result.ok).toBe(true);
    expect(resolveApprovalRequest).toHaveBeenCalledWith("approval_2", {
      status: "rejected",
      rejectedById: "user_1",
      rejectedByName: "Alex",
      rejectionNote: "Needs more evidence",
    });
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        note: "Needs more evidence",
      }),
    );
    expect(appendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "approval:reject",
        summary: "Needs more evidence",
      }),
    );
  });

  it("reroutes individual approvals and validates target requirements", () => {
    const request = { id: "approval_3", status: "pending" };
    const reroutePendingApproval = vi.fn(() => ({ id: "approval_3", approverTarget: "user:backup" }));

    const reassigned = rerouteApprovalRequest(
      "approval_3",
      "approval:reassign-target",
      { approverTarget: "user:backup" },
      actor,
      {
        getApprovalRequest: vi.fn(() => request),
        reroutePendingApproval,
      },
    );

    expect(reassigned).toEqual({
      ok: true,
      request,
      updated: { id: "approval_3", approverTarget: "user:backup" },
      nextTarget: "user:backup",
    });
    expect(reroutePendingApproval).toHaveBeenCalledWith(request, "user:backup", actor, "approval:reassign-target");

    expect(
      rerouteApprovalRequest("approval_3", "approval:reassign-target", {}, actor, {
        getApprovalRequest: vi.fn(() => request),
        reroutePendingApproval,
      }),
    ).toEqual({
      ok: false,
      error: "A new approver target is required.",
      reason: "missing-target",
      request,
    });
  });

  it("reroutes bulk approvals for one current target", () => {
    const reroutePendingApproval = vi
      .fn()
      .mockReturnValueOnce({ id: "approval_4", approverTarget: "user:backup" })
      .mockReturnValueOnce({ id: "approval_5", approverTarget: "user:backup" });

    const result = rerouteBulkApprovalRequests(
      "approval:bulk-reassign-target",
      { currentTarget: "user:primary", approverTarget: "user:backup" },
      actor,
      {
        loadCollaborationState: () => ({
          approvals: [
            { id: "approval_4", status: "pending", approverTarget: "user:primary" },
            { id: "approval_5", status: "pending", approverTarget: "user:primary" },
            { id: "approval_6", status: "approved", approverTarget: "user:primary" },
          ],
        }),
        reroutePendingApproval,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.currentTarget).toBe("user:primary");
    expect(result.nextTarget).toBe("user:backup");
    expect(result.touched).toEqual([
      { id: "approval_4", approverTarget: "user:backup" },
      { id: "approval_5", approverTarget: "user:backup" },
    ]);
  });
});
