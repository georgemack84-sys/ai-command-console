import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    alert: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { createAlert, listAlerts, markAlertRead, markAllAlertsRead } from "@/src/server/alerts/alert-service";
import { AppError } from "@/src/server/api/errors";

describe("alert service", () => {
  it("creates alerts", async () => {
    vi.mocked(prisma.alert.create).mockResolvedValue({ id: "alert_1" } as never);
    const alert = await createAlert({
      workspaceId: "workspace",
      type: "source.refresh",
      title: "New updates",
      message: "2 updates",
    });
    expect(alert).toEqual(expect.objectContaining({ id: "alert_1" }));
  });

  it("lists alerts", async () => {
    vi.mocked(prisma.alert.findMany).mockResolvedValue([{ id: "alert_1" }] as never);
    const alerts = await listAlerts("workspace", "user", 10);
    expect(alerts).toHaveLength(1);
  });

  it("prevents reading alerts from another user", async () => {
    vi.mocked(prisma.alert.findUnique).mockResolvedValue({ id: "alert_1", workspaceId: "workspace", userId: "other" } as never);
    await expect(markAlertRead("alert_1", "user", "workspace")).rejects.toBeInstanceOf(AppError);
  });

  it("marks all alerts read", async () => {
    vi.mocked(prisma.alert.updateMany).mockResolvedValue({ count: 2 } as never);
    const result = await markAllAlertsRead("workspace", "user");
    expect(result).toEqual(expect.objectContaining({ count: 2 }));
  });
});
