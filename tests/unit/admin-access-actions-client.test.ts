import { afterEach, describe, expect, it, vi } from "vitest";
import { patchAdminAccess } from "@/src/lib/client/admin-access-actions";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("admin access actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries confirmation-required admin work only after explicit approval", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: {
            action: "user-status",
            output: "Control review requires confirmation before execution.",
            requiresConfirmation: true,
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { user: { id: "user_2", status: "disabled" } } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await patchAdminAccess<{ user: { id: string; status: string } }>({
      type: "user-status",
      userId: "user_2",
      status: "disabled",
    });

    expect(window.confirm).toHaveBeenCalledWith("Control review requires confirmation before execution.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result.data?.user.status).toBe("disabled");
  });

  it("returns a cancellation result without retrying when the admin declines", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: {
          action: "governance",
          output: "Control review requires confirmation before execution.",
          requiresConfirmation: true,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const result = await patchAdminAccess({ type: "governance", governance: {} });

    expect(result).toEqual(expect.objectContaining({ ok: false, status: 409 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves successful response status for invite creation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: { invite: { id: "invite_1" } } }, 201)));

    const result = await patchAdminAccess<{ invite: { id: string } }>({
      type: "workspace-invite",
      workspaceId: "workspace_2",
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, status: 201, data: { invite: { id: "invite_1" } } }));
  });
});
