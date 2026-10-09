import { afterEach, describe, expect, it, vi } from "vitest";
import { postDashboardAction } from "@/src/lib/client/dashboard-actions";

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("dashboard actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries confirmation-required dashboard work only after explicit approval", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: {
            action: "alert:acknowledge",
            output: "Control review requires confirmation before execution.",
            requiresConfirmation: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, data: { action: "alert:acknowledge", output: "Acknowledged alert." } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await postDashboardAction("alert:acknowledge", { alertId: "alert_1", owner: "dashboard" });

    expect(window.confirm).toHaveBeenCalledWith("Control review requires confirmation before execution.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result?.output).toBe("Acknowledged alert.");
  });

  it("does not retry when the operator declines confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: {
          action: "workspace:generate-summary",
          output: "Control review requires confirmation before execution.",
          requiresConfirmation: true,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await expect(postDashboardAction("workspace:generate-summary", {})).rejects.toThrow(
      "Dashboard action cancelled before confirmation.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
