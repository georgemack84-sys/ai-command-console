import { STARTUP_ERROR_CODES } from "./startupErrorCodes";
import { formatStartupFailure } from "./startupFailureFormatter";

type StartupFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type DependencyReadiness =
  | { ok: true; components: Array<{ name: string; critical: boolean; status: string; reason?: string }> }
  | (StartupFailure & { components?: Array<{ name: string; critical: boolean; status: string; reason?: string }> });

export function evaluateStartupReadiness(input: {
  environment: { ok: boolean; error?: { code: string; message: string; details?: Record<string, unknown> } };
  dependencies: DependencyReadiness;
  continuity: { ok: boolean; error?: { code: string; message: string; details?: Record<string, unknown> } };
  migration: { ok: boolean; error?: { code: string; message: string; details?: Record<string, unknown> } };
  productionSafety: { ok: boolean; error?: { code: string; message: string; details?: Record<string, unknown> } };
}) {
  if (!input.environment.ok) {
    return input.environment;
  }
  if (!input.dependencies.ok) {
    const components = input.dependencies.components || [];
    const failed = components.find((component) => component.critical && component.status !== "available");
    return formatStartupFailure(
      failed?.name === "database" ? STARTUP_ERROR_CODES.STARTUP_DB_UNREACHABLE : STARTUP_ERROR_CODES.STARTUP_OBSERVABILITY_UNAVAILABLE,
      failed?.reason || input.dependencies.error?.message || "Critical dependency is unavailable.",
      components.length ? { components } : input.dependencies.error?.details,
    );
  }
  if (!input.continuity.ok) {
    return input.continuity;
  }
  if (!input.migration.ok) {
    return input.migration;
  }
  if (!input.productionSafety.ok) {
    return input.productionSafety;
  }
  return { ok: true as const };
}
