import { z } from "zod";

const strictBoolean = z.union([z.boolean(), z.string()]).transform((value, context) => {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  context.addIssue({ code: "custom", message: "Invalid boolean value." });
  return z.NEVER;
});

export const runtimeEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]),
  TENANT_MODE: z.enum(["single_tenant", "multi_tenant"]),
  LOCK_LEASE_MS: z.coerce.number().int().min(1000),
  BACKUP_PATH: z.string().min(1),
  OBSERVABILITY_MODE: z.enum(["basic", "full"]),
  SECURITY_MODE: z.enum(["enforced", "disabled"]),
  ADMIN_SECRET: z.string().min(16),
  AI_COMMAND_CONSOLE_AUTH_SECRET: z.string().min(16),
  CONTINUITY_VERIFICATION_ENABLED: strictBoolean,
  INTEGRITY_VALIDATION_ENABLED: strictBoolean,
  RESTORE_SIMULATION_ENABLED: strictBoolean,
  FAIL_FAST_ENABLED: strictBoolean,
  DEBUG_MODE: strictBoolean,
}).strict();

export type RuntimeEnvironmentInput = z.input<typeof runtimeEnvironmentSchema>;
export type RuntimeEnvironmentValidated = z.output<typeof runtimeEnvironmentSchema>;
