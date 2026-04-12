import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    monitoredUpdate: {
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    source: {
      count: vi.fn(),
    },
    activityEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { executeDashboardAction } from "@/src/server/services/dashboard-action-service";

const actor = {
  id: "user_1",
  email: "operator@example.com",
  name: "Operator",
  role: "admin" as const,
  workspaceId: "workspace_1",
};

describe("dashboard action service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a DB-backed alert scan", async () => {
    vi.mocked(prisma.monitoredUpdate.count).mockResolvedValue(3);
    vi.mocked(prisma.source.count).mockResolvedValue(1);
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_1" } as never);

    const result = await executeDashboardAction({ action: "alert:run-checks", payload: {} }, actor);

    expect(result.output).toContain("3 active high-severity updates");
    expect(prisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "workspace_1",
          type: "dashboard.alerts.checked",
        }),
      }),
    );
  });

  it("acknowledges a monitored update instead of delegating to the legacy console", async () => {
    vi.mocked(prisma.monitoredUpdate.findFirst).mockResolvedValue({
      id: "update_1",
      title: "Critical signal",
    } as never);
    vi.mocked(prisma.monitoredUpdate.update).mockResolvedValue({ id: "update_1" } as never);
    vi.mocked(prisma.activityEvent.create).mockResolvedValue({ id: "activity_2" } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

    const result = await executeDashboardAction(
      { action: "alert:acknowledge", payload: { alertId: "update_1", owner: "dashboard" } },
      actor,
    );

    expect(result.output).toContain("Acknowledged alert");
    expect(prisma.monitoredUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "update_1" },
        data: { status: "acknowledged" },
      }),
    );
  });
});
