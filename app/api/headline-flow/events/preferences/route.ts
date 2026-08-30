import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { headlineFlowEventPreferenceRepository, summarizePreference } from "@/src/server/headline-flow/event-registry/event-preferences";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const [preferences, events] = await Promise.all([
      headlineFlowEventPreferenceRepository.listUserPreferences({
        workspaceId: user.workspaceId,
        userId: user.id,
      }),
      headlineFlowEventRegistryRepository.listByWorkspace(user.workspaceId),
    ]);
    const eventsById = new Map(events.map((event) => [event.id, event]));

    return apiSuccess({
      workspaceId: user.workspaceId,
      events: preferences
        .map((preference) => {
          const event = eventsById.get(preference.eventId);
          if (!event) {
            return null;
          }
          return {
            event,
            preference: summarizePreference(preference),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    });
  } catch (error) {
    return apiError(error, "Unable to load Headline Flow event preferences.");
  }
}
