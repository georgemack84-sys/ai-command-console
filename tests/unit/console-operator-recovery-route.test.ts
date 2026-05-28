import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/app/api/console/operator-recovery/core", () => ({
  getTerminalOperatorRecoverySurface: vi.fn(),
  previewTerminalOperatorRecoveryAction: vi.fn(),
  applyTerminalOperatorRecoveryAction: vi.fn(),
}));

import { GET, POST } from "@/app/api/console/operator-recovery/route";
import { getSessionUser } from "@/src/lib/auth";
import {
  getTerminalOperatorRecoverySurface,
  previewTerminalOperatorRecoveryAction,
  applyTerminalOperatorRecoveryAction,
} from "@/app/api/console/operator-recovery/core";

describe("console operator recovery route", () => {
  const user = {
    id: "user_1",
    email: "operator@example.com",
    name: "Operator",
    role: "admin",
    status: "active",
    workspaceId: "workspace_1",
    workspaceName: "Pulse Workspace",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns operator recovery surface for authenticated users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(getTerminalOperatorRecoverySurface).mockResolvedValue({
      ok: true,
      data: { planId: "plan_1", status: "paused" },
      overview: {},
    } as never);

    const response = await GET(new Request("http://localhost/api/console/operator-recovery?planId=plan_1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(getTerminalOperatorRecoverySurface).toHaveBeenCalledWith("plan_1", expect.objectContaining({ id: "user_1" }));
  });

  it("previews operator recovery actions through the route", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(previewTerminalOperatorRecoveryAction).mockResolvedValue({
      ok: true,
      data: { planId: "plan_1", action: "approve_resume", preview: { willWrite: false } },
      overview: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/console/operator-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "plan_1",
          action: "approve_resume",
          preview: true,
          payload: { idempotencyKey: "preview_key_1" },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(previewTerminalOperatorRecoveryAction).toHaveBeenCalledWith(
      "plan_1",
      "approve_resume",
      { idempotencyKey: "preview_key_1" },
      expect.objectContaining({ id: "user_1" }),
    );
  });

  it("applies operator recovery actions through the route", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(applyTerminalOperatorRecoveryAction).mockResolvedValue({
      ok: true,
      data: { planId: "plan_1", action: "cancel_execution" },
      overview: {},
    } as never);

    const response = await POST(
      new Request("http://localhost/api/console/operator-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "plan_1",
          action: "cancel_execution",
          payload: { idempotencyKey: "apply_key_1", reason: "stop safely" },
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(applyTerminalOperatorRecoveryAction).toHaveBeenCalledWith(
      "plan_1",
      "cancel_execution",
      { idempotencyKey: "apply_key_1", reason: "stop safely" },
      expect.objectContaining({ id: "user_1" }),
    );
  });

  it("rejects anonymous requests", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/console/operator-recovery?planId=plan_1"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
