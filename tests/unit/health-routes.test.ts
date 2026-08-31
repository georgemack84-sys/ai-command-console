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
const getScopeMonitoringHealthMock = vi.hoisted(() => vi.fn(() => ({
  enabled: false,
  status: "disabled" as const,
  state: null,
})));

vi.mock("@/src/server/health/database-health", () => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock("@/src/lib/server/runtime", () => ({
  getRuntimePosture: vi.fn(),
}));

vi.mock("@/src/server/monitoring/scope-monitoring-health-service", () => ({
  getScopeMonitoringHealth: getScopeMonitoringHealthMock,
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
import { recordHeadlineFlowFeedSuccess, resetHeadlineFlowFeedHealthForTests } from "@/src/server/headline-flow/application/feed-health";
import type { HeadlineFlowFeed, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";
import { checkDatabaseHealth } from "@/src/server/health/database-health";
import { getRuntimePosture } from "@/src/lib/server/runtime";

describe("health and readiness routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHeadlineFlowFeedHealthForTests();
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
    getScopeMonitoringHealthMock.mockResolvedValue({
      enabled: false,
      status: "disabled",
      state: null,
    });
  });

  function seedHealthyHeadlineFlowFeed() {
    const topics: HeadlineFlowTopic[] = ["world", "politics", "business", "technology", "science", "health"];
    const stories: StoryPackage[] = topics.map((topic, index) => ({
      id: `story_${topic}`,
      eventId: `event_${topic}`,
      headline: `${topic} headline`,
      shortSummary: `${topic} summary`,
      narration: `${topic} narration`,
      topic,
      importance: "important",
      confidence: "single_source",
      status: "developing",
      sourceSummary: "Example Source",
      sourceCount: 1,
      sources: [{ id: `source_${index}`, name: "Example Source", url: "https://example.com" }],
      publishedAt: "2026-08-27T03:00:00.000Z",
      updatedAt: "2026-08-27T03:00:00.000Z",
      displayMetadata: {
        rankingReason: "Production readiness fixture.",
        briefingScore: 50,
        prioritySignals: [],
        personalizationReason: null,
        rankingAudit: {
          baseScore: 50,
          personalizationBoost: 0,
          finalScore: 50,
          originalRank: index + 1,
          personalizedRank: index + 1,
        },
        whyItMatters: "This story is part of a production readiness fixture.",
        articleCount: 1,
        heroImageUrl: null,
      },
    }));
    const feed: HeadlineFlowFeed = {
      generatedAt: "2026-08-27T03:00:00.000Z",
      providerId: "rss",
      stories,
      diagnostics: {
        receivedArticles: stories.length,
        acceptedArticles: stories.length,
        rejectedArticles: 0,
        duplicateArticles: 0,
        storyCount: stories.length,
        rejections: [],
      },
    };
    recordHeadlineFlowFeedSuccess({
      ...feed,
    });
  }

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
    seedHealthyHeadlineFlowFeed();
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

  it("keeps a fresh production deployment ready while Headline Flow awaits its first authenticated feed", async () => {
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
      ok: true,
      status: "ok",
      details: null,
    });

    const response = await getReady();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("ready_with_warnings");
    expect(payload.data.warnings).toContainEqual(expect.objectContaining({
      code: "headline_flow_not_started",
      severity: "warning",
    }));
  });

  it("does not fail local development readiness when scope monitoring is stale", async () => {
    seedHealthyHeadlineFlowFeed();
    vi.mocked(getRuntimePosture).mockReturnValue({
      environment: "development",
      storageDriver: "sqlite",
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
        openAiConfigured: true,
        dailyBudgetUsd: 1,
        estimatedCostPerRunUsd: 0.02,
        evaluationsEnabled: true,
      },
      jobs: {
        executionMode: "external",
        workerPollIntervalMs: 2000,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: false,
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
      ok: true,
      status: "ok",
      details: null,
    });
    getScopeMonitoringHealthMock.mockResolvedValue({
      enabled: true,
      status: "stale",
      state: {
        lastStartedAt: new Date("2026-08-23T04:37:22.697Z"),
        lastCompletedAt: new Date("2026-08-23T04:37:22.823Z"),
        lastFailureAt: null,
        lastFailureMessage: null,
        lastWorkspaceCount: 1,
        lastAlertsCreated: 0,
        isStale: true,
        isFailing: false,
      },
    });

    const response = await getReady();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.status).toBe("ready_with_warnings");
    expect(payload.data.warnings).toContainEqual(expect.objectContaining({
      code: "scope_monitoring_stale",
      severity: "warning",
    }));
  });

  it("fails production readiness when scope monitoring is stale", async () => {
    seedHealthyHeadlineFlowFeed();
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
        executionMode: "external",
        workerPollIntervalMs: 2000,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: false,
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
      ok: true,
      status: "ok",
      details: null,
    });
    getScopeMonitoringHealthMock.mockResolvedValue({
      enabled: true,
      status: "stale",
      state: {
        lastStartedAt: new Date("2026-08-23T04:37:22.697Z"),
        lastCompletedAt: new Date("2026-08-23T04:37:22.823Z"),
        lastFailureAt: null,
        lastFailureMessage: null,
        lastWorkspaceCount: 1,
        lastAlertsCreated: 0,
        isStale: true,
        isFailing: false,
      },
    });

    const response = await getReady();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.data.status).toBe("ready_with_warnings");
    expect(payload.data.warnings).toContainEqual(expect.objectContaining({
      code: "scope_monitoring_stale",
      severity: "critical",
    }));
  });

});
