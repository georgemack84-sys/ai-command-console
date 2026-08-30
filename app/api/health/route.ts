import { apiSuccess } from "@/src/server/api/response";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { checkDatabaseHealth } from "@/src/server/health/database-health";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";
import { createRequire } from "node:module";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";
import { getHeadlineFlowFeedHealth } from "@/src/server/headline-flow/application/feed-health";

const require = createRequire(import.meta.url);
const { buildQueueHealth, configureJobQueue } = require("../../../services/jobQueue");

export async function GET() {
  configureJobQueue({
    executionMode: env.JOB_QUEUE_EXECUTION_MODE,
    workerPollIntervalMs: getJobWorkerPollIntervalMs(),
    maxPendingJobs: getJobQueueMaxPending(),
    maxRunningJobs: getJobQueueMaxRunning(),
  });
  const runtime = getRuntimePosture();
  const jobs = buildQueueHealth();
  const database = runtime.databaseUrlConfigured
    ? await checkDatabaseHealth()
    : {
        ok: false,
        status: "missing_configuration" as const,
        details: "DATABASE_URL is not configured.",
      };

  const warnings = buildRuntimeWarnings(runtime, jobs);
  const headlineFlow = getHeadlineFlowFeedHealth();
  const externalWorkerMissing =
    runtime.jobs?.executionMode === "external" &&
    Number(jobs.pending || 0) > 0 &&
    Number(jobs.activeWorkers || 0) === 0;
  if (externalWorkerMissing && !warnings.some((warning) => warning.code === "jobs_external_worker_missing")) {
    warnings.push({
      code: "jobs_external_worker_missing",
      severity: runtime.environment === "production" ? "critical" : "warning",
      message: "Background jobs are queued but no external worker is currently active.",
    });
  }
  if (headlineFlow.status !== "healthy") {
    warnings.push({
      code: `headline_flow_${headlineFlow.status}`,
      severity: runtime.environment === "production" ? "critical" : "warning",
      message: headlineFlow.status === "not_started"
        ? "Headline Flow has not completed a successful feed build yet."
        : "Headline Flow feed quality is below the configured production threshold.",
    });
  }
  const hasCriticalWarnings = warnings.some((warning) => warning.severity === "critical");
  const healthy = database.ok && !hasCriticalWarnings;
  const status = !database.ok ? "degraded" : hasCriticalWarnings ? "degraded" : warnings.length ? "warning" : "ok";

  return apiSuccess(
    {
      ok: healthy,
      status,
      checkedAt: new Date().toISOString(),
      runtime,
      warnings,
      checks: {
        database,
        jobs,
        headlineFlow,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
