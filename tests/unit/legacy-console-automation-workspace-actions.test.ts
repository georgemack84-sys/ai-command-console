import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  resolvePayloadValues,
  assignWorkspaceOwner,
  assignIncidentApprover,
  assignBackupApprover,
  applyWorkspacePolicyOverride,
  resetWorkspacePolicyOverride,
  savePolicyPlaybook,
  deletePolicyPlaybook,
} = require("../../services/legacyConsoleAutomationWorkspaceActions.js");

describe("legacy console automation workspace actions", () => {
  it("normalizes bulk payload filters", () => {
    expect(resolvePayloadValues({ environment: "production" })).toEqual({
      environments: ["production"],
      statuses: ["error", "stalled"],
    });
    expect(resolvePayloadValues({ environments: ["staging"], statuses: ["active"] })).toEqual({
      environments: ["staging"],
      statuses: ["active"],
    });
  });

  it("assigns workspace owners and incident approver targets", () => {
    const updateDigestWorkspaceState = vi.fn();
    const updateIncidentChecklistItem = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const actor = { id: "user_1", name: "Alex" };

    assignWorkspaceOwner(
      "alpha",
      "Jamie",
      actor,
      { updateDigestWorkspaceState, updateIncidentChecklistItem, appendDigestWorkspaceEvent },
      "Assigned {owner} as workspace automation owner from the control plane.",
    );

    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        escalationOwner: "Jamie",
        assignedBy: "user_1",
        snoozedUntil: null,
      }),
    );
    expect(updateIncidentChecklistItem).toHaveBeenCalledWith(
      "alpha",
      "owner_assigned",
      expect.objectContaining({
        completed: true,
        completedByName: "Alex",
      }),
    );
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        type: "owner-assigned",
        message: "Assigned Jamie as workspace automation owner from the control plane.",
      }),
    );

    assignIncidentApprover(
      "alpha",
      "user:approver",
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      "Assigned user:approver as the required incident approver.",
    );
    assignBackupApprover(
      "alpha",
      "user:backup",
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      "Assigned user:backup as the backup incident approver.",
    );

    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        incidentApproverTarget: "user:approver",
      }),
    );
    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        backupApproverTarget: "user:backup",
      }),
    );
  });

  it("applies and resets workspace policy overrides", () => {
    const updateGovernance = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const actor = { id: "user_1", name: "Alex" };
    const targets = [
      { workspaceId: "alpha" },
      { workspaceId: "beta" },
    ];

    const applied = applyWorkspacePolicyOverride(targets, {
      environment: "production",
      requireApprovalForResolved: true,
      incidentApprovalCapacityLimit: 2,
      trustDropAction: "followup",
      promoteTrustDropToIncident: true,
    }, actor, {
      loadCollaborationState: () => ({
        governance: {
          currentEnvironment: "development",
          workspacePolicyOverrides: {
            alpha: { environment: "development" },
          },
        },
      }),
      updateGovernance,
      appendDigestWorkspaceEvent,
      summarizeWorkspacePolicyOverride: (value: { environment: string }) => `env ${value.environment}`,
    });

    expect(applied.overrideTemplate).toEqual({
      environment: "production",
      requireApprovalForResolved: true,
      incidentApprovalCapacityLimit: 2,
      trustDropAction: "followup",
      promoteTrustDropToIncident: true,
    });
    expect(applied.workspaceIds).toEqual(["alpha", "beta"]);
    expect(updateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePolicyOverrides: {
          alpha: expect.objectContaining({ environment: "production" }),
          beta: expect.objectContaining({ environment: "production" }),
        },
      }),
    );

    updateGovernance.mockClear();
    const reset = resetWorkspacePolicyOverride(targets, actor, {
      loadCollaborationState: () => ({
        governance: {
          workspacePolicyOverrides: {
            alpha: { environment: "production" },
            beta: { environment: "staging" },
            gamma: { environment: "development" },
          },
        },
      }),
      updateGovernance,
      appendDigestWorkspaceEvent,
    });

    expect(reset.workspaceIds).toEqual(["alpha", "beta"]);
    expect(updateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePolicyOverrides: {
          gamma: { environment: "development" },
        },
      }),
    );
  });

  it("saves and deletes policy playbooks", () => {
    const updateGovernance = vi.fn();

    const saved = savePolicyPlaybook(
      { name: "Production Recovery", environment: "production" },
      { id: "user_1", name: "Alex" },
      {
        loadCollaborationState: () => ({
          governance: {
            workspacePolicyPlaybooks: [{ id: "old", name: "Old", environment: "development" }],
          },
        }),
        updateGovernance,
        normalizePolicyPlaybookPayload: () => ({
          ok: true,
          playbook: { id: "new", name: "Production Recovery", environment: "production" },
        }),
      },
    );

    expect(saved).toEqual({
      ok: true,
      playbook: { id: "new", name: "Production Recovery", environment: "production" },
    });
    expect(updateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePolicyPlaybooks: [
          { id: "new", name: "Production Recovery", environment: "production" },
          { id: "old", name: "Old", environment: "development" },
        ],
      }),
    );

    updateGovernance.mockClear();
    const deleted = deletePolicyPlaybook(
      { playbookId: "old" },
      {
        loadCollaborationState: () => ({
          governance: {
            workspacePolicyPlaybooks: [
              { id: "old", name: "Old", environment: "development" },
              { id: "keep", name: "Keep", environment: "production" },
            ],
          },
        }),
        updateGovernance,
      },
    );

    expect(deleted).toEqual({
      ok: true,
      playbookId: "old",
      target: { id: "old", name: "Old", environment: "development" },
    });
    expect(updateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePolicyPlaybooks: [{ id: "keep", name: "Keep", environment: "production" }],
      }),
    );
  });
});
