import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  runJobAction,
  runWatcherAction,
} = require("../../services/legacyConsoleCoreOperationsSupport.js");

describe("legacy console core operations support", () => {
  it("handles queued job actions and detail lookups", () => {
    const enqueueJob = vi.fn()
      .mockReturnValueOnce({ id: "job_plugin" })
      .mockReturnValueOnce({ id: "job_brief" })
      .mockReturnValueOnce({ id: "job_report" })
      .mockReturnValueOnce({ id: "job_publish" });

    const plugin = runJobAction("plugin:run", { name: "hello", pluginArg: "--dry-run" }, "alpha", { id: "user_1" }, {
      enqueueJob,
      cancelJob: vi.fn(),
      retryJob: vi.fn(),
      getJob: vi.fn(),
    });
    expect(plugin).toEqual(
      expect.objectContaining({
        ok: true,
        output: "Queued plugin hello as job_plugin.",
      }),
    );

    const brief = runJobAction("brief:route", { briefId: "brief_1" }, "alpha", { id: "user_1" }, {
      enqueueJob,
      cancelJob: vi.fn(),
      retryJob: vi.fn(),
      getJob: vi.fn(),
    });
    expect(brief?.output).toBe("Queued brief routing as job_brief.");

    const report = runJobAction("report:create", { briefId: "brief_1", title: "Draft" }, "alpha", { id: "user_1" }, {
      enqueueJob,
      cancelJob: vi.fn(),
      retryJob: vi.fn(),
      getJob: vi.fn(),
    });
    expect(report?.output).toBe("Queued report draft creation as job_report.");

    const publish = runJobAction("report:publish", { reportId: "report_1" }, "alpha", { id: "user_1" }, {
      enqueueJob,
      cancelJob: vi.fn(),
      retryJob: vi.fn(),
      getJob: vi.fn(),
    });
    expect(publish?.output).toBe("Queued report publish as job_publish.");
  });

  it("handles cancel, retry, and job detail responses", () => {
    const cancelJob = vi.fn(() => ({ id: "job_1", status: "canceled" }));
    const retryJob = vi.fn(() => ({ id: "job_2", status: "queued" }));
    const getJob = vi.fn(() => ({ id: "job_3", status: "completed" }));

    expect(
      runJobAction("job:cancel", { jobId: "job_1" }, "alpha", { id: "user_1" }, {
        enqueueJob: vi.fn(),
        cancelJob,
        retryJob,
        getJob,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Canceled job job_1." }));

    expect(
      runJobAction("job:retry", { jobId: "job_2" }, "alpha", { id: "user_1" }, {
        enqueueJob: vi.fn(),
        cancelJob,
        retryJob,
        getJob,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Retried job job_2." }));

    expect(
      runJobAction("job:detail", { jobId: "job_3" }, "alpha", { id: "user_1" }, {
        enqueueJob: vi.fn(),
        cancelJob,
        retryJob,
        getJob,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        detail: { job: { id: "job_3", status: "completed" } },
      }),
    );
  });

  it("handles watcher start, stop, and rule mutations", () => {
    const startWatcher = vi.fn(() => ({ intervalSeconds: 7 }));
    const stopWatcher = vi.fn();
    const getWatcherStatus = vi.fn(() => ({ rules: [{ name: "cpu_spike" }] }));
    const updateWatcherRule = vi.fn(() => ({ name: "cpu_spike", threshold: 90 }));
    const addWatcherRule = vi.fn(() => ({ name: "new_rule", threshold: 70 }));
    const removeWatcherRule = vi.fn(() => true);

    expect(
      runWatcherAction("watcher:start", { intervalSeconds: 7 }, {
        startWatcher,
        stopWatcher,
        getWatcherStatus,
        updateWatcherRule,
        addWatcherRule,
        removeWatcherRule,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Watcher started at 7s interval." }));

    expect(
      runWatcherAction("watcher:stop", { reason: "manual" }, {
        startWatcher,
        stopWatcher,
        getWatcherStatus,
        updateWatcherRule,
        addWatcherRule,
        removeWatcherRule,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Watcher stopped." }));
    expect(stopWatcher).toHaveBeenCalledWith("manual");

    expect(
      runWatcherAction("watcher:rule-upsert", { name: "cpu_spike", threshold: 90 }, {
        startWatcher,
        stopWatcher,
        getWatcherStatus,
        updateWatcherRule,
        addWatcherRule,
        removeWatcherRule,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Saved watcher rule cpu_spike." }));
    expect(updateWatcherRule).toHaveBeenCalledWith("cpu_spike", { name: "cpu_spike", threshold: 90 });

    getWatcherStatus.mockReturnValueOnce({ rules: [] });
    expect(
      runWatcherAction("watcher:rule-upsert", { name: "new_rule", threshold: 70 }, {
        startWatcher,
        stopWatcher,
        getWatcherStatus,
        updateWatcherRule,
        addWatcherRule,
        removeWatcherRule,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Saved watcher rule new_rule." }));
    expect(addWatcherRule).toHaveBeenCalledWith({ name: "new_rule", threshold: 70 });

    expect(
      runWatcherAction("watcher:rule-delete", { name: "cpu_spike" }, {
        startWatcher,
        stopWatcher,
        getWatcherStatus,
        updateWatcherRule,
        addWatcherRule,
        removeWatcherRule,
      }),
    ).toEqual(expect.objectContaining({ ok: true, output: "Removed watcher rule cpu_spike." }));
  });
});
