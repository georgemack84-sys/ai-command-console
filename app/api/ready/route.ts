import { apiSuccess } from "@/src/server/api/response";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { checkDatabaseHealth } from "@/src/server/health/database-health";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";
import { createRequire } from "node:module";
import { env, getJobQueueMaxPending, getJobQueueMaxRunning, getJobWorkerPollIntervalMs } from "@/src/config/env";
import { ensureDefaultFeatureFlags } from "@/src/server/feature-flags/feature-flag-service";
import { getHeadlineFlowFeedHealth } from "@/src/server/headline-flow/application/feed-health";
import { getScopeMonitoringHealth } from "@/src/server/monitoring/scope-monitoring-health-service";

const require = createRequire(import.meta.url);
const { buildQueueHealth, configureJobQueue } = require("../../../services/jobQueue");
const FEATURE_FLAG_TIMEOUT_MS = 1500;
type ReadinessWarningSeverity = "warning" | "critical";
type ScopeMonitoringHealth = Awaited<ReturnType<typeof getScopeMonitoringHealth>>;

async function seedDefaultFlagsWithoutBlockingReadyRoute() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    await Promise.race([
      ensureDefaultFeatureFlags(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Default feature-flag seeding timed out.")), FEATURE_FLAG_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Local health checks should degrade gracefully when Prisma-backed setup is unavailable.
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function scopeMonitoringWarningSeverity(
  environment: string,
  status: ScopeMonitoringHealth["status"],
): ReadinessWarningSeverity {
  if (status === "not_started" || environment !== "production") {
    return "warning";
  }
  return "critical";
}

async function getScopeMonitoringHealthWithoutBlockingReadyRoute(): Promise<ScopeMonitoringHealth> {
  try {
    return await getScopeMonitoringHealth();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      enabled: true,
      status: "failing",
      state: {
        lastStartedAt: null,
        lastCompletedAt: null,
        lastFailureAt: new Date(),
        lastFailureMessage: message,
        lastWorkspaceCount: 0,
        lastAlertsCreated: 0,
        isStale: false,
        isFailing: true,
      },
    };
  }
}

export async function GET() {
  await seedDefaultFlagsWithoutBlockingReadyRoute();
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
  const [scopeMonitoring] = await Promise.all([getScopeMonitoringHealthWithoutBlockingReadyRoute()]);
  const headlineFlow = getHeadlineFlowFeedHealth();
  const warnings = buildRuntimeWarnings(runtime, jobs);
  if (scopeMonitoring.enabled && scopeMonitoring.status !== "healthy") {
    warnings.push({
      code: `scope_monitoring_${scopeMonitoring.status}`,
      severity: scopeMonitoringWarningSeverity(runtime.environment, scopeMonitoring.status),
      message: scopeMonitoring.status === "not_started"
        ? "Scoped-work monitoring has not completed a scan yet."
        : "Scoped-work monitoring is not completing on schedule. Inspect the external worker.",
    });
  }
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
      // Feed health is process-local and the feed endpoint requires a session.
      // A clean deployment therefore has no feed history until its first
      // authenticated request; that must not make the platform unavailable.
      severity: headlineFlow.status === "not_started" || runtime.environment !== "production" ? "warning" : "critical",
      message: headlineFlow.status === "not_started"
        ? "Headline Flow has not completed a successful feed build yet."
        : "Headline Flow feed quality is below the configured production threshold.",
    });
  }
  const hasCriticalWarnings = warnings.some((warning) => warning.severity === "critical");
  const ready = Boolean(runtime.authSecretConfigured && runtime.databaseUrlConfigured && database.ok && !hasCriticalWarnings);
  const baseReady = Boolean(runtime.authSecretConfigured && runtime.databaseUrlConfigured && database.ok);

  return apiSuccess(
    {
      ok: ready,
      status: ready ? (warnings.length ? "ready_with_warnings" : "ready") : (baseReady ? "ready_with_warnings" : "not_ready"),
      checkedAt: new Date().toISOString(),
      runtime,
      warnings,
      checks: {
        authSecret: {
          ok: runtime.authSecretConfigured,
          status: runtime.authSecretConfigured ? "configured" : "missing_configuration",
        },
        database,
        jobs,
        scopeMonitoring,
        headlineFlow,
      },
    },
    { status: ready ? 200 : 503 },
  );
}
