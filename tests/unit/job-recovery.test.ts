import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };
const jobQueuePath = require.resolve("../../services/jobQueue.js");
const jobQueueStorePath = require.resolve("../../services/jobQueueStore.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const modulePaths = [jobQueuePath, jobQueueStorePath, stateDatabasePath, runtimePathsPath];

function loadJobRuntime(tempRoot: string) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
  fs.mkdirSync(path.join(tempRoot, "agents"), { recursive: true });
  modulePaths.forEach((modulePath) => delete require.cache[modulePath]);

  const jobQueue = require("../../services/jobQueue.js");
  const jobStore = require("../../services/jobQueueStore.js");
  const stateDatabase = require("../../services/stateDatabase.js");
  jobQueue.configureJobQueue({ executionMode: "external" });

  return {
    jobQueue,
    close() {
      jobStore.closeJobStore();
      stateDatabase.closeDatabase();
      modulePaths.forEach((modulePath) => delete require.cache[modulePath]);
    },
  };
}

describe("background job restart and partial-failure recovery", () => {
  let tempRoot: string;
  const openRuntimes: Array<{ close: () => void }> = [];

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-job-recovery-"));
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T02:00:00.000Z"));
  });

  afterEach(() => {
    for (const runtime of openRuntimes.splice(0).reverse()) {
      runtime.close();
    }
    vi.useRealTimers();
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  function openRuntime() {
    const runtime = loadJobRuntime(tempRoot);
    openRuntimes.push(runtime);
    return runtime;
  }

  function restartRuntime(runtime: { close: () => void }) {
    runtime.close();
    openRuntimes.splice(openRuntimes.indexOf(runtime), 1);
    return openRuntime();
  }

  it("completes a queued job after a process restart without changing its identity", async () => {
    const first = openRuntime();
    const queued = first.jobQueue.enqueueJob(
      "test:restart-success",
      { reportId: "report_1" },
      { actorId: "operator_1", traceId: "trace_restart_1" },
    );

    const restarted = restartRuntime(first);
    restarted.jobQueue.registerJobProcessor("test:restart-success", async (job: { payload: Record<string, unknown> }) => ({
      ok: true,
      reportId: job.payload.reportId,
    }));
    await restarted.jobQueue.runJobWorkerCycle();

    const completed = restarted.jobQueue.getJob(queued.id, { full: true });
    expect(completed).toEqual(
      expect.objectContaining({
        id: queued.id,
        traceId: "trace_restart_1",
        payload: { reportId: "report_1" },
        status: "completed",
        attempts: 1,
        retryCount: 0,
        result: { ok: true, reportId: "report_1" },
      }),
    );
    expect(restarted.jobQueue.listJobs(20).filter((job: { id: string }) => job.id === queued.id)).toHaveLength(1);
  });

  it("recovers an expired running lease after restart and resumes when the retry window opens", async () => {
    const first = openRuntime();
    const queued = first.jobQueue.enqueueJob(
      "test:lease-recovery",
      { sweep: "alerts" },
      { traceId: "trace_lease_1", maxAttempts: 3, retryDelayMs: 250 },
    );
    first.jobQueue.updateJob(queued.id, (current: Record<string, unknown>) => ({
      ...current,
      status: "running",
      attempts: 1,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
      lastHeartbeatAt: new Date(Date.now() - 30_000).toISOString(),
      leaseExpiresAt: new Date(Date.now() - 1).toISOString(),
      workerId: "worker_before_restart",
    }));

    const restarted = restartRuntime(first);
    restarted.jobQueue.registerJobProcessor("test:lease-recovery", async () => ({ ok: true }));
    expect(restarted.jobQueue.buildQueueHealth()).toEqual(expect.objectContaining({ staleRunning: 1, unhealthy: true }));

    await restarted.jobQueue.runJobWorkerCycle();
    expect(restarted.jobQueue.getJob(queued.id, { full: true })).toEqual(
      expect.objectContaining({
        status: "scheduled_retry",
        attempts: 1,
        error: "Recovered a stale running job after a worker restart.",
      }),
    );

    vi.advanceTimersByTime(250);
    await restarted.jobQueue.runJobWorkerCycle();
    const completed = restarted.jobQueue.getJob(queued.id, { full: true });
    expect(completed).toEqual(
      expect.objectContaining({
        id: queued.id,
        traceId: "trace_lease_1",
        status: "completed",
        attempts: 2,
        retryCount: 1,
        result: { ok: true },
      }),
    );
    expect(completed.events.map((event: { message: string }) => event.message)).toEqual(
      expect.arrayContaining([
        "Recovered a stale running job and scheduled a retry.",
        "Retry window reached. Job moved back to queue.",
        "Job completed successfully.",
      ]),
    );
  });

  it("retains partial-failure evidence and succeeds on the bounded retry", async () => {
    const runtime = openRuntime();
    runtime.jobQueue.registerJobProcessor(
      "test:partial-failure",
      async (job: { log: (message: string, meta?: Record<string, unknown>) => void }) => {
        job.log("Stored the first checkpoint.", { checkpoint: 1 });
        throw new Error("Downstream dependency unavailable");
      },
    );
    const queued = runtime.jobQueue.enqueueJob(
      "test:partial-failure",
      { checkpointKey: "checkpoint_1" },
      { traceId: "trace_partial_1", maxAttempts: 2, retryDelayMs: 100 },
    );

    await runtime.jobQueue.runPendingJobs();
    expect(runtime.jobQueue.getJob(queued.id, { full: true })).toEqual(
      expect.objectContaining({
        status: "scheduled_retry",
        attempts: 1,
        error: "Downstream dependency unavailable",
      }),
    );

    runtime.jobQueue.registerJobProcessor("test:partial-failure", async () => ({ ok: true, resumedFrom: "checkpoint_1" }));
    vi.advanceTimersByTime(100);
    await runtime.jobQueue.runPendingJobs();

    const completed = runtime.jobQueue.getJob(queued.id, { full: true });
    expect(completed).toEqual(
      expect.objectContaining({
        id: queued.id,
        traceId: "trace_partial_1",
        payload: { checkpointKey: "checkpoint_1" },
        status: "completed",
        attempts: 2,
        retryCount: 1,
        result: { ok: true, resumedFrom: "checkpoint_1" },
      }),
    );
    expect(completed.events.map((event: { message: string }) => event.message)).toEqual(
      expect.arrayContaining([
        "Stored the first checkpoint.",
        "Downstream dependency unavailable",
        "Retry window reached. Job moved back to queue.",
        "Job completed successfully.",
      ]),
    );
    expect(runtime.jobQueue.listJobs(20).filter((job: { id: string }) => job.id === queued.id)).toHaveLength(1);
  });
});
