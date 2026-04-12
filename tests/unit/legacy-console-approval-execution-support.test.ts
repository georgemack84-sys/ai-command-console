import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  buildApprovalTelemetryMeta,
  executeApprovedAction,
  buildBulkApprovalOutput,
  buildSingleApprovalOutput,
} = require("../../services/legacyConsoleApprovalExecutionSupport.js");

describe("legacy console approval execution support", () => {
  it("builds compact approval telemetry metadata", () => {
    expect(
      buildApprovalTelemetryMeta({ approvalId: "approval_1" }, { reason: "wrong-approver", status: undefined }),
    ).toEqual({
      approvalId: "approval_1",
      reason: "wrong-approver",
    });
  });

  it("executes approved actions and finalizes trust closeout or archive side effects", async () => {
    const executeAction = vi.fn()
      .mockResolvedValueOnce({ ok: true, output: "resolved" })
      .mockResolvedValueOnce({ ok: true, output: "archived" })
      .mockResolvedValueOnce({ ok: false, error: "failed" });
    const finalizeRecoveredTrustIncidentCloseout = vi.fn();
    const finalizeArchivedTrustIncident = vi.fn();
    const actor = { id: "user_1", name: "Alex" };

    const resolved = await executeApprovedAction(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "alpha", incidentStatus: "resolved" },
      },
      actor,
      { dryRun: false },
      { executeAction, finalizeRecoveredTrustIncidentCloseout, finalizeArchivedTrustIncident },
    );
    expect(resolved).toEqual({ ok: true, output: "resolved" });
    expect(executeAction).toHaveBeenCalledWith(
      "collaboration:automation-set-status",
      { workspaceId: "alpha", incidentStatus: "resolved" },
      { dryRun: false, bypassApproval: true },
    );
    expect(finalizeRecoveredTrustIncidentCloseout).toHaveBeenCalledWith("alpha", "Alex");

    const archived = await executeApprovedAction(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "beta", incidentStatus: "archived" },
      },
      actor,
      {},
      { executeAction, finalizeRecoveredTrustIncidentCloseout, finalizeArchivedTrustIncident },
    );
    expect(archived).toEqual({ ok: true, output: "archived" });
    expect(finalizeArchivedTrustIncident).toHaveBeenCalledWith("beta", "Alex");

    const failed = await executeApprovedAction(
      {
        action: "workflow:create-task",
        payload: { description: "noop" },
      },
      actor,
      {},
      { executeAction, finalizeRecoveredTrustIncidentCloseout, finalizeArchivedTrustIncident },
    );
    expect(failed).toEqual({ ok: false, error: "failed" });
  });

  it("formats bulk and single approval outputs", () => {
    expect(buildBulkApprovalOutput("approval:bulk-take-over", "user:primary", "user:alex", 3)).toBe(
      "Took ownership of 3 approvals from user:primary.",
    );
    expect(buildBulkApprovalOutput("approval:bulk-reassign-target", "user:primary", "user:backup", 2)).toBe(
      "Reassigned 2 approvals from user:primary to user:backup.",
    );
    expect(buildSingleApprovalOutput("approval:take-over", "approval_1", "user:alex")).toBe(
      "Took ownership of approval approval_1.",
    );
    expect(buildSingleApprovalOutput("approval:reassign-target", "approval_2", "user:backup")).toBe(
      "Reassigned approval approval_2 to user:backup.",
    );
  });
});
