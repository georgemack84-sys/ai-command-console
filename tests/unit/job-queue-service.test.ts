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

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-jobs-"));
}

function loadJobQueue(tempRoot: string) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
  fs.mkdirSync(path.join(tempRoot, "agents"), { recursive: true });
  delete require.cache[jobQueuePath];
  delete require.cache[jobQueueStorePath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];

  const jobQueue = require("../../services/jobQueue.js");
  const jobStore = require("../../services/jobQueueStore.js");
  const stateDatabase = require("../../services/stateDatabase.js");

  return {
    jobQueue,
    jobStore,
    stateDatabase,
    restore() {
      jobStore.closeJobStore();
      stateDatabase.closeDatabase();
      delete require.cache[jobQueuePath];
      delete require.cache[jobQueueStorePath];
      delete require.cache[stateDatabasePath];
      delete require.cache[runtimePathsPath];
    },
  };
}

describe("job queue service", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = createTempRoot();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("raises saturation errors when pending or running capacity is exhausted", () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({
        executionMode: "external",
        maxPendingJobs: 1,
        maxRunningJobs: 1,
      });

      jobQueue.enqueueJob("watcher:run", {}, { actorId: "alex", actorName: "Alex" });

      expect(() => jobQueue.enqueueJob("watcher:run", {}, { actorId: "jamie", actorName: "Jamie" })).toThrowError(
        expect.objectContaining({
          code: "job_queue_saturated",
        }),
      );
    } finally {
      restore();
    }
  });

  it("marks jobs failed when no processor is registered and records an event trail", async () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      const queued = jobQueue.enqueueJob("plugin:missing", {}, { actorId: "alex", actorName: "Alex" });

      await jobQueue.runPendingJobs();

      const failed = jobQueue.getJob(queued.id, { full: true });
      expect(failed.status).toBe("failed");
      expect(failed.error).toMatch(/No processor registered/);
      expect(failed.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Job queued." }),
          expect.objectContaining({ message: expect.stringMatching(/No processor registered/) }),
        ]),
      );
    } finally {
      restore();
    }
  });

  it("recovers stale running jobs into scheduled retries", () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      const queued = jobQueue.enqueueJob("watcher:run", {}, { actorId: "alex", actorName: "Alex", retryDelayMs: 500 });

      jobQueue.updateJob(queued.id, (current: Record<string, unknown>) => ({
        ...current,
        status: "running",
        attempts: 1,
        maxAttempts: 3,
        startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
        leaseExpiresAt: new Date(Date.now() - 1000).toISOString(),
        workerId: "worker_stale",
      }));

      const changed = jobQueue.recoverStaleJobs();
      const recovered = jobQueue.getJob(queued.id, { full: true });

      expect(changed).toBe(true);
      expect(recovered.status).toBe("scheduled_retry");
      expect(recovered.error).toMatch(/Recovered a stale running job/);
      expect(recovered.nextRetryAt).toBeTruthy();
      expect(recovered.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: "warning",
            message: expect.stringMatching(/Recovered a stale running job/),
          }),
        ]),
      );
    } finally {
      restore();
    }
  });

  it("runs processors to completion and updates health and metrics", async () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      jobQueue.registerJobProcessor("test:success", async (job: { log: (message: string, meta?: Record<string, unknown>) => void }) => {
        job.log("processor started", { phase: "start" });
        return { ok: true, summary: "done" };
      });

      const queued = jobQueue.enqueueJob("test:success", {}, { actorId: "alex", actorName: "Alex" });
      await jobQueue.runPendingJobs();

      const completed = jobQueue.getJob(queued.id, { full: true });
      const health = jobQueue.buildQueueHealth();
      const metrics = jobQueue.buildJobMetrics();

      expect(completed.status).toBe("completed");
      expect(completed.result).toEqual({ ok: true, summary: "done" });
      expect(completed.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "Job execution started." }),
          expect.objectContaining({ message: "processor started" }),
          expect.objectContaining({ message: "Job completed successfully." }),
        ]),
      );
      expect(health.saturated).toBe(false);
      expect(metrics.completionRate).toBe(100);
    } finally {
      restore();
    }
  });

  it("fails closed before a protected processor runs without admission evidence", async () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      const processor = vi.fn();
      jobQueue.registerJobProcessor("test:protected", processor, {
        requiresAdmission: true,
        admissionContract: "typed_background_job_v1",
      });
      const queued = jobQueue.enqueueJob(
        "test:protected",
        { workspaceId: "workspace_1" },
        { actorId: "operator_1" },
      );

      await jobQueue.runPendingJobs();

      const failed = jobQueue.getJob(queued.id, { full: true });
      expect(processor).not.toHaveBeenCalled();
      expect(failed).toEqual(expect.objectContaining({ status: "failed", attempts: 0 }));
      expect(failed.error).toMatch(/processor admission denied/i);
      expect(failed.events).toEqual(expect.arrayContaining([
        expect.objectContaining({
          message: "Job processor admission denied.",
          meta: expect.objectContaining({ code: "job_processor_admission_denied" }),
        }),
      ]));
    } finally {
      restore();
    }
  });

  it("runs a protected processor only when persisted admission matches type, workspace, and actor", async () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      const processor = vi.fn().mockResolvedValue({ ok: true });
      jobQueue.registerJobProcessor("test:protected", processor, {
        requiresAdmission: true,
        admissionContract: "typed_background_job_v1",
      });
      const admission = {
        contract: "typed_background_job_v1",
        status: "approved",
        jobType: "test:protected",
        workspaceId: "workspace_1",
        actorId: "operator_1",
        source: "test",
        admittedAt: "2026-10-09T00:00:00.000Z",
      };
      const queued = jobQueue.enqueueJob(
        "test:protected",
        { workspaceId: "workspace_1" },
        { actorId: "operator_1", admission },
      );

      await jobQueue.runPendingJobs();

      const completed = jobQueue.getJob(queued.id, { full: true });
      expect(processor).toHaveBeenCalledOnce();
      expect(completed).toEqual(expect.objectContaining({ status: "completed", admission }));
    } finally {
      restore();
    }
  });

  it("rejects protected processor admission when its workspace does not match the queued payload", async () => {
    const { jobQueue, restore } = loadJobQueue(tempRoot);

    try {
      jobQueue.configureJobQueue({ executionMode: "external" });
      const processor = vi.fn();
      jobQueue.registerJobProcessor("test:protected", processor, {
        requiresAdmission: true,
        admissionContract: "typed_background_job_v1",
      });
      const queued = jobQueue.enqueueJob(
        "test:protected",
        { workspaceId: "workspace_1" },
        {
          actorId: "operator_1",
          admission: {
            contract: "typed_background_job_v1",
            status: "approved",
            jobType: "test:protected",
            workspaceId: "workspace_2",
            actorId: "operator_1",
            source: "test",
            admittedAt: "2026-10-09T00:00:00.000Z",
          },
        },
      );

      await jobQueue.runPendingJobs();

      const failed = jobQueue.getJob(queued.id, { full: true });
      expect(processor).not.toHaveBeenCalled();
      expect(failed).toEqual(expect.objectContaining({ status: "failed", attempts: 0 }));
      expect(failed.error).toMatch(/workspace does not match/i);
    } finally {
      restore();
    }
  });
});
