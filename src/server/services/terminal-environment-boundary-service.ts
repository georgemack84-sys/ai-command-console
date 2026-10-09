import { AppError } from "@/src/server/api/errors";

export const OPERATIONAL_ENVIRONMENTS = ["development", "staging", "production"] as const;

export type OperationalEnvironment = (typeof OPERATIONAL_ENVIRONMENTS)[number];

const TARGET_ENVIRONMENT_FIELDS = ["environment", "targetEnvironment", "overrideEnvironment"] as const;

export function normalizeOperationalEnvironment(
  value: unknown,
  fallback: OperationalEnvironment = "development",
): OperationalEnvironment {
  const normalized = String(value || "").trim().toLowerCase();
  return OPERATIONAL_ENVIRONMENTS.includes(normalized as OperationalEnvironment)
    ? (normalized as OperationalEnvironment)
    : fallback;
}

export function requireOperationalEnvironment(value: unknown, fieldName = "environment"): OperationalEnvironment {
  const normalized = String(value || "").trim().toLowerCase();
  if (!OPERATIONAL_ENVIRONMENTS.includes(normalized as OperationalEnvironment)) {
    throw new AppError(400, "environment_invalid", `${fieldName} must be development, staging, or production.`);
  }
  return normalized as OperationalEnvironment;
}

export function resolveWorkspaceEnvironment(
  governance: Record<string, unknown>,
  workspaceId: string,
): OperationalEnvironment {
  const overrides =
    governance.workspacePolicyOverrides && typeof governance.workspacePolicyOverrides === "object"
      ? (governance.workspacePolicyOverrides as Record<string, Record<string, unknown>>)
      : {};
  return normalizeOperationalEnvironment(overrides[workspaceId]?.environment, normalizeOperationalEnvironment(governance.currentEnvironment));
}

export function getDeclaredTargetEnvironment(payload: Record<string, unknown>): OperationalEnvironment | null {
  const declared = TARGET_ENVIRONMENT_FIELDS.flatMap((field) => {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return [];
    }
    return [requireOperationalEnvironment(payload[field], field)];
  });

  const unique = [...new Set(declared)];
  if (unique.length > 1) {
    throw new AppError(400, "environment_target_conflict", "The request declares conflicting target environments.");
  }
  return unique[0] || null;
}

export function assertTerminalEnvironmentBoundary(input: {
  action: string;
  payload: Record<string, unknown>;
  workspaceId: string;
  governance: Record<string, unknown>;
  approvedEnvironment?: string | null;
}) {
  const workspaceEnvironment = resolveWorkspaceEnvironment(input.governance, input.workspaceId);
  const targetEnvironment = getDeclaredTargetEnvironment(input.payload);

  if (targetEnvironment && targetEnvironment !== workspaceEnvironment) {
    throw new AppError(
      409,
      "environment_boundary_violation",
      `Action ${input.action} targets ${targetEnvironment}, but workspace ${input.workspaceId} is isolated to ${workspaceEnvironment}.`,
    );
  }

  if (
    input.approvedEnvironment &&
    normalizeOperationalEnvironment(input.approvedEnvironment) !== workspaceEnvironment
  ) {
    throw new AppError(
      409,
      "approval_environment_changed",
      `The approval was requested for ${input.approvedEnvironment}, but the workspace is now isolated to ${workspaceEnvironment}. Request a new approval.`,
    );
  }

  return {
    workspaceEnvironment,
    targetEnvironment: targetEnvironment || workspaceEnvironment,
  };
}
