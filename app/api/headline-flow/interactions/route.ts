import { z } from "zod";
import { getHeadlineFlowInteractionRetentionDays } from "@/src/config/env";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { headlineFlowInteractionRepository } from "@/src/server/headline-flow/analytics/interaction-events";

const topicSchema = z.enum(["world", "politics", "business", "technology", "science", "health", "sports", "entertainment", "general"]);

const interactionActionSchema = z.enum([
  "story_opened",
  "source_opened",
  "save",
  "unsave",
  "mute",
  "unmute",
  "resolve",
  "restore",
  "next_story",
  "previous_story",
  "topic_filter_selected",
]);

const bodySchema = z.object({
  action: interactionActionSchema,
  eventId: z.string().trim().min(1).max(120).nullable().optional(),
  storyId: z.string().trim().min(1).max(160).nullable().optional(),
  topic: topicSchema.nullable().optional(),
  providerId: z.string().trim().min(1).max(80).nullable().optional(),
  sourceName: z.string().trim().min(1).max(120).nullable().optional(),
  metadata: z.record(z.string(), z.union([z.string().max(160), z.number(), z.boolean(), z.null()])).optional(),
});

async function loadWindowedSummary(workspaceId: string, userId: string) {
  return headlineFlowInteractionRepository.summarizeWindows({
    workspaceId,
    userId,
    retentionDays: getHeadlineFlowInteractionRetentionDays(),
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = bodySchema.parse(await request.json());
    const event = await headlineFlowInteractionRepository.record({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: body.action,
      eventId: body.eventId,
      storyId: body.storyId,
      topic: body.topic,
      providerId: body.providerId,
      sourceName: body.sourceName,
      metadata: body.metadata,
    });
    const summary = await loadWindowedSummary(user.workspaceId, user.id);

    return apiSuccess({
      workspaceId: user.workspaceId,
      event,
      summary,
    });
  } catch (error) {
    return apiError(error, "Unable to record Headline Flow interaction.");
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const summary = await loadWindowedSummary(user.workspaceId, user.id);

    return apiSuccess({
      workspaceId: user.workspaceId,
      summary,
    });
  } catch (error) {
    return apiError(error, "Unable to load Headline Flow interaction analytics.");
  }
}
