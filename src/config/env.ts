import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public"),
  AI_COMMAND_CONSOLE_AUTH_SECRET: z.string().min(16).optional(),
  AI_COMMAND_CONSOLE_SECURE_COOKIES: z.string().optional(),
  AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS: z.string().optional(),
  AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_SUMMARY_PROVIDER_MODE: z.enum(["auto", "openai", "mock"]).default("auto"),
  AI_SUMMARY_MODEL: z.string().default("gpt-4.1-mini"),
  AI_SUMMARY_TIMEOUT_MS: z.string().optional(),
  AI_SUMMARY_MAX_ATTEMPTS: z.string().optional(),
  AI_SUMMARY_ALLOW_MOCK_FALLBACK: z.string().optional(),
  AI_SUMMARY_DAILY_BUDGET_USD: z.string().optional(),
  AI_SUMMARY_ESTIMATED_COST_PER_RUN_USD: z.string().optional(),
  AI_SUMMARY_EVAL_ENABLED: z.string().optional(),
  RSS_INGEST_TIMEOUT_MS: z.string().optional(),
  RSS_INGEST_MAX_ITEMS: z.string().optional(),
  RSS_INGEST_MAX_CONTENT_BYTES: z.string().optional(),
  RSS_USER_AGENT: z.string().optional(),
  JOB_QUEUE_EXECUTION_MODE: z.enum(["in_process", "external"]).default("in_process"),
  JOB_WORKER_POLL_INTERVAL_MS: z.string().optional(),
  JOB_QUEUE_MAX_PENDING: z.string().optional(),
  JOB_QUEUE_MAX_RUNNING: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:5050"),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  POSTHOG_ENABLED: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
}

function isLocalHost(value: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(value.toLowerCase());
}

function getAppUrl() {
  try {
    return new URL(env.NEXT_PUBLIC_APP_URL);
  } catch {
    return null;
  }
}

function isLocalHttpAppUrl() {
  const appUrl = getAppUrl();
  return Boolean(appUrl && isLocalHost(appUrl.hostname) && appUrl.protocol === "http:");
}

function canUseDevelopmentFallbackSecret(values: z.infer<typeof envSchema>) {
  if (values.NODE_ENV === "test") {
    return true;
  }

  try {
    const appUrl = new URL(values.NEXT_PUBLIC_APP_URL);
    if (isLocalHost(appUrl.hostname)) {
      return true;
    }
  } catch {
    // Fall through to the database URL heuristic below.
  }

  try {
    const databaseUrl = new URL(values.DATABASE_URL);
    return isLocalHost(databaseUrl.hostname || "localhost");
  } catch {
    return false;
  }
}

function resolveAuthSecret(values: z.infer<typeof envSchema>) {
  if (values.AI_COMMAND_CONSOLE_AUTH_SECRET) {
    return values.AI_COMMAND_CONSOLE_AUTH_SECRET;
  }

  if (canUseDevelopmentFallbackSecret(values)) {
    return "ai-command-console-dev-only-secret";
  }

  throw new Error(
    "AI_COMMAND_CONSOLE_AUTH_SECRET must be configured for non-local production deployments.",
  );
}

export const env = {
  ...parsed.data,
  AI_COMMAND_CONSOLE_AUTH_SECRET: resolveAuthSecret(parsed.data),
};

for (const [key, value] of Object.entries(env)) {
  if (typeof value !== "string") {
    continue;
  }

  if (typeof process.env[key] !== "string" || process.env[key]?.trim() === "") {
    process.env[key] = value;
  }
}

export function isProduction() {
  return env.NODE_ENV === "production";
}

export function getSessionMaxAgeSeconds() {
  const configured = Number(env.AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 60 * 60 * 24 * 14;
}

export function secureCookiesEnabled() {
  const configured = env.AI_COMMAND_CONSOLE_SECURE_COOKIES?.toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return !isLocalHttpAppUrl();
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return isProduction() && !isLocalHttpAppUrl();
}

export function getAiSummaryTimeoutMs() {
  const configured = Number(env.AI_SUMMARY_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 ? Math.floor(configured) : 8_000;
}

export function getAiSummaryMaxAttempts() {
  const configured = Number(env.AI_SUMMARY_MAX_ATTEMPTS);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 2;
}

export function aiSummaryAllowsMockFallback() {
  const configured = env.AI_SUMMARY_ALLOW_MOCK_FALLBACK?.toLowerCase();
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return true;
}

export function getAiSummaryDailyBudgetUsd() {
  const configured = Number(env.AI_SUMMARY_DAILY_BUDGET_USD);
  return Number.isFinite(configured) && configured >= 0 ? Number(configured.toFixed(4)) : 1;
}

export function getAiSummaryEstimatedCostPerRunUsd() {
  const configured = Number(env.AI_SUMMARY_ESTIMATED_COST_PER_RUN_USD);
  return Number.isFinite(configured) && configured >= 0 ? Number(configured.toFixed(4)) : 0.02;
}

export function aiSummaryEvaluationsEnabled() {
  const configured = env.AI_SUMMARY_EVAL_ENABLED?.toLowerCase();
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return true;
}

export function getRssIngestTimeoutMs() {
  const configured = Number(env.RSS_INGEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1000 ? Math.floor(configured) : 10_000;
}

export function getRssIngestMaxItems() {
  const configured = Number(env.RSS_INGEST_MAX_ITEMS);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 30;
}

export function getRssIngestMaxContentBytes() {
  const configured = Number(env.RSS_INGEST_MAX_CONTENT_BYTES);
  return Number.isFinite(configured) && configured >= 10_000 ? Math.floor(configured) : 2_000_000;
}

export function getRssUserAgent() {
  const configured = env.RSS_USER_AGENT?.trim();
  return configured || "AI-Command-Console/1.0 (+https://example.com)";
}

export function getJobWorkerPollIntervalMs() {
  const configured = Number(env.JOB_WORKER_POLL_INTERVAL_MS);
  return Number.isFinite(configured) && configured >= 250 ? Math.floor(configured) : 2_000;
}

export function getJobQueueMaxPending() {
  const configured = Number(env.JOB_QUEUE_MAX_PENDING);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 100;
}

export function getJobQueueMaxRunning() {
  const configured = Number(env.JOB_QUEUE_MAX_RUNNING);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 12;
}

export function sentryEnabled() {
  return Boolean(env.SENTRY_DSN);
}

export function getSentryTracesSampleRate() {
  const configured = Number(env.SENTRY_TRACES_SAMPLE_RATE);
  return Number.isFinite(configured) && configured >= 0 ? Math.min(1, Math.max(0, configured)) : 0.1;
}

export function posthogEnabled() {
  const configured = env.POSTHOG_ENABLED?.toLowerCase();
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return Boolean(env.POSTHOG_API_KEY);
}

export function writeLegacyJsonMirrorsEnabled() {
  const configured = env.AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS?.toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return true;
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return env.NODE_ENV === "test";
}
