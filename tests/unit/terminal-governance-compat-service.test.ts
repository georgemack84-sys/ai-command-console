import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadCollaborationState = vi.fn();
const mockUpdateGovernance = vi.fn();
const mockGetDigestWorkspaceState = vi.fn();
const mockAppendDigestWorkspaceEvent = vi.fn();
const mockAppendAuditEvent = vi.fn();

vi.mock("@/src/server/services/operations-action-service", () => ({
  executeOperationsAction: vi.fn(),
}));

vi.mock("@/src/server/services/policy-governance-service", () => ({
  getPolicyGovernanceSnapshot: vi.fn(),
  updateGovernanceSettings: vi.fn(),
}));

import { executeOperationsAction } from "@/src/server/services/operations-action-service";
import {
  getPolicyGovernanceSnapshot,
  updateGovernanceSettings,
} from "@/src/server/services/policy-governance-service";
import {
  __resetTerminalGovernanceCompatDepsForTest,
  __setTerminalGovernanceCompatDepsForTest,
  canHandleTerminalGovernanceCompatAction,
  executeTerminalGovernanceCompatAction,
} from "@/src/server/services/terminal-governance-compat-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  email: "admin@example.com",
  name: "Admin",
  role: "admin" as const,
};

describe("terminal governance compatibility service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setTerminalGovernanceCompatDepsForTest({
      loadCollaborationState: mockLoadCollaborationState,
      updateGovernance: mockUpdateGovernance,
      getDigestWorkspaceState: mockGetDigestWorkspaceState,
      appendDigestWorkspaceEvent: mockAppendDigestWorkspaceEvent,
      appendAuditEvent: mockAppendAuditEvent,
    });
    mockLoadCollaborationState.mockReturnValue({
      governance: {
        currentEnvironment: "production",
        environmentPolicies: {
          production: {
            incidentApprovalCapacityLimit: 2,
          },
        },
        appliedApprovalPolicies: [],
        approvalRecommendationObservations: [
          { recommendationId: "rec_1", status: "watching", alertId: "alert_rec_1" },
        ],
        approvalTrustAlertAcks: [{ alertId: "alert_rec_1" }],
      },
    });
    mockGetDigestWorkspaceState.mockReturnValue({ backupApproverTarget: "role:ops" });
    vi.mocked(getPolicyGovernanceSnapshot).mockResolvedValue({
      currentEnvironment: "production",
      environmentPolicies: {
        production: {
          incidentApprovalCapacityLimit: 2,
        },
      },
    } as never);
    vi.mocked(updateGovernanceSettings).mockResolvedValue({} as never);
    vi.mocked(executeOperationsAction).mockResolvedValue({
      action: "collaboration:automation-assign-backup-approver",
      output: "assigned",
    } as never);
  });

  afterEach(() => {
    __resetTerminalGovernanceCompatDepsForTest();
  });

  it("recognizes the extracted compatibility actions", () => {
    expect(canHandleTerminalGovernanceCompatAction("collaboration:acknowledge-trust-alert")).toBe(true);
    expect(canHandleTerminalGovernanceCompatAction("collaboration:promote-approval-policy-recommendation")).toBe(true);
    expect(canHandleTerminalGovernanceCompatAction("something:else")).toBe(false);
  });

  it("acknowledges trust alerts without using the legacy console engine", async () => {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: "collaboration:acknowledge-trust-alert",
        payload: { alertId: "trust_1" },
      },
      actor,
    );

    expect(result).toEqual({ ok: true, output: "Acknowledged trust alert trust_1." });
    expect(mockUpdateGovernance).toHaveBeenCalled();
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "collaboration:acknowledge-trust-alert",
      }),
    );
  });

  it("restarts recommendation observation and clears matching trust acknowledgements", async () => {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: "collaboration:restart-approval-recommendation-observation",
        payload: { recommendationId: "rec_1" },
      },
      actor,
    );

    expect(result).toEqual({ ok: true, output: "Restarted observation for rec_1." });
    expect(mockUpdateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalRecommendationObservations: expect.arrayContaining([
          expect.objectContaining({ recommendationId: "rec_1", status: "observing" }),
        ]),
        approvalTrustAlertAcks: [],
      }),
    );
  });

  it("extends recommendation cooldown and clears matching trust acknowledgements", async () => {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: "collaboration:extend-approval-recommendation-cooldown",
        payload: { recommendationId: "rec_1", hours: 12 },
      },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(result).toEqual(expect.objectContaining({ output: "Extended cooldown for rec_1 by 12 hours." }));
    expect(mockUpdateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalRecommendationObservations: expect.arrayContaining([
          expect.objectContaining({ recommendationId: "rec_1", status: "cooldown" }),
        ]),
        approvalTrustAlertAcks: [],
      }),
    );
  });

  it("applies workspace approval recommendations through the operations service", async () => {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: "collaboration:promote-approval-policy-recommendation",
        payload: {
          recommendationId: "rec_1",
          recommendationKind: "workspace",
          workspaceId: "workspace_1",
          suggestedBackupApproverTarget: "role:admin",
        },
      },
      actor,
    );

    expect(executeOperationsAction).toHaveBeenCalledWith(
      {
        action: "collaboration:automation-assign-backup-approver",
        payload: { workspaceId: "workspace_1", backupApproverTarget: "role:admin" },
      },
      actor,
    );
    expect(mockAppendDigestWorkspaceEvent).toHaveBeenCalled();
    expect(mockUpdateGovernance).toHaveBeenCalledWith(
      expect.objectContaining({
        appliedApprovalPolicies: expect.arrayContaining([
          expect.objectContaining({
            recommendationId: "rec_1",
            workspaceId: "workspace_1",
          }),
        ]),
      }),
    );
    expect(result).toEqual({
      ok: true,
      output: "Assigned role:admin as the backup approver for workspace_1.",
    });
  });

  it("applies environment capacity recommendations through the Prisma governance service", async () => {
    const result = await executeTerminalGovernanceCompatAction(
      {
        action: "collaboration:apply-approval-policy-recommendation",
        payload: {
          recommendationId: "rec_cap",
          recommendationKind: "policy",
          environment: "production",
          suggestedCapacityLimit: 1,
        },
      },
      actor,
    );

    expect(updateGovernanceSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        environmentPolicies: expect.objectContaining({
          production: expect.objectContaining({
            incidentApprovalCapacityLimit: 1,
          }),
        }),
      }),
    );
    expect(result).toEqual({
      ok: true,
      output: "Set the production approval capacity limit to 1.",
    });
  });
});
