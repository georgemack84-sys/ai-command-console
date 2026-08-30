import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { headlineFlowEventPreferenceRepository, summarizePreference } from "@/src/server/headline-flow/event-registry/event-preferences";

const paramsSchema = z.object({
  eventId: z.string().trim().min(1).max(120),
});

const bodySchema = z.object({
  action: z.enum(["save", "unsave", "mute", "unmute", "resolve", "restore"]),
});

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const params = paramsSchema.parse(await context.params);
    const body = bodySchema.parse(await request.json());
    const preference = await headlineFlowEventPreferenceRepository.applyAction({
      workspaceId: user.workspaceId,
      userId: user.id,
      eventId: params.eventId,
      action: body.action,
    });

    return apiSuccess({
      workspaceId: user.workspaceId,
      eventId: params.eventId,
      action: body.action,
      preference: summarizePreference(preference),
    });
  } catch (error) {
    return apiError(error, "Unable to update Headline Flow event preference.");
  }
}
