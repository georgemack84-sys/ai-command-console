import { afterEach, describe, expect, it, vi } from "vitest";
import { postScheduledSummaryAction } from "@/src/lib/client/scheduled-summary-actions";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("scheduled summary actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries generation only after explicit confirmation", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        data: { action: "run-due", output: "Confirmation required.", requiresConfirmation: true },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { schedules: [], generated: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const input = { views: [], schedules: [], scheduleId: "schedule_1" };

    const result = await postScheduledSummaryAction<{ schedules: unknown[]; generated: unknown[] }>(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result).toEqual(expect.objectContaining({ ok: true, data: { schedules: [], generated: [] } }));
  });

  it("does not retry after declined confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      data: { action: "run-due", output: "Confirmation required.", requiresConfirmation: true },
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const result = await postScheduledSummaryAction({ views: [], schedules: [] });

    expect(result).toEqual(expect.objectContaining({ ok: false, status: 409 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
