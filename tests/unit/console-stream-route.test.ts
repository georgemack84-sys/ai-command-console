import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/app/api/console/core", () => ({
  getTerminalOverview: vi.fn(),
  queueTerminalDigestSweep: vi.fn(),
}));

vi.mock("@/services/digestScheduler", () => ({
  ensureDigestScheduler: vi.fn(),
}));

import { GET } from "@/app/api/console/stream/route";
import { getSessionUser } from "@/src/lib/auth";
import { getTerminalOverview, queueTerminalDigestSweep } from "@/app/api/console/core";

describe("console stream route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams resolved overview payloads for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });
    vi.mocked(getTerminalOverview).mockResolvedValue({
      collaboration: {
        governance: {
          currentEnvironment: "production",
        },
      },
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeTruthy();

    const chunk = await reader!.read();
    const text = new TextDecoder().decode(chunk.value);

    expect(queueTerminalDigestSweep).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1", workspaceId: "workspace_1" }),
    );
    expect(text).toContain('"currentEnvironment":"production"');
    expect(text).not.toContain("[object Promise]");
    await reader!.cancel();
  });

  it("rejects anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
