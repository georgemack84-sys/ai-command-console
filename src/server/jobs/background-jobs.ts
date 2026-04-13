import { createRequire } from "node:module";
import { AppError } from "@/src/server/api/errors";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";
import { refreshRssSource } from "@/src/server/services/rss-ingestion-service";
import { createSummaryReportForView, type SavedTriageView } from "@/src/server/services/summary-service";
import { createTraceId } from "@/src/server/observability/trace-id";
import { listRuntimeDiagnostics, recordRuntimeDiagnostic, summarizeRuntimeDiagnostics } from "@/src/server/observability/runtime-diagnostics";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";
import { captureException } from "@/src/server/observability/sentry";
import { trackEvent } from "@/src/server/observability/analytics";

const require = createRequire(import.meta.url);
const {
  registerJobProcessor,
  enqueueJob,
  listJobs,
  getJob,
  cancelJob,
  retryJob,
  buildJobMetrics,
  buildQueueHealth,
  recoverStaleJobs,
  configureJobQueue,
  QueueSaturationError,
  listLatestFailures,
} = require("../../../services/jobQueue");

let processorsRegistered = false;

export type BackgroundJobType =
  | "workspace:generate-insights"
  | "workspace:generate-summary"
  | "workspace:failure-drill"
  | "source:refresh";

function buildBackgroundJobDiagnostics(limit = 20) {
  const health = buildQueueHealth(limit);
  const recent = listRuntimeDiagnostics(limit).filter((entry) => entry.scope === "jobs.queue" || entry.scope === "ai.summary");
  const summary = summarizeRuntimeDiagnostics(limit, ["jobs.queue", "ai.summary"]);

  return {
    summary,
    recent,
    health,
    latestFailures: listLatestFailures(6).map((job: { id: string; traceId?: string | null; type: string; status: string; error?: string | null; nextRetryAt?: string | null; latestEvent?: { timestamp?: string } | null }) => ({
      id: job.id,
      traceId: job.traceId || null,
      type: job.type,
      status: job.status,
      error: job.error || null,
      nextRetryAt: job.nextRetryAt || null,
      latestEventAt: job.latestEvent?.timestamp || null,
    })),
  };
}

export function ensureBackgroundJobProcessors() {
  configureJobQueue({
    executionMode: env.JOB_QUEUE_EXECUTION_MODE,
    workerPollIntervalMs: getJobWorkerPollIntervalMs(),
    maxPendingJobs: getJobQueueMaxPending(),
    maxRunningJobs: getJobQueueMaxRunning(),
  });
  recoverStaleJobs();
  if (processorsRegistered) {
    return;
  }

  registerJobProcessor("workspace:generate-insights", async (job: { payload: { workspaceId: string }; traceId?: string | null; log: (message: string, meta?: Record<string, unknown>) => void }) => {
    job.log("Generating workspace insights.", { workspaceId: job.payload.workspaceId, traceId: job.traceId || null });
    try {
      const insights = await generateWorkspaceInsights(job.payload.workspaceId);
      if (insights.length) {
        trackEvent({
          event: "insight_generated",
          actorId: "system",
          workspaceId: job.payload.workspaceId,
          properties: { count: insights.length, traceId: job.traceId || null },
        });
      }
      return {
        generatedCount: insights.length,
        traceId: job.traceId || null,
      };
    } catch (error) {
      captureException(error, { jobType: "workspace:generate-insights", workspaceId: job.payload.workspaceId });
      throw error;
    }
  });

  registerJobProcessor(
    "workspace:generate-summary",
    async (job: { payload: { workspaceId: string; view: SavedTriageView }; traceId?: string | null; log: (message: string, meta?: Record<string, unknown>) => void }) => {
      job.log("Generating scheduled workspace summary.", {
        workspaceId: job.payload.workspaceId,
        viewName: job.payload.view.name,
        traceId: job.traceId || null,
      });
      try {
        const report = await createSummaryReportForView(job.payload.workspaceId, job.payload.view, {
          traceId: job.traceId || undefined,
          maxAttemptsOverride: 1,
        });
        return {
          reportId: report?.reportId ?? null,
          title: report?.title ?? null,
          provider: report?.provider ?? "mock",
          traceId: report?.traceId ?? job.traceId ?? null,
        };
      } catch (error) {
        captureException(error, { jobType: "workspace:generate-summary", workspaceId: job.payload.workspaceId });
        throw error;
      }
    },
  );

  registerJobProcessor(
    "workspace:failure-drill",
    async (job: { payload: { workspaceId: string }; traceId?: string | null; log: (message: string, meta?: Record<string, unknown>) => void }) => {
      job.log("Running failure drill.", {
        workspaceId: job.payload.workspaceId,
        traceId: job.traceId || null,
      });
      throw new Error("Intentional failure drill triggered for operator recovery.");
    },
  );

  registerJobProcessor(
    "source:refresh",
    async (job: { payload: { sourceId: string; workspaceId: string; requestedById?: string | null }; traceId?: string | null; log: (message: string, meta?: Record<string, unknown>) => void }) => {
      job.log("Refreshing source ingestion.", {
        sourceId: job.payload.sourceId,
        workspaceId: job.payload.workspaceId,
        traceId: job.traceId || null,
      });
      try {
        const result = await refreshRssSource({
          sourceId: job.payload.sourceId,
          workspaceId: job.payload.workspaceId,
          requestedById: job.payload.requestedById ?? null,
          traceId: job.traceId || undefined,
        });
        return {
          sourceId: job.payload.sourceId,
          createdCount: result.createdCount,
          skippedCount: result.skippedCount,
          traceId: result.traceId || job.traceId || null,
        };
      } catch (error) {
        captureException(error, { jobType: "source:refresh", sourceId: job.payload.sourceId });
        throw error;
      }
    },
  );

  processorsRegistered = true;
}

export function queueBackgroundJob(
  type: BackgroundJobType,
  payload: Record<string, unknown>,
  actor?: { actorId?: string; actorName?: string; traceId?: string },
  options?: { maxAttempts?: number; retryDelayMs?: number; runtimeLimitMs?: number },
) {
  ensureBackgroundJobProcessors();
  const traceId = actor?.traceId || createTraceId("job");
  let job;
  try {
    job = enqueueJob(type, payload, { ...(actor || {}), ...(options || {}), traceId });
  } catch (error) {
    if (error instanceof QueueSaturationError || ((error as { code?: string } | null)?.code === "job_queue_saturated")) {
      recordRuntimeDiagnostic({
        scope: "jobs.queue",
        level: "warn",
        message: "Background job rejected because the queue is saturated.",
        traceId,
        context: {
          traceId,
          type,
          ...(error as { details?: Record<string, unknown> } | null)?.details,
        },
      });
      throw new AppError(429, "job_queue_saturated", "The job queue is saturated. Try again after current work drains.", (error as { details?: Record<string, unknown> } | null)?.details);
    }
    throw error;
  }
  recordRuntimeDiagnostic({
    scope: "jobs.queue",
    level: "info",
    message: "Background job queued.",
    traceId,
    context: {
      traceId,
      jobId: job.id,
      type,
      workspaceId: typeof payload.workspaceId === "string" ? payload.workspaceId : null,
      actorId: actor?.actorId || null,
      actorName: actor?.actorName || null,
    },
  });
  return job;
}

export function readBackgroundJobs(limit = 20) {
  ensureBackgroundJobProcessors();
  const health = buildQueueHealth(limit);
  if (health.unhealthy) {
    recordRuntimeDiagnostic({
      scope: "jobs.queue",
      level: "warn",
      message: "Job queue health is degraded.",
      context: health,
    });
  }
  return {
    items: listJobs(limit),
    metrics: buildJobMetrics(limit),
    health,
    diagnostics: buildBackgroundJobDiagnostics(limit),
  };
}

export function readBackgroundJob(jobId: string) {
  ensureBackgroundJobProcessors();
  return getJob(jobId, { full: true });
}

export function cancelBackgroundJob(jobId: string) {
  ensureBackgroundJobProcessors();
  return cancelJob(jobId);
}

export function retryBackgroundJob(jobId: string) {
  ensureBackgroundJobProcessors();
  return retryJob(jobId);
}
