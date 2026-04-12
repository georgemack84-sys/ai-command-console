import { createRequire } from "node:module";
import {
  listRuntimeDiagnostics,
  summarizeRuntimeDiagnostics,
  type RuntimeDiagnosticEntry,
} from "@/src/server/observability/runtime-diagnostics";
import { readAiSummaryBudgetSnapshot } from "@/src/server/services/ai-service";

const require = createRequire(import.meta.url);
const { loadCollaborationState } = require("../../../services/collaboration");
const { listAuditEvents } = require("../../../services/auditTrail");
const { listRecentDiagnostics, summarizeDiagnostics } = require("../../../services/operationalDiagnostics");
const { getLegacyConsoleUsageSummary } = require("../../../services/legacyConsoleUsage");

type RuntimeSummary = {
  total: number;
  errors: number;
  warnings: number;
  byScope: Record<string, number>;
  latestAt: string | null;
};

type RuntimeEntry = {
  id: string;
  timestamp: string;
  level: string;
  scope: string;
  message: string;
  traceId?: string | null;
  context?: Record<string, unknown>;
};

type AiSummaryReliability = {
  status: "healthy" | "warning" | "critical";
  totals: {
    total: number;
    successes: number;
    fallbacks: number;
    retries: number;
    errors: number;
  };
  latestAt: string | null;
  latestSuccessAt: string | null;
  latestFallbackAt: string | null;
  recentSuccessRate: number;
  recentFailureRate: number;
  recentFallbackRate: number;
  trend: {
    successRateDelta: number;
    failureRateDelta: number;
    fallbackRateDelta: number;
  };
  traceRates: {
    total: number;
    success: number;
    fallback: number;
    error: number;
    successRate: number;
    failureRate: number;
  };
  recent: RuntimeDiagnosticEntry[];
};

type AiSummaryEvaluationSnapshot = {
  status: "healthy" | "warning" | "critical";
  totals: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  latestAt: string | null;
  averageScore: number;
  latestScore: number | null;
  recent: RuntimeDiagnosticEntry[];
};

export function mergeDiagnosticSources(
  persisted: { summary: RuntimeSummary; recent: RuntimeEntry[] },
  runtime: { summary: RuntimeSummary; recent: RuntimeDiagnosticEntry[] },
) {
  const byScope = {
    ...(persisted.summary.byScope || {}),
  };

  for (const [scope, count] of Object.entries(runtime.summary.byScope || {})) {
    byScope[scope] = (byScope[scope] || 0) + count;
  }

  const recent = [...(persisted.recent || []), ...(runtime.recent || [])]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 12);

  const latestAtCandidates = [persisted.summary.latestAt, runtime.summary.latestAt].filter(Boolean) as string[];
  const latestAt = latestAtCandidates.length
    ? latestAtCandidates.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
    : null;

  return {
    summary: {
      total: Number(persisted.summary.total || 0) + Number(runtime.summary.total || 0),
      errors: Number(persisted.summary.errors || 0) + Number(runtime.summary.errors || 0),
      warnings: Number(persisted.summary.warnings || 0) + Number(runtime.summary.warnings || 0),
      byScope,
      latestAt,
    },
    recent,
  };
}

export function buildAiSummaryReliability(entries: RuntimeDiagnosticEntry[]): AiSummaryReliability {
  const aiEntries = entries.filter((entry) => entry.scope === "ai.summary");
  const isSuccess = (entry: RuntimeDiagnosticEntry) => entry.message.toLowerCase().includes("generated successfully");
  const isFallback = (entry: RuntimeDiagnosticEntry) =>
    entry.message.toLowerCase().includes("fallback summary") || entry.message.toLowerCase().includes("forced mock output");
  const isRetry = (entry: RuntimeDiagnosticEntry) => entry.message.toLowerCase().includes("retrying");
  const isError = (entry: RuntimeDiagnosticEntry) => entry.level === "error";

  const totals = aiEntries.reduce(
    (summary, entry) => {
      summary.total += 1;
      if (isSuccess(entry)) {
        summary.successes += 1;
      }
      if (isFallback(entry)) {
        summary.fallbacks += 1;
      }
      if (isRetry(entry)) {
        summary.retries += 1;
      }
      if (isError(entry)) {
        summary.errors += 1;
      }
      return summary;
    },
    {
      total: 0,
      successes: 0,
      fallbacks: 0,
      retries: 0,
      errors: 0,
    },
  );

  const latestSuccessAt =
    aiEntries.find((entry) => isSuccess(entry))?.timestamp || null;
  const latestFallbackAt =
    aiEntries.find((entry) => isFallback(entry))?.timestamp || null;
  const latestAt = aiEntries[0]?.timestamp || null;
  const recentWindow = aiEntries.slice(0, 6);
  const previousWindow = aiEntries.slice(6, 12);
  const rateFor = (items: RuntimeDiagnosticEntry[], predicate: (entry: RuntimeDiagnosticEntry) => boolean) =>
    items.length ? Math.round((items.filter(predicate).length / items.length) * 100) : 0;
  const recentSuccessRate = rateFor(recentWindow, isSuccess);
  const recentFailureRate = rateFor(recentWindow, isError);
  const recentFallbackRate = rateFor(recentWindow, isFallback);
  const previousSuccessRate = rateFor(previousWindow, isSuccess);
  const previousFailureRate = rateFor(previousWindow, isError);
  const previousFallbackRate = rateFor(previousWindow, isFallback);
  const traces = new Map<string, { success: boolean; fallback: boolean; error: boolean }>();

  for (const entry of aiEntries) {
    if (!entry.traceId) {
      continue;
    }
    const current = traces.get(entry.traceId) || { success: false, fallback: false, error: false };
    current.success = current.success || isSuccess(entry);
    current.fallback = current.fallback || isFallback(entry);
    current.error = current.error || isError(entry);
    traces.set(entry.traceId, current);
  }

  const traceOutcomes = Array.from(traces.values());
  const traceRates = {
    total: traceOutcomes.length,
    success: traceOutcomes.filter((item) => item.success).length,
    fallback: traceOutcomes.filter((item) => item.fallback).length,
    error: traceOutcomes.filter((item) => item.error).length,
    successRate: traceOutcomes.length ? Math.round((traceOutcomes.filter((item) => item.success).length / traceOutcomes.length) * 100) : 0,
    failureRate: traceOutcomes.length ? Math.round((traceOutcomes.filter((item) => item.error).length / traceOutcomes.length) * 100) : 0,
  };

  const status =
    totals.errors > 0 ? "critical" : totals.fallbacks > 0 || totals.retries > 0 ? "warning" : "healthy";

  return {
    status,
    totals,
    latestAt,
    latestSuccessAt,
    latestFallbackAt,
    recentSuccessRate,
    recentFailureRate,
    recentFallbackRate,
    trend: {
      successRateDelta: recentSuccessRate - previousSuccessRate,
      failureRateDelta: recentFailureRate - previousFailureRate,
      fallbackRateDelta: recentFallbackRate - previousFallbackRate,
    },
    traceRates,
    recent: aiEntries.slice(0, 6),
  };
}

export function buildAiSummaryEvaluationSnapshot(entries: RuntimeDiagnosticEntry[]): AiSummaryEvaluationSnapshot {
  const evaluationEntries = entries.filter((entry) => entry.scope === "ai.summary.eval");
  const totals = evaluationEntries.reduce(
    (summary, entry) => {
      summary.total += 1;
      if (entry.level === "error") {
        summary.critical += 1;
      } else if (entry.level === "warn") {
        summary.warning += 1;
      } else {
        summary.healthy += 1;
      }
      return summary;
    },
    {
      total: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
    },
  );

  const scores = evaluationEntries
    .map((entry) => Number((entry.context as { score?: number } | undefined)?.score))
    .filter((score) => Number.isFinite(score));
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const latestScore = scores.length ? scores[0] : null;
  const latestAt = evaluationEntries[0]?.timestamp || null;
  const status =
    totals.critical > 0 ? "critical" : totals.warning > 0 ? "warning" : "healthy";

  return {
    status,
    totals,
    latestAt,
    averageScore,
    latestScore,
    recent: evaluationEntries.slice(0, 6),
  };
}

export function loadAdminAccessRuntimeContext() {
  const collaboration = loadCollaborationState();
  const legacyCompatibility = getLegacyConsoleUsageSummary(20);
  const persistedDiagnostics = {
    summary: summarizeDiagnostics(100),
    recent: listRecentDiagnostics(12),
  };
  const runtimeDiagnostics = {
    summary: summarizeRuntimeDiagnostics(100, ["jobs.queue", "ai.summary", "ai.summary.eval"]),
    recent: listRuntimeDiagnostics(12).filter(
      (entry) => entry.scope === "jobs.queue" || entry.scope === "ai.summary" || entry.scope === "ai.summary.eval",
    ),
  };
  const aiSummaryReliability = buildAiSummaryReliability(
    listRuntimeDiagnostics(20).filter((entry) => entry.scope === "ai.summary"),
  );
  const aiSummaryEvaluations = buildAiSummaryEvaluationSnapshot(
    listRuntimeDiagnostics(20).filter((entry) => entry.scope === "ai.summary.eval"),
  );

  return {
    collaboration,
    audit: listAuditEvents(60).filter((entry: { type?: string }) =>
      [
        "admin:user-role-updated",
        "admin:user-status-updated",
        "admin:user-workspace-updated",
        "admin:workspace-renamed",
        "admin:workspace-invite-created",
        "admin:workspace-invite-revoked",
        "admin:workspace-policy-updated",
        "admin:governance-updated",
      ].includes(String(entry.type || "")),
    ),
    diagnostics: mergeDiagnosticSources(persistedDiagnostics, runtimeDiagnostics),
    aiSummaryReliability,
    aiSummaryEvaluations,
    aiSummaryBudget: readAiSummaryBudgetSnapshot(),
    legacyCompatibility,
  };
}
