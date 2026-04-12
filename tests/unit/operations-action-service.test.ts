import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    workspace: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    incidentApprovalRequest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workspaceOperationsState: {
      update: vi.fn(),
    },
    operationsFollowup: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/src/server/services/workspace-operations-state-service", () => ({
  SUPPORTED_INCIDENT_STATUSES: ["open", "investigating", "ready_for_closeout", "resolved", "shared", "archived"],
  ensureWorkspaceOperationsState: vi.fn(),
  recordWorkspaceOperationActivity: vi.fn(),
  updateWorkspaceChecklistItem: vi.fn(),
  buildDefaultChecklist: vi.fn(() => [
    { id: "owner_assigned", label: "Assign an incident owner", completed: false, completedAt: null, completedByName: null },
    { id: "followup_created", label: "Create a remediation follow-up", completed: false, completedAt: null, completedByName: null },
    { id: "summary_generated", label: "Generate an incident summary", completed: false, completedAt: null, completedByName: null },
    { id: "shared_handoff", label: "Share the incident handoff", completed: false, completedAt: null, completedByName: null },
  ]),
}));

vi.mock("@/src/server/services/policy-governance-service", () => ({
  applyPolicyOverrideToWorkspaces: vi.fn(),
  applyPolicyPlaybookToWorkspaces: vi.fn(),
  deletePolicyPlaybook: vi.fn(),
  getPolicyGovernanceSnapshot: vi.fn(async () => ({
    currentEnvironment: "development",
    workspacePolicyOverrides: {},
  })),
  resetPolicyOverrideForWorkspaces: vi.fn(),
  rollbackPolicyPlaybookRollout: vi.fn(),
  savePolicyPlaybook: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import {
  applyPolicyOverrideToWorkspaces,
  savePolicyPlaybook,
} from "@/src/server/services/policy-governance-service";
import {
  ensureWorkspaceOperationsState,
  recordWorkspaceOperationActivity,
  updateWorkspaceChecklistItem,
} from "@/src/server/services/workspace-operations-state-service";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";

const actor = {
  id: "user_1",
  email: "operator@example.com",
  name: "Operator",
  role: "admin" as const,
  workspaceId: "workspace_1",
};

describe("operations action service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: "workspace_1",
      name: "Pulse Workspace",
      updates: [
        { id: "update_1", title: "Critical incident", severity: "critical" },
        { id: "update_2", title: "Latency drift", severity: "high" },
      ],
    } as never);
    vi.mocked(ensureWorkspaceOperationsState).mockResolvedValue({
      workspaceId: "workspace_1",
      incidentStatus: "investigating",
      escalationOwner: "Morgan Lee",
      incidentChecklist: [],
      incidentArchiveRecommendation: null,
    } as never);
  });

  it("stores owner assignment in Prisma-backed operations state", async () => {
    const result = await executeOperationsAction(
      { action: "collaboration:automation-assign", payload: { workspaceId: "workspace_1", owner: "Jamie Lead" } },
      actor,
    );

    expect(result.output).toContain("Assigned Jamie Lead");
    expect(prisma.workspaceOperationsState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "workspace_1" },
        data: { escalationOwner: "Jamie Lead" },
      }),
    );
    expect(updateWorkspaceChecklistItem).toHaveBeenCalledWith("workspace_1", "owner_assigned", true, "Operator");
  });

  it("creates a persisted follow-up for workspace operations", async () => {
    vi.mocked(prisma.operationsFollowup.create).mockResolvedValue({ id: "followup_1" } as never);

    const result = await executeOperationsAction(
      {
        action: "collaboration:automation-create-followup",
        payload: {
          workspaceId: "workspace_1",
          owner: "Jamie Lead",
          agentName: "builder",
          description: "Investigate trust recovery readiness.",
        },
      },
      actor,
    );

    expect(result.output).toContain("followup_1");
    expect(prisma.operationsFollowup.create).toHaveBeenCalled();
    expect(recordWorkspaceOperationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace_1",
        type: "operations.followup.created",
      }),
    );
  });

  it("accepts workspace alias actions for follow-ups", async () => {
    vi.mocked(prisma.operationsFollowup.create).mockResolvedValue({ id: "followup_alias" } as never);

    const result = await executeOperationsAction(
      {
        action: "workspace:create-followup",
        payload: {
          workspaceId: "workspace_1",
          owner: "Jamie Lead",
          agentName: "builder",
          description: "Alias follow-up path.",
        },
      },
      actor,
    );

    expect(result.output).toContain("followup_alias");
    expect(prisma.operationsFollowup.create).toHaveBeenCalled();
  });

  it("accepts workspace alias actions for notes", async () => {
    const result = await executeOperationsAction(
      {
        action: "workspace:add-note",
        payload: {
          workspaceId: "workspace_1",
          note: "Alias note path.",
        },
      },
      actor,
    );

    expect(result.output).toContain("Added workspace note");
    expect(recordWorkspaceOperationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace_1",
        type: "operations.note.added",
      }),
    );
  });

  it("accepts the richer incident statuses used by the operations UI", async () => {
    const result = await executeOperationsAction(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "workspace_1", incidentStatus: "ready_for_closeout" },
      },
      actor,
    );

    expect(result.output).toContain("ready_for_closeout");
    expect(prisma.workspaceOperationsState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ incidentStatus: "ready_for_closeout" }),
      }),
    );
  });

  it("creates a pending approval when a resolved transition requires approval", async () => {
    vi.mocked(ensureWorkspaceOperationsState).mockResolvedValue({
      workspaceId: "workspace_1",
      incidentStatus: "investigating",
      escalationOwner: "Morgan Lee",
      incidentApproverTarget: "approver@example.com",
      incidentChecklist: [],
      incidentArchiveRecommendation: null,
    } as never);
    vi.mocked(prisma.incidentApprovalRequest.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.incidentApprovalRequest.create).mockResolvedValue({
      id: "approval_1",
      approverTarget: "approver@example.com",
    } as never);

    const result = await executeOperationsAction(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId: "workspace_1", incidentStatus: "resolved" },
      },
      actor,
    );

    expect(result.output).toContain("Requested resolved approval");
    expect(prisma.incidentApprovalRequest.create).toHaveBeenCalled();
  });

  it("approves a pending incident approval through Prisma", async () => {
    vi.mocked(prisma.incidentApprovalRequest.findFirst).mockResolvedValue({
      id: "approval_1",
      workspaceId: "workspace_1",
      approverTarget: "operator@example.com",
      status: "pending",
      requestedStatus: "resolved",
      workspace: { name: "Pulse Workspace" },
    } as never);
    vi.mocked(prisma.incidentApprovalRequest.update).mockResolvedValue({ id: "approval_1" } as never);
    vi.mocked(prisma.workspaceOperationsState.update).mockResolvedValue({ workspaceId: "workspace_1" } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

    const result = await executeOperationsAction(
      { action: "approval:approve", payload: { approvalId: "approval_1" } },
      actor,
    );

    expect(result.output).toContain("Approved resolved transition");
    expect(prisma.incidentApprovalRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "approval_1" },
        data: expect.objectContaining({ status: "approved" }),
      }),
    );
  });

  it("bulk reassigns pending approvals for a target through Prisma", async () => {
    vi.mocked(prisma.incidentApprovalRequest.findMany).mockResolvedValue([
      {
        id: "approval_1",
        workspaceId: "workspace_1",
        approverTarget: "approver@example.com",
        workspace: { name: "Pulse Workspace" },
      },
      {
        id: "approval_2",
        workspaceId: "workspace_1",
        approverTarget: "approver@example.com",
        workspace: { name: "Pulse Workspace" },
      },
    ] as never);
    vi.mocked(prisma.incidentApprovalRequest.update).mockReturnValue({} as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

    const result = await executeOperationsAction(
      {
        action: "approval:bulk-reassign-target",
        payload: { currentTarget: "approver@example.com", approverTarget: "backup@example.com" },
      },
      actor,
    );

    expect(result.output).toContain("Reassigned 2 pending approvals to backup@example.com");
    expect(prisma.incidentApprovalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "pending",
          approverTarget: "approver@example.com",
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(recordWorkspaceOperationActivity).toHaveBeenCalledTimes(2);
  });

  it("saves policy playbooks through the governance service", async () => {
    const result = await executeOperationsAction(
      {
        action: "collaboration:save-policy-playbook",
        payload: {
          playbook: {
            name: "High vigilance",
            environment: "production",
            incidentApprovalCapacityLimit: 1,
            trustDropAction: "followup",
            requireApprovalForResolved: true,
            promoteTrustDropToIncident: true,
          },
        },
      },
      actor,
    );

    expect(result.output).toContain("Saved policy playbook High vigilance");
    expect(savePolicyPlaybook).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "High vigilance",
        environment: "production",
      }),
      actor,
    );
  });

  it("bulk applies workspace policy overrides through the governance service", async () => {
    vi.mocked(applyPolicyOverrideToWorkspaces).mockResolvedValue({ workspacePolicyOverrides: {} } as never);
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([
      { id: "workspace_1", updates: [{ severity: "critical" }], operationsState: null },
    ] as never);

    const result = await executeOperationsAction(
      {
        action: "collaboration:automation-bulk-apply-policy-override",
        payload: {
          environment: "development",
          statuses: ["error"],
          overrideEnvironment: "production",
          incidentApprovalCapacityLimit: 1,
          trustDropAction: "followup",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: true,
        },
      },
      actor,
    );

    expect(result.output).toContain("Applied the policy override to 1 workspace");
    expect(applyPolicyOverrideToWorkspaces).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceIds: ["workspace_1"],
      }),
    );
  });
});
