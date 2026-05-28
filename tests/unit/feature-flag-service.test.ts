import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/config/env", () => ({
  featureFlagsEnabled: () => true,
}));

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    featureFlag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    workspaceFeatureFlag: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { ensureDefaultFeatureFlags, isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";

describe("feature flags", () => {
  it("seeds defaults when missing", async () => {
    vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.featureFlag.createMany).mockResolvedValue({ count: 4 } as never);
    vi.mocked(prisma.featureFlag.findMany).mockResolvedValueOnce([] as never).mockResolvedValueOnce([{ key: "alerts_v2" }] as never);
    const flags = await ensureDefaultFeatureFlags();
    expect(flags).toEqual(expect.arrayContaining([expect.objectContaining({ key: "alerts_v2" })]));
  });

  it("returns workspace override when present", async () => {
    vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({ id: "flag1", key: "alerts_v2", enabled: false } as never);
    vi.mocked(prisma.workspaceFeatureFlag.findFirst).mockResolvedValue({ enabled: true } as never);
    const enabled = await isFeatureEnabled("alerts_v2", "workspace");
    expect(enabled).toBe(true);
  });
});
