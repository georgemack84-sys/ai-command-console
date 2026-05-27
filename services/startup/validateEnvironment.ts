import { runtimeEnvironmentSchema, type RuntimeEnvironmentValidated } from "./envSchema";
import { FORBIDDEN_ADMIN_SECRETS, STARTUP_DEFAULTS } from "./environmentDefaults";
import { createEnvironmentError } from "./environmentErrors";
import { STARTUP_ERROR_CODES } from "./startupErrorCodes";

const ALLOWED_MANAGED_UNKNOWN_PREFIXES = [
  "MISSION_CONTROL_",
  "AI_COMMAND_CONSOLE_",
  "DEPLOY_",
];

const STARTUP_ENVIRONMENT_KEYS = new Set([
  "DATABASE_URL",
  "NODE_ENV",
  "TENANT_MODE",
  "LOCK_LEASE_MS",
  "BACKUP_PATH",
  "OBSERVABILITY_MODE",
  "SECURITY_MODE",
  "ADMIN_SECRET",
  "AI_COMMAND_CONSOLE_AUTH_SECRET",
  "CONTINUITY_VERIFICATION_ENABLED",
  "INTEGRITY_VALIDATION_ENABLED",
  "RESTORE_SIMULATION_ENABLED",
  "FAIL_FAST_ENABLED",
  "DEBUG_MODE",
]);

const ALLOWED_MANAGED_KEYS = new Set([
  ...STARTUP_ENVIRONMENT_KEYS,
  "AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH",
  "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_SEVERITIES",
  "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_THROTTLE_SECONDS",
  "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL",
  "AI_COMMAND_CONSOLE_DATA_ROOT",
  "AI_COMMAND_CONSOLE_DATABASE_PATH",
  "AI_COMMAND_CONSOLE_SECURE_COOKIES",
  "AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS",
  "AI_COMMAND_CONSOLE_STORAGE_DRIVER",
  "AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS",
]);

function pickStartupEnvironment(input: Record<string, unknown>) {
  const startupEnvironment: Record<string, unknown> = {};
  for (const key of STARTUP_ENVIRONMENT_KEYS) {
    startupEnvironment[key] = input[key];
  }
  return startupEnvironment;
}

export function validateEnvironment(input: Record<string, unknown>) {
  const databaseUrl = String(input.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_DATABASE_URL_MISSING, "DATABASE_URL is required.") };
  }

  const nodeEnv = String(input.NODE_ENV || "").trim().toLowerCase();
  if (nodeEnv === "production") {
    const unknownManagedKeys = Object.keys(input).filter((key) =>
      ALLOWED_MANAGED_UNKNOWN_PREFIXES.some((prefix) => key.startsWith(prefix)) && !ALLOWED_MANAGED_KEYS.has(key),
    );
    if (unknownManagedKeys.length > 0) {
      return {
        ok: false as const,
        error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_UNKNOWN_KEY, "Unknown managed environment keys are forbidden in production.", {
          keys: unknownManagedKeys,
        }),
      };
    }
  }

  const parsed = runtimeEnvironmentSchema.safeParse(pickStartupEnvironment(input));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.[0];
    if (path === "NODE_ENV") {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_NODE_ENV_INVALID, "NODE_ENV is invalid.") };
    }
    if (path === "TENANT_MODE") {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_TENANT_MODE_INVALID, "TENANT_MODE is invalid.") };
    }
    if (path === "LOCK_LEASE_MS") {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_LOCK_LEASE_INVALID, "LOCK_LEASE_MS is invalid.") };
    }
    if (path === "BACKUP_PATH") {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_BACKUP_PATH_REQUIRED, "BACKUP_PATH is required.") };
    }
    if (path === "AI_COMMAND_CONSOLE_AUTH_SECRET") {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_AUTH_SECRET_INVALID, "AI_COMMAND_CONSOLE_AUTH_SECRET is required and must be at least 16 characters.") };
    }
    return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_NODE_ENV_INVALID, "Environment validation failed.", { issues: parsed.error.issues }) };
  }

  const environment = parsed.data as RuntimeEnvironmentValidated;
  if (environment.NODE_ENV === "production") {
    if (environment.SECURITY_MODE !== STARTUP_DEFAULTS.securityMode) {
      return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_SECURITY_MODE_DISABLED, "SECURITY_MODE must remain enforced in production.") };
    }
  }

  if (FORBIDDEN_ADMIN_SECRETS.has(environment.ADMIN_SECRET.trim().toLowerCase())) {
    return { ok: false as const, error: createEnvironmentError(STARTUP_ERROR_CODES.ENV_ADMIN_SECRET_UNSAFE, "ADMIN_SECRET is using an unsafe default.") };
  }

  return { ok: true as const, data: environment };
}
