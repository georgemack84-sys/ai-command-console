import { beforeEach, describe, expect, it } from "vitest";
import {
  buildAiSummaryEvaluationSnapshot,
  buildAiSummaryReliability,
  loadAdminAccessRuntimeContext,
  mergeDiagnosticSources,
} from "@/src/server/services/admin-access-runtime";
import { __clearRuntimeDiagnosticsForTests, recordRuntimeDiagnostic } from "@/src/server/observability/runtime-diagnostics";

describe("admin access runtime diagnostics", () => {
  beforeEach(() => {
    __clearRuntimeDiagnosticsForTests();
  });

  it("merges persisted and runtime diagnostics into one platform feed", () => {
    const merged = mergeDiagnosticSources(
      {
        summary: {
          total: 2,
          errors: 1,
          warnings: 1,
          byScope: { platform: 2 },
          latestAt: "2026-04-08T10:00:00.000Z",
        },
        recent: [
          {
            id: "persisted_1",
            timestamp: "2026-04-08T10:00:00.000Z",
            level: "warning",
            scope: "platform",
            message: "Existing warning",
          },
        ],
      },
      {
        summary: {
          total: 3,
          errors: 1,
          warnings: 2,
          byScope: { "jobs.queue": 2, "ai.summary": 1 },
          latestAt: "2026-04-08T11:00:00.000Z",
        },
        recent: [
          {
            id: "runtime_1",
            timestamp: "2026-04-08T11:00:00.000Z",
            level: "warn",
            scope: "jobs.queue",
            message: "Queue degraded",
          },
          {
            id: "runtime_2",
            timestamp: "2026-04-08T10:30:00.000Z",
            level: "info",
            scope: "ai.summary",
            message: "AI summary generated successfully.",
          },
        ],
      },
    );

    expect(merged.summary.total).toBe(5);
    expect(merged.summary.errors).toBe(2);
    expect(merged.summary.warnings).toBe(3);
    expect(merged.summary.byScope.platform).toBe(2);
    expect(merged.summary.byScope["jobs.queue"]).toBe(2);
    expect(merged.summary.byScope["ai.summary"]).toBe(1);
    expect(merged.summary.latestAt).toBe("2026-04-08T11:00:00.000Z");
    expect(merged.recent).toHaveLength(3);
    expect(merged.recent[0].scope).toBe("jobs.queue");
  });

  it("builds an ai summary reliability snapshot from runtime diagnostics", () => {
    const reliability = buildAiSummaryReliability([
      {
        id: "ai_3",
        timestamp: "2026-04-08T11:00:00.000Z",
        level: "warn",
        scope: "ai.summary",
        message: "AI summary response was empty; fallback summary used.",
        traceId: "ai_trace_3",
      },
      {
        id: "ai_2",
        timestamp: "2026-04-08T10:30:00.000Z",
        level: "warn",
        scope: "ai.summary",
        message: "AI summary generation attempt failed; retrying.",
        traceId: "ai_trace_2",
      },
      {
        id: "ai_1",
        timestamp: "2026-04-08T10:00:00.000Z",
        level: "info",
        scope: "ai.summary",
        message: "AI summary generated successfully.",
        traceId: "ai_trace_1",
      },
    ]);

    expect(reliability.status).toBe("warning");
    expect(reliability.totals.total).toBe(3);
    expect(reliability.totals.successes).toBe(1);
    expect(reliability.totals.fallbacks).toBe(1);
    expect(reliability.totals.retries).toBe(1);
    expect(reliability.latestFallbackAt).toBe("2026-04-08T11:00:00.000Z");
    expect(reliability.latestSuccessAt).toBe("2026-04-08T10:00:00.000Z");
    expect(reliability.recentSuccessRate).toBe(33);
    expect(reliability.recentFailureRate).toBe(0);
    expect(reliability.recentFallbackRate).toBe(33);
    expect(reliability.trend.successRateDelta).toBe(33);
    expect(reliability.trend.failureRateDelta).toBe(0);
    expect(reliability.trend.fallbackRateDelta).toBe(33);
    expect(reliability.traceRates.total).toBe(3);
    expect(reliability.traceRates.success).toBe(1);
    expect(reliability.traceRates.fallback).toBe(1);
    expect(reliability.traceRates.error).toBe(0);
    expect(reliability.traceRates.successRate).toBe(33);
    expect(reliability.traceRates.failureRate).toBe(0);
  });

  it("builds an ai summary evaluation snapshot from runtime diagnostics", () => {
    const snapshot = buildAiSummaryEvaluationSnapshot([
      {
        id: "eval_3",
        timestamp: "2026-04-08T11:00:00.000Z",
        level: "error",
        scope: "ai.summary.eval",
        message: "AI summary evaluation critical.",
        traceId: "ai_trace_3",
        context: { score: 25, checks: { hasSummary: false } },
      },
      {
        id: "eval_2",
        timestamp: "2026-04-08T10:30:00.000Z",
        level: "warn",
        scope: "ai.summary.eval",
        message: "AI summary evaluation warning.",
        traceId: "ai_trace_2",
        context: { score: 60, checks: { bulletCountHealthy: false } },
      },
      {
        id: "eval_1",
        timestamp: "2026-04-08T10:00:00.000Z",
        level: "info",
        scope: "ai.summary.eval",
        message: "AI summary evaluation healthy.",
        traceId: "ai_trace_1",
        context: { score: 100, checks: { conciseBullets: true } },
      },
    ]);

    expect(snapshot.status).toBe("critical");
    expect(snapshot.totals.total).toBe(3);
    expect(snapshot.totals.healthy).toBe(1);
    expect(snapshot.totals.warning).toBe(1);
    expect(snapshot.totals.critical).toBe(1);
    expect(snapshot.averageScore).toBe(62);
    expect(snapshot.latestScore).toBe(25);
    expect(snapshot.latestAt).toBe("2026-04-08T11:00:00.000Z");
  });

  it("includes ai budget and legacy compatibility context", () => {
    recordRuntimeDiagnostic({
      scope: "ai.summary",
      level: "info",
      message: "AI summary generated successfully.",
      traceId: "ai_trace_budget",
    });
    recordRuntimeDiagnostic({
      scope: "ai.summary.eval",
      level: "info",
      message: "AI summary evaluation healthy.",
      traceId: "ai_trace_budget",
      context: {
        score: 100,
        checks: { hasSummary: true, bulletCountHealthy: true, usesFallback: false, conciseBullets: true },
      },
    });

    const context = loadAdminAccessRuntimeContext();

    expect(context.aiSummaryBudget.dailyBudgetUsd).toBeGreaterThan(0);
    expect(context.aiSummaryEvaluations.totals.total).toBeGreaterThan(0);
    expect(context.legacyCompatibility.total).toBeGreaterThanOrEqual(0);
  });
});
