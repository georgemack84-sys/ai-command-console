import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { headlineFlowEventPreferenceRepository, summarizePreference } from "@/src/server/headline-flow/event-registry/event-preferences";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";

const paramsSchema = z.object({
  eventId: z.string().trim().min(1).max(120),
});

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const params = paramsSchema.parse(await context.params);
    const event = await headlineFlowEventRegistryRepository.findByIdForWorkspace(params.eventId, user.workspaceId);
    if (!event) {
      throw new AppError(404, "headline_flow_event_not_found", "Headline Flow event not found.");
    }
    const preference = await headlineFlowEventPreferenceRepository.findPreference({
      workspaceId: user.workspaceId,
      userId: user.id,
      eventId: event.id,
    });

    return apiSuccess({
      workspaceId: user.workspaceId,
      event,
      preference: summarizePreference(preference),
    });
  } catch (error) {
    return apiError(error, "Unable to load Headline Flow event.");
  }
}
