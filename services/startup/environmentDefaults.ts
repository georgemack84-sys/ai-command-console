export const STARTUP_DEFAULTS = {
  lockLeaseMs: 30000,
  continuityFreshnessMs: 1000 * 60 * 60 * 24,
  observabilityMode: "full",
  securityMode: "enforced",
} as const;

export const FORBIDDEN_ADMIN_SECRETS = new Set([
  "admin",
  "changeme",
  "default",
  "super-secret",
  "ai-command-console-dev-only-secret",
]);
