import { createRuntimeEnvironment } from "./runtimeEnvironment";
import { validateEnvironment } from "./validateEnvironment";
import { assessDependencyHealth } from "./dependencyHealth";
import { evaluateContinuityStartupGate } from "./continuityStartupGate";
import { assessMigrationReadiness } from "./migrationReadiness";
import { evaluateProductionSafety } from "./productionSafety";
import { evaluateStartupReadiness } from "./startupReadiness";
import { appendStartupAuditEvent } from "./startupAudit";
import { freezeStartupStatus } from "./startupStatus";
import { recordStartupObservation } from "./startupObservability";

function serializeStartupError(error: { code: string; message: string; details?: Record<string, unknown> }) {
  return {
    code: error.code,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  };
}

export async function runStartupHealthCheck({
  env = process.env,
}: {
  env?: Record<string, unknown>;
} = {}) {
  const startedAt = Date.now();
  const validatedEnvironment = validateEnvironment(env);
  if (!validatedEnvironment.ok) {
    recordStartupObservation({ type: "environment", status: "failed", durationMs: Date.now() - startedAt, details: validatedEnvironment.error.details });
    appendStartupAuditEvent({ type: "STARTUP_ENVIRONMENT_FAILED", payload: serializeStartupError(validatedEnvironment.error) });
    return validatedEnvironment;
  }

  const runtimeEnvironment = createRuntimeEnvironment(validatedEnvironment.data);
  const dependencies = await assessDependencyHealth({ environment: runtimeEnvironment });
  const continuityChecksEnabled =
    runtimeEnvironment.NODE_ENV === "production"
    || runtimeEnvironment.CONTINUITY_VERIFICATION_ENABLED
    || runtimeEnvironment.INTEGRITY_VALIDATION_ENABLED
    || runtimeEnvironment.RESTORE_SIMULATION_ENABLED;
  const continuity = continuityChecksEnabled
    ? await evaluateContinuityStartupGate({ includeProductionRequiredScopes: runtimeEnvironment.NODE_ENV === "production" })
    : {
        ok: true as const,
        scopes: [],
        skipped: true,
        reason: "Continuity verification is disabled for this non-production startup.",
      };
  const migration = await assessMigrationReadiness({ environment: runtimeEnvironment.NODE_ENV });
  const productionSafety = evaluateProductionSafety(runtimeEnvironment);
  const readiness = evaluateStartupReadiness({
    environment: validatedEnvironment,
    dependencies,
    continuity,
    migration,
    productionSafety,
  });

  const durationMs = Date.now() - startedAt;
  if (readiness.ok) {
    freezeStartupStatus({
      ready: true,
      checkedAt: new Date().toISOString(),
      summary: "startup-ready",
    });
    recordStartupObservation({ type: "startup", status: "passed", durationMs, details: { nodeEnv: runtimeEnvironment.NODE_ENV } });
    appendStartupAuditEvent({ type: "STARTUP_READY", payload: { durationMs, nodeEnv: runtimeEnvironment.NODE_ENV } });
    return {
      ok: true as const,
      environment: runtimeEnvironment,
      dependencies,
      continuity,
      migration,
      productionSafety,
      durationMs,
    };
  }

  freezeStartupStatus({
    ready: false,
    checkedAt: new Date().toISOString(),
    summary: readiness.error?.code || "startup-blocked",
  });
  recordStartupObservation({ type: "startup", status: "failed", durationMs, details: readiness.error?.details });
  appendStartupAuditEvent({ type: "STARTUP_BLOCKED", payload: readiness.error ? serializeStartupError(readiness.error) : {} });
  return readiness;
}
