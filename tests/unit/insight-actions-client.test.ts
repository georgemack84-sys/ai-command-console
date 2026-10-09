import { afterEach, describe, expect, it, vi } from "vitest";
import { postInsightGenerationAction } from "@/src/lib/client/insight-actions";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("insight generation actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries the same mode only after explicit confirmation", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        data: { action: "generate-queued", output: "Confirmation required.", requiresConfirmation: true },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { job: { id: "job_1" } } }, 202));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await postInsightGenerationAction<{ job: { id: string } }>({ async: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ async: true, confirmed: false });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({ async: true, confirmed: true });
    expect(result).toEqual({ job: { id: "job_1" } });
  });

  it("does not retry after declined confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      data: { action: "generate-direct", output: "Confirmation required.", requiresConfirmation: true },
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await expect(postInsightGenerationAction({ async: false })).rejects.toThrow(
      "Insight generation cancelled before confirmation.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
