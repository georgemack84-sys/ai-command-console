import { afterEach, describe, expect, it, vi } from "vitest";
import { postJobAction } from "@/src/lib/client/job-actions";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("job actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries confirmation-required work only after explicit approval", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        data: { action: "job:cancel", output: "Confirmation required.", requiresConfirmation: true },
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, data: { job: { id: "job_1", status: "canceled" } } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await postJobAction<{ job: { id: string; status: string } }>({ type: "job:cancel", jobId: "job_1" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: false }));
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(expect.objectContaining({ confirmed: true }));
    expect(result.data?.job.status).toBe("canceled");
  });

  it("does not retry after declined confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      data: { action: "job:retry", output: "Confirmation required.", requiresConfirmation: true },
    }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const result = await postJobAction({ type: "job:retry", jobId: "job_1" });

    expect(result).toEqual(expect.objectContaining({ ok: false, status: 409 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves the accepted status for queued work", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: true, data: { job: { id: "job_1" } } }, 202)));

    const result = await postJobAction<{ job: { id: string } }>({ type: "workspace:generate-insights" });

    expect(result).toEqual(expect.objectContaining({ ok: true, status: 202 }));
  });
});
