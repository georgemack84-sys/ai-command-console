import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const digestSchedulerPath = require.resolve("../../services/digestScheduler.js");
const legacyConsoleCompatPath = require.resolve("../../services/legacyConsoleCompat.js");
const workspaceDocumentsPath = require.resolve("../../services/workspaceDocuments.js");
const digestSchedulerStatePath = require.resolve("../../services/digestSchedulerState.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-digest-scheduler-"));
}

function loadDigestScheduler(tempRoot: string, options?: {
  users?: Array<Record<string, unknown>>;
  queueLegacyDueDigestSweepIfNeeded?: (workspaceId: string, actor: Record<string, unknown>) => { id: string } | null;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };

  const originalScheduler = require.cache[digestSchedulerPath];
  const originalCompat = require.cache[legacyConsoleCompatPath];
  const originalWorkspaceDocs = require.cache[workspaceDocumentsPath];

  require.cache[legacyConsoleCompatPath] = {
    id: legacyConsoleCompatPath,
    filename: legacyConsoleCompatPath,
    loaded: true,
    exports: {
      queueLegacyDueDigestSweepIfNeeded:
        options?.queueLegacyDueDigestSweepIfNeeded ||
        ((workspaceId: string) => ({ id: `job_${workspaceId}` })),
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
      if (originalCompat) require.cache[legacyConsoleCompatPath] = originalCompat;
      else delete require.cache[legacyConsoleCompatPath];
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
    const queueLegacyDueDigestSweepIfNeeded = vi.fn((workspaceId: string) => ({ id: `job_${workspaceId}` }));
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [
        { id: "u1", workspaceId: "alpha", status: "active" },
        { id: "u2", workspaceId: "alpha", status: "active" },
        { id: "u3", workspaceId: "beta", status: "active" },
        { id: "u4", workspaceId: "gamma", status: "disabled" },
      ],
      queueLegacyDueDigestSweepIfNeeded,
    });

    try {
      const result = await digestScheduler.runDigestSchedulerSweep();

      expect(result).toEqual({
        ok: true,
        workspaceCount: 2,
        queuedJobCount: 2,
        queuedJobIds: ["job_alpha", "job_beta"],
      });
      expect(queueLegacyDueDigestSweepIfNeeded).toHaveBeenCalledTimes(2);
      expect(digestSchedulerState.getDigestSchedulerStatus().lastResult).toEqual(result);
    } finally {
      restore();
    }
  });

  it("records failures into digest scheduler state", async () => {
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [{ id: "u1", workspaceId: "alpha", status: "active" }],
      queueLegacyDueDigestSweepIfNeeded: () => {
        throw new Error("queue unavailable");
      },
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

  it("enforces the minimum interval and stops cleanly", async () => {
    const queueLegacyDueDigestSweepIfNeeded = vi.fn((workspaceId: string) => ({ id: `job_${workspaceId}` }));
    const { digestScheduler, digestSchedulerState, restore } = loadDigestScheduler(tempRoot, {
      users: [{ id: "u1", workspaceId: "alpha", status: "active" }],
      queueLegacyDueDigestSweepIfNeeded,
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
      expect(queueLegacyDueDigestSweepIfNeeded).toHaveBeenCalledTimes(1);
      expect(digestSchedulerState.getDigestSchedulerStatus().lastRunAt).toBeTruthy();

      digestScheduler.stopDigestScheduler();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(queueLegacyDueDigestSweepIfNeeded).toHaveBeenCalledTimes(1);
      expect(digestSchedulerState.getDigestSchedulerStatus().enabled).toBe(false);
    } finally {
      restore();
    }
  });
});
