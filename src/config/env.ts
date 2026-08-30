import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public"),
  AI_COMMAND_CONSOLE_AUTH_SECRET: z.string().min(16).optional(),
  AI_COMMAND_CONSOLE_SECURE_COOKIES: z.string().optional(),
  AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS: z.string().optional(),
  AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  HEADLINE_FLOW_PROVIDER: z.enum(["auto", "fixture", "rss", "web_search"]).default("rss"),
  HEADLINE_FLOW_RSS_TIMEOUT_MS: z.string().optional(),
  HEADLINE_FLOW_LINK_RESOLUTION_TIMEOUT_MS: z.string().optional(),
  HEADLINE_FLOW_LINK_RESOLUTION_MAX_ATTEMPTS: z.string().optional(),
  HEADLINE_FLOW_FEED_CACHE_TTL_MS: z.string().optional(),
  HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS: z.string().optional(),
  HEADLINE_FLOW_MIN_READY_STORIES: z.string().optional(),
  HEADLINE_FLOW_MIN_READY_TOPICS: z.string().optional(),
  HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER: z.string().optional(),
  HEADLINE_FLOW_WEB_SEARCH_MODEL: z.string().default("gpt-4.1-mini"),
  HEADLINE_FLOW_WEB_SEARCH_TIMEOUT_MS: z.string().optional(),
  HEADLINE_FLOW_AUTO_FALLBACK_TIMEOUT_MS: z.string().optional(),
  HEADLINE_FLOW_INTERACTION_RETENTION_DAYS: z.string().optional(),
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
  SOURCE_ALLOW_PRIVATE_URLS: z.string().optional(),
  JOB_QUEUE_EXECUTION_MODE: z.enum(["in_process", "external"]).default("in_process"),
  JOB_WORKER_POLL_INTERVAL_MS: z.string().optional(),
  JOB_QUEUE_MAX_PENDING: z.string().optional(),
  JOB_QUEUE_MAX_RUNNING: z.string().optional(),
  SCOPE_ALERT_SCAN_ENABLED: z.string().optional(),
  SCOPE_ALERT_SCAN_INTERVAL_MS: z.string().optional(),
  SCOPE_ALERT_SCAN_CONCURRENCY: z.string().optional(),
  SCOPE_ALERT_RENOTIFY_AFTER_MS: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:5050"),
  LEARNING_AGENT_ORIGIN: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  POSTHOG_ENABLED: z.string().optional(),
  RATE_LIMIT_ENABLED: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_AUTH_LIMIT: z.string().optional(),
  RATE_LIMIT_SOURCE_LIMIT: z.string().optional(),
  RATE_LIMIT_JOBS_LIMIT: z.string().optional(),
  FEATURE_FLAGS_ENABLED: z.string().optional(),
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

export function sourceAllowsPrivateUrls() {
  const configured = env.SOURCE_ALLOW_PRIVATE_URLS?.toLowerCase();
  return configured === "true" || configured === "1" || configured === "yes";
}

export function getHeadlineFlowWebSearchTimeoutMs() {
  const configured = Number(env.HEADLINE_FLOW_WEB_SEARCH_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 2_000 ? Math.floor(configured) : 30_000;
}

export function getHeadlineFlowRssTimeoutMs() {
  const configured = Number(env.HEADLINE_FLOW_RSS_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 ? Math.floor(configured) : 5_000;
}

export function getHeadlineFlowLinkResolutionTimeoutMs() {
  const configured = Number(env.HEADLINE_FLOW_LINK_RESOLUTION_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 250 ? Math.floor(configured) : 800;
}

export function getHeadlineFlowLinkResolutionMaxAttempts() {
  const configured = Number(env.HEADLINE_FLOW_LINK_RESOLUTION_MAX_ATTEMPTS);
  return Number.isFinite(configured) && configured >= 0 ? Math.min(25, Math.floor(configured)) : 6;
}

export function getHeadlineFlowFeedCacheTtlMs() {
  const configured = Number(env.HEADLINE_FLOW_FEED_CACHE_TTL_MS);
  return Number.isFinite(configured) && configured >= 0 ? Math.min(15 * 60_000, Math.floor(configured)) : 2 * 60_000;
}

export function getHeadlineFlowStaleCacheMaxAgeMs() {
  const configured = Number(env.HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS);
  return Number.isFinite(configured) && configured >= 0 ? Math.min(60 * 60_000, Math.floor(configured)) : 10 * 60_000;
}

export function getHeadlineFlowMinReadyStories() {
  const configured = Number(env.HEADLINE_FLOW_MIN_READY_STORIES);
  return Number.isFinite(configured) && configured >= 1 ? Math.min(25, Math.floor(configured)) : 6;
}

export function getHeadlineFlowMinReadyTopics() {
  const configured = Number(env.HEADLINE_FLOW_MIN_READY_TOPICS);
  return Number.isFinite(configured) && configured >= 1 ? Math.min(9, Math.floor(configured)) : 4;
}

export function headlineFlowFixtureProviderEnabled() {
  const configured = env.HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER?.toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return true;
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return !isProduction();
}

export function getHeadlineFlowAutoFallbackTimeoutMs() {
  const configured = Number(env.HEADLINE_FLOW_AUTO_FALLBACK_TIMEOUT_MS);
  const minimumLiveSearchWindowMs = getHeadlineFlowWebSearchTimeoutMs() + 5_000;
  if (Number.isFinite(configured) && configured >= 1_000) {
    return Math.max(Math.floor(configured), minimumLiveSearchWindowMs);
  }
  return minimumLiveSearchWindowMs;
}

export function getHeadlineFlowInteractionRetentionDays() {
  const configured = Number(env.HEADLINE_FLOW_INTERACTION_RETENTION_DAYS);
  return Number.isFinite(configured) && configured >= 1 ? Math.min(365, Math.floor(configured)) : 90;
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

export function scopeAlertScanningEnabled() {
  const configured = env.SCOPE_ALERT_SCAN_ENABLED?.toLowerCase();
  return configured !== "false" && configured !== "0" && configured !== "no";
}

export function getScopeAlertScanIntervalMs() {
  const configured = Number(env.SCOPE_ALERT_SCAN_INTERVAL_MS);
  return Number.isFinite(configured) && configured >= 60_000 ? Math.floor(configured) : 5 * 60_000;
}

export function getScopeAlertScanConcurrency() {
  const configured = Number(env.SCOPE_ALERT_SCAN_CONCURRENCY);
  return Number.isFinite(configured) && configured >= 1 ? Math.min(32, Math.floor(configured)) : 8;
}

export function getScopeAlertRenotifyAfterMs() {
  const configured = Number(env.SCOPE_ALERT_RENOTIFY_AFTER_MS);
  return Number.isFinite(configured) && configured >= 60_000 ? Math.floor(configured) : 24 * 60 * 60 * 1000;
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

export function featureFlagsEnabled() {
  const configured = env.FEATURE_FLAGS_ENABLED?.toLowerCase();
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return true;
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
