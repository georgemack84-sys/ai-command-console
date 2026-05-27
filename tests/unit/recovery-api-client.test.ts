import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportEvidence,
  fetchEvidence,
  fetchOperatorView,
} from "@/lib/recovery/recoveryApiClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recovery API client", () => {
  it("fetchEvidence works", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: { executionId: "exec_ui", state: "normal" },
      }),
    });

    await expect(fetchEvidence("exec_ui")).resolves.toEqual({
      executionId: "exec_ui",
      state: "normal",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/recovery/exec_ui/evidence", { cache: "no-store" });
  });

  it("exportEvidence works", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: "# Recovery Evidence Report",
      }),
    });

    await expect(exportEvidence("exec_ui", "markdown")).resolves.toBe("# Recovery Evidence Report");
    expect(fetchMock).toHaveBeenCalledWith("/api/recovery/exec_ui/evidence?format=markdown", { cache: "no-store" });
  });

  it("fetchOperatorView works", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: { executionId: "exec_ui", timelineMatchesReadModel: true },
      }),
    });

    await expect(fetchOperatorView("exec_ui")).resolves.toEqual({
      executionId: "exec_ui",
      timelineMatchesReadModel: true,
    });
  });
});

