import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const digestSchedulerPath = require.resolve("../../services/digestScheduler.js");
const runtimeControlPath = require.resolve("../../services/runtimeControl.js");
const workspaceDocumentsPath = require.resolve("../../services/workspaceDocuments.js");
const digestSchedulerStatePath = require.resolve("../../services/digestSchedulerState.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-digest-scheduler-"));
}

function loadDigestScheduler(tempRoot: string, options?: {
  users?: Array<Record<string, unknown>>;
  executeControlledStructuredPlan?: (plan: Record<string, unknown>, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };

  const originalScheduler = require.cache[digestSchedulerPath];
  const originalRuntimeControl = require.cache[runtimeControlPath];
  const originalWorkspaceDocs = require.cache[workspaceDocumentsPath];

  require.cache[runtimeControlPath] = {
    id: runtimeControlPath,
    filename: runtimeControlPath,
    loaded: true,
    exports: {
      executeControlledStructuredPlan:
        options?.executeControlledStructuredPlan ||
        (async (plan: Record<string, unknown>) => ({
          ok: true,
          result: { queued: true, jobId: `job_${(plan.meta as { workspaceId?: string })?.workspaceId}` },
        })),
    },
  };
  require.cache[workspaceDocumentsPath] = {
    id: workspaceDocumentsPath,
    filename: workspaceDocumentsPath,
    loaded: true,
    exports: {
      loadWorkspaceDocument: () => options?.users || [],
    },
  };

  delete require.cache[digestSchedulerPath];
  delete require.cache[digestSchedulerStatePath];
  delete require.cache[runtimePathsPath];

  const digestScheduler = require("../../services/digestScheduler.js");
  const digestSchedulerState = require("../../services/digestSchedulerState.js");

  return {
    digestScheduler,
    digestSchedulerState,
    restore() {
      digestScheduler.stopDigestScheduler();
      delete require.cache[digestSchedulerPath];
      delete require.cache[digestSchedulerStatePath];
      delete require.cache[runtimePathsPath];
      if (originalScheduler) require.cache[digestSchedulerPath] = originalScheduler;
      else delete require.cache[digestSchedulerPath];
      if (originalRuntimeControl) require.cache[runtimeControlPath] = originalRuntimeControl;
      else delete require.cache[runtimeControlPath];
      if (originalWorkspaceDocs) require.cache[workspaceDocumentsPath] = originalWorkspaceDocs;
      else delete require.cache[workspaceDocumentsPath];
    },
  };
}

describe("digest scheduler service", () => {
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

  it("queues at most one job per active workspace during a sweep", async () => {
    const executeControlledStructuredPlan = vi.fn(async (plan: Record<string, unknown>) => ({
      ok: true,
      result: { queued: true, jobId: `job_${(plan.meta as { workspaceId?: string }).workspaceId}` },
    }));
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [
        { id: "u1", workspaceId: "alpha", status: "active" },
        { id: "u2", workspaceId: "alpha", status: "active" },
        { id: "u3", workspaceId: "beta", status: "active" },
        { id: "u4", workspaceId: "gamma", status: "disabled" },
      ],
      executeControlledStructuredPlan,
    });

    try {
      const result = await digestScheduler.runDigestSchedulerSweep();

      expect(result).toEqual({
        ok: true,
        workspaceCount: 2,
        queuedJobCount: 2,
        queuedJobIds: ["job_alpha", "job_beta"],
      });
      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(2);
      expect(executeControlledStructuredPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "collaboration:digest-run-due",
          source: "digest_scheduler",
          meta: expect.objectContaining({
            userId: "system:digest-scheduler",
            workspaceId: "alpha",
            userRole: "system",
          }),
        }),
        expect.objectContaining({
          actor: expect.objectContaining({ id: "system:digest-scheduler", workspaceId: "alpha" }),
          identitySource: "system",
          modes: { confirmed: true },
        }),
      );
      expect(digestSchedulerState.getDigestSchedulerStatus().lastResult).toEqual(result);
    } finally {
      restore();
    }
  });

  it("records failures into digest scheduler state", async () => {
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [{ id: "u1", workspaceId: "alpha", status: "active" }],
      executeControlledStructuredPlan: async () => ({ ok: false, error: "queue unavailable" }),
    });

    try {
      await expect(digestScheduler.runDigestSchedulerSweep()).rejects.toThrow("queue unavailable");
      expect(digestSchedulerState.getDigestSchedulerStatus()).toEqual(
        expect.objectContaining({
          lastError: "queue unavailable",
          lastResult: {
            ok: false,
            error: "queue unavailable",
          },
        }),
      );
    } finally {
      restore();
    }
  });

  it("coalesces overlapping sweeps into one governed execution", async () => {
    let resolveExecution: ((value: Record<string, unknown>) => void) | null = null;
    const executeControlledStructuredPlan = vi.fn(() => new Promise<Record<string, unknown>>((resolve) => {
      resolveExecution = resolve;
    }));
    const { digestScheduler, restore } = loadDigestScheduler(tempRoot, {
      users: [{ id: "u1", workspaceId: "alpha", status: "active" }],
      executeControlledStructuredPlan,
    });

    try {
      const first = digestScheduler.runDigestSchedulerSweep();
      const second = digestScheduler.runDigestSchedulerSweep();

      expect(second).toBe(first);
      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(1);
      resolveExecution?.({ ok: true, result: { queued: true, jobId: "job_alpha" } });
      await expect(first).resolves.toEqual(expect.objectContaining({ queuedJobIds: ["job_alpha"] }));
    } finally {
      restore();
    }
  });

  it("enforces the minimum interval and stops cleanly", async () => {
    const executeControlledStructuredPlan = vi.fn(async (plan: Record<string, unknown>) => ({
      ok: true,
      result: { queued: true, jobId: `job_${(plan.meta as { workspaceId?: string }).workspaceId}` },
    }));
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [{ id: "u1", workspaceId: "alpha", status: "active" }],
      executeControlledStructuredPlan,
    });

    try {
      digestScheduler.ensureDigestScheduler(1000);
      expect(digestSchedulerState.getDigestSchedulerStatus()).toEqual(
        expect.objectContaining({
          enabled: true,
          intervalMs: 10_000,
        }),
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(1);
      expect(digestSchedulerState.getDigestSchedulerStatus().lastRunAt).toBeTruthy();

      digestScheduler.stopDigestScheduler();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(1);
      expect(digestSchedulerState.getDigestSchedulerStatus().enabled).toBe(false);
    } finally {
      restore();
    }
  });
});
