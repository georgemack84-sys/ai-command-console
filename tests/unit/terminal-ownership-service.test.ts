import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    researchBrief: { findFirst: vi.fn() },
    researchReport: { findFirst: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    activityEvent: { create: vi.fn() },
  },
}));

vi.mock("@/src/server/services/research-service", () => ({
  updateBrief: vi.fn(),
  updateReport: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import { updateBrief, updateReport } from "@/src/server/services/research-service";
import { executeTerminalOwnershipAction } from "@/src/server/services/terminal-ownership-service";

const owner = { id: "user_1", workspaceId: "workspace_1", name: "Owner", email: "owner@example.com", role: "operator" as const };
const other = { id: "user_2", workspaceId: "workspace_1", name: "Other", email: "other@example.com", role: "operator" as const };
const admin = { id: "admin_1", workspaceId: "workspace_1", name: "Admin", email: "admin@example.com", role: "admin" as const };
const viewer = { id: "viewer_1", workspaceId: "workspace_1", name: "Viewer", email: "viewer@example.com", role: "viewer" as const };

describe("terminal ownership service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_1" } as never);
    vi.mocked(updateBrief).mockResolvedValue({ id: "brief_1" } as never);
    vi.mocked(updateReport).mockResolvedValue({ id: "report_1" } as never);
    vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(async ({ where }: any) => ({
      user: { id: where.userId, name: where.userId === owner.id ? owner.name : other.name, email: where.userId === owner.id ? owner.email : other.email },
    }) as never);
  });

  it("lets an operator claim unowned work and release their own work", async () => {
    vi.mocked(prisma.researchBrief.findFirst)
      .mockResolvedValueOnce({ id: "brief_1", title: "Threat brief", ownerId: null } as never)
      .mockResolvedValueOnce({ id: "brief_1", title: "Threat brief", ownerId: owner.id } as never);

    const claimed = await executeTerminalOwnershipAction(
      { action: "ownership:claim-item", payload: { resourceType: "brief", resourceId: "brief_1" } },
      owner,
    );
    expect(claimed.output).toContain("now owned by Owner");
    expect(updateBrief).toHaveBeenCalledWith(expect.objectContaining({ briefId: "brief_1", patch: { ownerId: owner.id } }));

    const released = await executeTerminalOwnershipAction(
      { action: "ownership:release-item", payload: { resourceType: "brief", resourceId: "brief_1" } },
      owner,
    );
    expect(released.output).toContain("Released ownership");
    expect(updateBrief).toHaveBeenLastCalledWith(expect.objectContaining({ briefId: "brief_1", patch: { ownerId: null } }));
  });

  it("restricts reassignment to admins and validates the target membership", async () => {
    vi.mocked(prisma.researchReport.findFirst).mockResolvedValue({ id: "report_1", title: "Morning report", ownerId: owner.id } as never);

    await expect(
      executeTerminalOwnershipAction(
        { action: "ownership:assign-item", payload: { resourceType: "report", resourceId: "report_1", ownerId: other.id } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await executeTerminalOwnershipAction(
      { action: "ownership:assign-item", payload: { resourceType: "report", resourceId: "report_1", ownerId: other.id } },
      admin,
    );
    expect(updateReport).toHaveBeenCalledWith(expect.objectContaining({ reportId: "report_1", patch: { ownerId: other.id } }));
    expect(prisma.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: "ownership:assign-item", metadata: expect.objectContaining({ previousOwnerId: owner.id, ownerId: other.id }) }),
    }));

    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValueOnce(null);
    await expect(
      executeTerminalOwnershipAction(
        { action: "ownership:assign-item", payload: { resourceType: "report", resourceId: "report_1", ownerId: "outside_user" } },
        admin,
      ),
    ).rejects.toMatchObject({ status: 400, code: "invalid_assignment_target" });
  });

  it("blocks takeover of owned work and all viewer mutations", async () => {
    vi.mocked(prisma.researchBrief.findFirst).mockResolvedValue({ id: "brief_1", title: "Threat brief", ownerId: owner.id } as never);

    await expect(
      executeTerminalOwnershipAction(
        { action: "ownership:claim-item", payload: { resourceType: "brief", resourceId: "brief_1" } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      executeTerminalOwnershipAction(
        { action: "ownership:release-item", payload: { resourceType: "brief", resourceId: "brief_1" } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      executeTerminalOwnershipAction(
        { action: "ownership:claim-item", payload: { resourceType: "brief", resourceId: "brief_1" } },
        viewer,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
