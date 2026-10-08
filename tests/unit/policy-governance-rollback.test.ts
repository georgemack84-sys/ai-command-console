import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    platformGovernanceSettings: { upsert: vi.fn() },
    environmentPolicy: { upsert: vi.fn() },
    policyPlaybook: { createMany: vi.fn() },
    policyPlaybookRollout: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { rollbackPolicyPlaybookRollout } from "@/src/server/services/policy-governance-service";

const afterOverride = {
  environment: "production",
  incidentApprovalCapacityLimit: 1,
  trustDropAction: "followup",
  requireApprovalForResolved: true,
  promoteTrustDropToIncident: true,
  sourceType: "playbook",
  sourcePlaybookId: "playbook_1",
  updatedById: "admin_1",
  updatedByName: "Admin",
};

describe("policy playbook rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.platformGovernanceSettings.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.environmentPolicy.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.policyPlaybook.createMany).mockResolvedValue({ count: 0 } as never);
  });

  it("fails closed when a workspace override changed after the rollout", async () => {
    vi.mocked(prisma.policyPlaybookRollout.findUnique).mockResolvedValue({
      id: "rollout_1",
      rolledBackAt: null,
      workspaces: [{ workspaceId: "workspace_1", beforeOverride: null, afterOverride }],
    } as never);
    const tx = {
      workspacePolicyOverride: {
        findUnique: vi.fn().mockResolvedValue({ ...afterOverride, trustDropAction: "notify" }),
        deleteMany: vi.fn(),
        upsert: vi.fn(),
      },
      policyPlaybookRollout: { update: vi.fn() },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: never) => callback(tx) as never);

    await expect(rollbackPolicyPlaybookRollout("rollout_1")).rejects.toMatchObject({
      status: 409,
      code: "policy_rollout_stale",
    });
    expect(tx.workspacePolicyOverride.deleteMany).not.toHaveBeenCalled();
    expect(tx.workspacePolicyOverride.upsert).not.toHaveBeenCalled();
    expect(tx.policyPlaybookRollout.update).not.toHaveBeenCalled();
  });

  it("rejects a second rollback instead of overwriting later policy changes", async () => {
    vi.mocked(prisma.policyPlaybookRollout.findUnique).mockResolvedValue({
      id: "rollout_1",
      rolledBackAt: new Date("2026-10-08T00:00:00.000Z"),
      workspaces: [],
    } as never);

    await expect(rollbackPolicyPlaybookRollout("rollout_1")).rejects.toMatchObject({
      status: 409,
      code: "policy_rollout_already_rolled_back",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
