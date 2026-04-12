import { createRequire } from "node:module";
import { AppError } from "@/src/server/api/errors";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";
import { createSummaryReportForView, type SavedTriageView } from "@/src/server/services/summary-service";
import { createTraceId } from "@/src/server/observability/trace-id";
import { listRuntimeDiagnostics, recordRuntimeDiagnostic, summarizeRuntimeDiagnostics } from "@/src/server/observability/runtime-diagnostics";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";

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

export type BackgroundJobType = "workspace:generate-insights" | "workspace:generate-summary" | "workspace:failure-drill";

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
    const insights = await generateWorkspaceInsights(job.payload.workspaceId);
    return {
      generatedCount: insights.length,
      traceId: job.traceId || null,
    };
  });

  registerJobProcessor(
    "workspace:generate-summary",
    async (job: { payload: { workspaceId: string; view: SavedTriageView }; traceId?: string | null; log: (message: string, meta?: Record<string, unknown>) => void }) => {
      job.log("Generating scheduled workspace summary.", {
        workspaceId: job.payload.workspaceId,
        viewName: job.payload.view.name,
        traceId: job.traceId || null,
      });
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

  processorsRegistered = true;
}

export function queueBackgroundJob(
  type: BackgroundJobType,
  payload: Record<string, unknown>,
  actor?: { actorId?: string; actorName?: string; traceId?: string },
) {
  ensureBackgroundJobProcessors();
  const traceId = actor?.traceId || createTraceId("job");
  let job;
  try {
    job = enqueueJob(type, payload, { ...(actor || {}), traceId });
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
