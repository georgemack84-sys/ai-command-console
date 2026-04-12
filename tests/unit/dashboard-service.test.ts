import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    workspace: { findUniqueOrThrow: vi.fn() },
    monitoredUpdate: { findMany: vi.fn(), findFirst: vi.fn() },
    insight: { findMany: vi.fn() },
    activityEvent: { findMany: vi.fn() },
    source: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { buildDashboardSnapshot } from "@/src/server/services/dashboard-service";

describe("dashboard service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes the critical signals behind the summary card", async () => {
    vi.mocked(prisma.workspace.findUniqueOrThrow).mockResolvedValue({
      id: "workspace_1",
      name: "Pulse Workspace",
      description: "Ops workspace",
      plan: "scale",
      members: [{ id: "member_1" }, { id: "member_2" }],
    } as never);

    vi.mocked(prisma.monitoredUpdate.findMany).mockResolvedValue([
      {
        id: "update_critical",
        title: "Queue is failing over",
        summary: "Immediate operator review is needed.",
        severity: "critical",
        category: "Operations",
        status: "needs-review",
        happenedAt: new Date("2026-04-06T04:00:00.000Z"),
        source: { name: "Incident Feed" },
      },
      {
        id: "update_high",
        title: "Release approval is blocked",
        summary: "A single approver is holding the lane.",
        severity: "high",
        category: "Delivery",
        status: "attention",
        happenedAt: new Date("2026-04-06T03:30:00.000Z"),
        source: { name: "Engineering Delivery" },
      },
      {
        id: "update_low",
        title: "FYI",
        summary: "Low-severity update.",
        severity: "low",
        category: "Noise",
        status: "tracked",
        happenedAt: new Date("2026-04-06T03:00:00.000Z"),
        source: { name: "Feed" },
      },
    ] as never);

    vi.mocked(prisma.insight.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.activityEvent.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.source.findMany).mockResolvedValue([
      {
        id: "source_1",
        name: "Incident Feed",
        status: "healthy",
        type: "integration",
        updateCadence: "Every 5 minutes",
        description: "Ops signals",
        updatedAt: new Date("2026-04-06T04:00:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.monitoredUpdate.findFirst).mockResolvedValue({
      id: "update_critical",
      title: "Queue is failing over",
      category: "Operations",
      severity: "critical",
    } as never);

    const snapshot = await buildDashboardSnapshot("workspace_1");

    expect(snapshot.summaryCards.find((item) => item.label === "Critical Signals")?.value).toBe("2");
    expect(snapshot.criticalSignals).toEqual([
      expect.objectContaining({
        id: "update_critical",
        severity: "critical",
        sourceName: "Incident Feed",
      }),
      expect.objectContaining({
        id: "update_high",
        severity: "high",
        sourceName: "Engineering Delivery",
      }),
    ]);
  });
});
