import { PostHog } from "posthog-node";
import { env, posthogEnabled } from "@/src/config/env";
import { logger } from "@/src/server/observability/logger";

let client: PostHog | null = null;

function getClient() {
  if (!posthogEnabled()) {
    return null;
  }

  if (!client) {
    client = new PostHog(env.POSTHOG_API_KEY as string, {
      host: env.POSTHOG_HOST || "https://app.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
    logger.info("PostHog initialized.", {
      host: env.POSTHOG_HOST || "https://app.posthog.com",
    });
  }

  return client;
}

export function trackPosthogEvent(input: {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}) {
  const active = getClient();
  if (!active) {
    return false;
  }

  active.capture({
    distinctId: input.distinctId,
    event: input.event,
    properties: input.properties ?? {},
  });

  return true;
}
