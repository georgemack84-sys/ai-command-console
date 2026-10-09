import { afterEach, describe, expect, it, vi } from "vitest";
import { mutateResearchBrief } from "@/src/lib/client/research-brief-actions";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("research brief actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries the same mutation only after explicit confirmation", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        data: { action: "route", output: "Confirmation required.", requiresConfirmation: true },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { briefs: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await mutateResearchBrief<{ briefs: unknown[] }>("PATCH", {
      id: "brief_1",
      routeToQueue: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result).toEqual({ briefs: [] });
  });

  it("does not retry a declined mutation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      data: { action: "delete", output: "Confirmation required.", requiresConfirmation: true },
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await expect(mutateResearchBrief("DELETE", { briefId: "brief_1" })).rejects.toThrow(
      "Research brief change cancelled before confirmation.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
