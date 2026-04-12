import { beforeEach, describe, expect, it, vi } from "vitest";

const queueHealthState = {
  executionMode: "external",
  running: 0,
  activeWorkers: 0,
  queued: 0,
  scheduledRetries: 0,
  staleRunning: 0,
  unhealthy: false,
  pending: 0,
  saturated: false,
  maxPendingJobs: 100,
  maxRunningJobs: 12,
};

const buildQueueHealthMock = vi.fn(() => ({ ...queueHealthState }));

vi.mock("@/src/server/health/database-health", () => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock("@/src/lib/server/runtime", () => ({
  getRuntimePosture: vi.fn(),
}));

vi.mock("node:module", async () => {
  const actual = await vi.importActual<typeof import("node:module")>("node:module");
  return {
    ...actual,
    createRequire: () => () => ({
      buildQueueHealth: buildQueueHealthMock,
      configureJobQueue: vi.fn(),
    }),
  };
});

import { GET as getHealth } from "@/app/api/health/route";
import { GET as getReady } from "@/app/api/ready/route";
import { checkDatabaseHealth } from "@/src/server/health/database-health";
import { getRuntimePosture } from "@/src/lib/server/runtime";

describe("health and readiness routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildQueueHealthMock.mockImplementation(() => ({ ...queueHealthState }));
    Object.assign(queueHealthState, {
      executionMode: "external",
      running: 0,
      activeWorkers: 0,
      queued: 0,
      scheduledRetries: 0,
      staleRunning: 0,
      unhealthy: false,
      pending: 0,
      saturated: false,
      maxPendingJobs: 100,
      maxRunningJobs: 12,
    });
  });

  it("reports degraded health when the database is unavailable", async () => {
    vi.mocked(getRuntimePosture).mockReturnValue({
      environment: "development",
      storageDriver: "json",
      authSecretConfigured: true,
      secureCookies: false,
      sessionMaxAgeSeconds: 120,
      databaseUrlConfigured: true,
      aiSummary: {
        providerMode: "auto",
        model: "gpt-4.1-mini",
        timeoutMs: 8000,
        maxAttempts: 2,
        allowMockFallback: true,
        openAiConfigured: false,
        dailyBudgetUsd: 1,
        estimatedCostPerRunUsd: 0.02,
        evaluationsEnabled: true,
      },
      jobs: {
        executionMode: "in_process",
        workerPollIntervalMs: 2000,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: true,
      },
      process: {
        pid: 1234,
        uptimeSeconds: 120,
        memory: {
          rssMb: 128,
          heapUsedMb: 64,
          heapTotalMb: 96,
          externalMb: 12,
        },
      },
    });
    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      ok: false,
      status: "unavailable",
      details: "Connection refused",
    });

    const response = await getHealth();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("degraded");
    expect(payload.data.checks.database.status).toBe("unavailable");
  });

  it("reports not_ready when the database check fails", async () => {
    vi.mocked(getRuntimePosture).mockReturnValue({
      environment: "development",
      storageDriver: "json",
      authSecretConfigured: true,
      secureCookies: false,
      sessionMaxAgeSeconds: 120,
      databaseUrlConfigured: true,
      aiSummary: {
        providerMode: "auto",
        model: "gpt-4.1-mini",
        timeoutMs: 8000,
        maxAttempts: 2,
        allowMockFallback: true,
        openAiConfigured: false,
        dailyBudgetUsd: 1,
        estimatedCostPerRunUsd: 0.02,
        evaluationsEnabled: true,
      },
      jobs: {
        executionMode: "in_process",
        workerPollIntervalMs: 2000,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: true,
      },
      process: {
        pid: 1234,
        uptimeSeconds: 120,
        memory: {
          rssMb: 128,
          heapUsedMb: 64,
          heapTotalMb: 96,
          externalMb: 12,
        },
      },
    });
    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      ok: false,
      status: "unavailable",
      details: "Connection refused",
    });

    const response = await getReady();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("not_ready");
    expect(payload.data.checks.database.status).toBe("unavailable");
  });

  it("reports ready_with_warnings when only runtime pressure warnings exist", async () => {
    vi.mocked(getRuntimePosture).mockReturnValue({
      environment: "production",
      storageDriver: "sqlite",
      authSecretConfigured: true,
      secureCookies: true,
      sessionMaxAgeSeconds: 120,
      databaseUrlConfigured: true,
      aiSummary: {
        providerMode: "auto",
        model: "gpt-4.1-mini",
        timeoutMs: 8000,
        maxAttempts: 2,
        allowMockFallback: true,
        openAiConfigured: true,
        dailyBudgetUsd: 1,
        estimatedCostPerRunUsd: 0.02,
        evaluationsEnabled: true,
      },
      jobs: {
        executionMode: "in_process",
        workerPollIntervalMs: 2000,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: true,
      },
      process: {
        pid: 1234,
        uptimeSeconds: 120,
        memory: {
          rssMb: 900,
          heapUsedMb: 60,
          heapTotalMb: 100,
          externalMb: 12,
        },
      },
    });
    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      ok: true,
      status: "ok",
      details: null,
    });

    const response = await getReady();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("ready_with_warnings");
    expect(payload.data.warnings[0].code).toBe("jobs_external_worker_recommended");
  });

});
