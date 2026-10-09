import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const { createLegacyJobProcessorBootstrap } = require("../../services/legacyJobProcessorBootstrap.js");
type JobProcessor = (job: { payload?: Record<string, unknown> }) => Promise<unknown> | unknown;

function createDeps(overrides: Record<string, unknown> = {}) {
  return {
    initializeExecutionOrchestration: vi.fn(),
    registerJobProcessor: vi.fn(),
    admissionContract: "legacy-background-job-v1",
    evaluateRules: vi.fn(() => ({ matched: 1 })),
    runAlertChecks: vi.fn(() => ({ checked: 1 })),
    runPlugin: vi.fn(() => ({ ok: true })),
    queueBriefToTaskFor: vi.fn(() => ({ ok: true })),
    createReportDraft: vi.fn(() => ({ id: "report_1" })),
    publishReportRecordFor: vi.fn(() => ({ ok: true })),
    runDueDigestsForWorkspace: vi.fn(() => ({ ok: true })),
    getLegacyDigestDeps: vi.fn(() => ({ digest: true })),
    updateDigestWorkspaceState: vi.fn(),
    ...overrides,
  };
}

describe("legacy job processor bootstrap", () => {
  it("registers legacy processors with reviewed durable-admission requirements once", () => {
    const deps = createDeps();
    const ensureRegistered = createLegacyJobProcessorBootstrap(deps);

    ensureRegistered();
    ensureRegistered();

    expect(deps.initializeExecutionOrchestration).toHaveBeenCalledTimes(1);
    expect(deps.initializeExecutionOrchestration).toHaveBeenCalledWith({ bootstrap: "in_process_console" });
    expect(deps.registerJobProcessor).toHaveBeenCalledTimes(7);
    expect(deps.registerJobProcessor.mock.calls.map(([type]: [string]) => type)).toEqual([
      "watcher:run",
      "alerts:run",
      "plugin:run",
      "brief:route",
      "report:create",
      "report:publish",
      "digest:run-due",
    ]);
    for (const [, , options] of deps.registerJobProcessor.mock.calls) {
      expect(options).toEqual({
        requiresAdmission: true,
        requiresReviewedExecution: true,
        admissionContract: "legacy-background-job-v1",
      });
    }
  });

  it("preserves compatibility processor payloads and records failed digest sweeps", async () => {
    const digestError = new Error("digest unavailable");
    const deps = createDeps({ runDueDigestsForWorkspace: vi.fn(() => { throw digestError; }) });
    const ensureRegistered = createLegacyJobProcessorBootstrap(deps);
    ensureRegistered();

    const processors = new Map<string, JobProcessor>(
      deps.registerJobProcessor.mock.calls.map(([type, processor]: [string, JobProcessor]) => [type, processor]),
    );
    await expect(processors.get("plugin:run")!({ payload: { name: "sample", pluginArg: "--safe" } })).resolves.toEqual({ ok: true });
    expect(deps.runPlugin).toHaveBeenCalledWith("sample", { input: "run plugin sample", pluginArg: "--safe" });
    await expect(processors.get("digest:run-due")!({ payload: { workspace: "alpha" } })).rejects.toThrow("digest unavailable");
    expect(deps.updateDigestWorkspaceState).toHaveBeenCalledWith("alpha", expect.objectContaining({ lastSweepError: "digest unavailable" }));
  });
});
