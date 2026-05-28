import type { RuntimeEnvironmentValidated } from "./envSchema";
import { STARTUP_ERROR_CODES } from "./startupErrorCodes";
import { formatStartupFailure } from "./startupFailureFormatter";

export type DependencyComponentHealth = {
  name: string;
  critical: boolean;
  status: "available" | "degraded" | "unavailable";
  reason?: string;
};

export async function assessDependencyHealth({
  environment,
  databaseCheck,
}: {
  environment: RuntimeEnvironmentValidated;
  databaseCheck?: () => Promise<{ ok: boolean; status: string; details?: string | null }>;
}) {
  const database = databaseCheck
    ? await databaseCheck()
    : await import("@/src/server/health/database-health").then((module) => module.checkDatabaseHealth());

  const components: DependencyComponentHealth[] = [
    {
      name: "database",
      critical: true,
      status: database.ok ? "available" : "unavailable",
      reason: database.details || undefined,
    },
    {
      name: "observability",
      critical: true,
      status: environment.OBSERVABILITY_MODE === "full" || environment.OBSERVABILITY_MODE === "basic" ? "available" : "unavailable",
    },
    {
      name: "security",
      critical: true,
      status: environment.SECURITY_MODE === "enforced" ? "available" : "unavailable",
    },
    {
      name: "locks",
      critical: true,
      status: environment.LOCK_LEASE_MS >= 1000 ? "available" : "unavailable",
    },
  ];

  const failed = components.find((component) => component.critical && component.status !== "available");
  if (failed) {
    return formatStartupFailure(
      failed.name === "database" ? STARTUP_ERROR_CODES.STARTUP_DB_UNREACHABLE : STARTUP_ERROR_CODES.STARTUP_OBSERVABILITY_UNAVAILABLE,
      `${failed.name} is not ready.`,
      { components },
    );
  }

  return {
    ok: true as const,
    components,
  };
}
