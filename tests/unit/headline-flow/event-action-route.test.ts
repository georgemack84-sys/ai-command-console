import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/headline-flow/event-registry/event-preferences", async () => {
  const actual = await vi.importActual<typeof import("@/src/server/headline-flow/event-registry/event-preferences")>(
    "@/src/server/headline-flow/event-registry/event-preferences",
  );
  return {
    ...actual,
    headlineFlowEventPreferenceRepository: {
      applyAction: vi.fn(),
    },
  };
});

import { POST } from "@/app/api/headline-flow/events/[eventId]/action/route";
import { getSessionUser } from "@/src/lib/auth";
import { headlineFlowEventPreferenceRepository } from "@/src/server/headline-flow/event-registry/event-preferences";

function mockAuthenticatedUser() {
  vi.mocked(getSessionUser).mockResolvedValue({
    id: "user_1",
    email: "operator@example.com",
    name: "Operator",
    role: "admin",
    status: "active",
    workspaceId: "workspace_1",
    workspaceName: "Pulse Workspace",
  });
}

describe("headline flow event action route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists event actions for authenticated users", async () => {
    mockAuthenticatedUser();
    vi.mocked(headlineFlowEventPreferenceRepository.applyAction).mockResolvedValue({
      id: "preference_1",
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "hfe_demo",
      savedAt: "2026-08-29T12:00:00.000Z",
      mutedAt: null,
      resolvedAt: null,
      restoredAt: null,
      createdAt: "2026-08-29T12:00:00.000Z",
      updatedAt: "2026-08-29T12:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/headline-flow/events/hfe_demo/action", {
        method: "POST",
        body: JSON.stringify({ action: "save" }),
      }),
      { params: Promise.resolve({ eventId: "hfe_demo" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(headlineFlowEventPreferenceRepository.applyAction).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      userId: "user_1",
      eventId: "hfe_demo",
      action: "save",
    });
    expect(payload.data.preference).toEqual({
      saved: true,
      muted: false,
      resolved: false,
    });
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/headline-flow/events/hfe_demo/action", {
        method: "POST",
        body: JSON.stringify({ action: "save" }),
      }),
      { params: Promise.resolve({ eventId: "hfe_demo" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });

  it("validates action payloads", async () => {
    mockAuthenticatedUser();

    const response = await POST(
      new Request("http://localhost/api/headline-flow/events/hfe_demo/action", {
        method: "POST",
        body: JSON.stringify({ action: "archive" }),
      }),
      { params: Promise.resolve({ eventId: "hfe_demo" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("validation_error");
  });
});
