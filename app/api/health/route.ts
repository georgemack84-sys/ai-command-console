import { apiSuccess } from "@/src/server/api/response";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { checkDatabaseHealth } from "@/src/server/health/database-health";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";
import { createRequire } from "node:module";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";

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
  const externalWorkerMissing =
    runtime.jobs?.executionMode === "external" &&
    Number(jobs.pending || 0) > 0 &&
    Number(jobs.activeWorkers || 0) === 0;
  if (externalWorkerMissing && !warnings.some((warning) => warning.code === "jobs_external_worker_missing")) {
    warnings.push({
      code: "jobs_external_worker_missing",
      severity: "critical",
      message: "Background jobs are queued but no external worker is currently active.",
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
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
