import { afterEach, describe, expect, it, vi } from "vitest";
import { postResearchAction } from "@/src/lib/client/research-actions";

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("research actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries confirmation-required research work only after explicit approval", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: {
            action: "report:publish",
            output: "Control review requires confirmation before execution.",
            requiresConfirmation: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, data: { action: "report:publish", output: "Published report." } }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await postResearchAction("report:publish", { reportId: "report_1" });

    expect(window.confirm).toHaveBeenCalledWith("Control review requires confirmation before execution.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result?.output).toBe("Published report.");
  });

  it("does not retry when the operator declines confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: {
          action: "report:publish",
          output: "Control review requires confirmation before execution.",
          requiresConfirmation: true,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await expect(postResearchAction("report:publish", { reportId: "report_1" })).rejects.toThrow(
      "Research action cancelled before confirmation.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
