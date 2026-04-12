import fs from "node:fs";
import { getAgentsDatabasePath, getRuntimeLogPath, getRuntimePosture, getWorkspaceDataRoot, getWorkspaceDatabasePath, isProductionRuntime } from "@/src/lib/server/runtime";
import { recordDiagnosticEvent } from "@/services/operationalDiagnostics";
import { resolveAlertByType, upsertAlert } from "@/services/alerts";

function checkFile(targetPath: string) {
  try {
    const stats = fs.statSync(targetPath);
    return {
      ok: stats.isFile(),
      path: targetPath,
      sizeBytes: stats.size,
    };
  } catch {
    return {
      ok: false,
      path: targetPath,
      sizeBytes: 0,
    };
  }
}

function checkDirectory(targetPath: string) {
  try {
    const stats = fs.statSync(targetPath);
    return {
      ok: stats.isDirectory(),
      path: targetPath,
    };
  } catch {
    return {
      ok: false,
      path: targetPath,
    };
  }
}

export function buildLivenessReport() {
  const runtime = getRuntimePosture();
  const logsDir = getRuntimeLogPath();
  const dataDir = getWorkspaceDataRoot();

  const checks = {
    runtime: {
      ok: true,
      environment: runtime.environment,
      storageDriver: runtime.storageDriver,
    },
    dataDir: checkDirectory(dataDir),
    logsDir: checkDirectory(logsDir),
  };

  const report = {
    ok: Object.values(checks).every((item) => item.ok),
    status: Object.values(checks).every((item) => item.ok) ? "ok" : "degraded",
    checkedAt: new Date().toISOString(),
    checks,
  };

  if (!report.ok) {
    recordDiagnosticEvent(
      {
        level: "warning",
        scope: "health",
        message: "Liveness check reported a degraded state.",
        context: {
          status: report.status,
          checks,
        },
      },
      { dedupeKey: "health:degraded", cooldownMs: 5 * 60 * 1000 },
    );
    upsertAlert("runtime_liveness_degraded", "moderate", "Platform liveness is degraded.", {
      status: report.status,
      checks,
    });
  } else {
    resolveAlertByType("runtime_liveness_degraded", "Liveness checks recovered.");
  }

  return report;
}

export function buildReadinessReport() {
  const runtime = getRuntimePosture();
  const workspaceDbPath = getWorkspaceDatabasePath();
  const agentDbPath = getAgentsDatabasePath();

  const checks = {
    authSecret: {
      ok: runtime.authSecretConfigured || !isProductionRuntime(),
      configured: runtime.authSecretConfigured,
      required: isProductionRuntime(),
    },
    workspaceDatabase:
      runtime.storageDriver === "sqlite"
        ? checkFile(workspaceDbPath)
        : { ok: true, path: workspaceDbPath, sizeBytes: 0, mode: "json" as const },
    agentsDatabase: checkFile(agentDbPath),
    secureCookies: {
      ok: runtime.secureCookies || !isProductionRuntime(),
      enabled: runtime.secureCookies,
      required: isProductionRuntime(),
    },
  };

  const ok = Object.values(checks).every((item) => item.ok);

  const report = {
    ok,
    status: ok ? "ready" : "not_ready",
    checkedAt: new Date().toISOString(),
    runtime,
    checks,
  };

  if (!report.ok) {
    recordDiagnosticEvent(
      {
        level: "error",
        scope: "readiness",
        message: "Readiness check failed.",
        context: {
          status: report.status,
          checks,
          runtime,
        },
      },
      { dedupeKey: "readiness:not_ready", cooldownMs: 5 * 60 * 1000 },
    );
    upsertAlert("runtime_readiness_failed", "high", "Platform readiness failed.", {
      status: report.status,
      checks,
      runtime,
    });
  } else {
    resolveAlertByType("runtime_readiness_failed", "Readiness checks recovered.");
  }

  return report;
}
