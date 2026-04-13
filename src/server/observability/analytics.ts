import { trackPosthogEvent } from "@/src/server/observability/posthog";

export function trackEvent(input: {
  event: string;
  actorId: string;
  workspaceId?: string | null;
  properties?: Record<string, unknown>;
}) {
  return trackPosthogEvent({
    event: input.event,
    distinctId: input.actorId,
    properties: {
      workspaceId: input.workspaceId || null,
      ...(input.properties ?? {}),
    },
  });
}
