import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    monitoredUpdate: {
      findMany: vi.fn(),
    },
    source: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    insight: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/src/server/feature-flags/feature-flag-service", () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/src/server/alerts/alert-service", () => ({
  createAlert: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";

describe("insight service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates insights when new updates were ingested after the latest insight", async () => {
    vi.mocked(prisma.monitoredUpdate.findMany).mockResolvedValue([
      {
        title: "Feed item",
        category: "Ops",
        severity: "medium",
        sourceId: "source_1",
        happenedAt: new Date("2025-12-31T20:00:00Z"),
        createdAt: new Date("2026-01-01T02:00:00Z"),
      },
    ] as never);
    vi.mocked(prisma.source.findMany).mockResolvedValue([{ id: "source_1" }] as never);
    vi.mocked(prisma.insight.findFirst).mockResolvedValue({
      createdAt: new Date("2026-01-01T01:00:00Z"),
    } as never);
    vi.mocked(prisma.insight.create).mockResolvedValue({ id: "insight_1" } as never);

    const insights = await generateWorkspaceInsights("workspace_1");

    expect(prisma.insight.create).toHaveBeenCalledTimes(1);
    expect(insights).toHaveLength(1);
  });

  it("skips insight creation when no new updates arrived since the latest insight", async () => {
    vi.mocked(prisma.monitoredUpdate.findMany).mockResolvedValue([
      {
        title: "Earlier update",
        category: "Ops",
        severity: "medium",
        sourceId: "source_1",
        happenedAt: new Date("2026-01-01T00:00:00Z"),
        createdAt: new Date("2026-01-01T01:00:00Z"),
      },
    ] as never);
    vi.mocked(prisma.source.findMany).mockResolvedValue([{ id: "source_1" }] as never);
    vi.mocked(prisma.insight.findFirst).mockResolvedValue({
      createdAt: new Date("2026-01-01T02:00:00Z"),
    } as never);

    const insights = await generateWorkspaceInsights("workspace_1");

    expect(prisma.insight.create).not.toHaveBeenCalled();
    expect(insights).toEqual([]);
  });
});
