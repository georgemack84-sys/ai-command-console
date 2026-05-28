import * as Sentry from "@sentry/node";
import { env, getSentryTracesSampleRate, sentryEnabled } from "@/src/config/env";
import { logger } from "@/src/server/observability/logger";

let initialized = false;

export function initSentry() {
  if (initialized || !sentryEnabled()) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    tracesSampleRate: getSentryTracesSampleRate(),
  });
  initialized = true;
  logger.info("Sentry initialized.", {
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    tracesSampleRate: getSentryTracesSampleRate(),
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!sentryEnabled()) {
    return;
  }
  if (!initialized) {
    initSentry();
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  if (!sentryEnabled()) {
    return;
  }
  if (!initialized) {
    initSentry();
  }
  Sentry.captureMessage(message, { extra: context });
}
