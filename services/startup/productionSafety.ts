import { FORBIDDEN_ADMIN_SECRETS } from "./environmentDefaults";
import { STARTUP_ERROR_CODES } from "./startupErrorCodes";
import { formatStartupFailure } from "./startupFailureFormatter";

export function evaluateProductionSafety(environment: {
  NODE_ENV: string;
  SECURITY_MODE: string;
  OBSERVABILITY_MODE: string;
  CONTINUITY_VERIFICATION_ENABLED: boolean;
  INTEGRITY_VALIDATION_ENABLED: boolean;
  RESTORE_SIMULATION_ENABLED: boolean;
  FAIL_FAST_ENABLED: boolean;
  DEBUG_MODE: boolean;
  ADMIN_SECRET: string;
}) {
  if (environment.NODE_ENV !== "production") {
    return { ok: true as const };
  }

  if (environment.SECURITY_MODE !== "enforced") {
    return formatStartupFailure(STARTUP_ERROR_CODES.ENV_SECURITY_MODE_DISABLED, "SECURITY_MODE must remain enforced in production.");
  }
  if (FORBIDDEN_ADMIN_SECRETS.has(environment.ADMIN_SECRET.trim().toLowerCase())) {
    return formatStartupFailure(STARTUP_ERROR_CODES.ENV_ADMIN_SECRET_UNSAFE, "ADMIN_SECRET is unsafe.");
  }
  if (
    !environment.CONTINUITY_VERIFICATION_ENABLED
    || !environment.INTEGRITY_VALIDATION_ENABLED
    || !environment.RESTORE_SIMULATION_ENABLED
    || !environment.FAIL_FAST_ENABLED
    || environment.DEBUG_MODE
    || environment.OBSERVABILITY_MODE === "basic"
  ) {
    return formatStartupFailure(STARTUP_ERROR_CODES.ENV_SECURITY_MODE_DISABLED, "Production safety posture is not enforced.", {
      observabilityMode: environment.OBSERVABILITY_MODE,
    });
  }

  return { ok: true as const };
}
