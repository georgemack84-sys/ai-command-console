import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { z } from "zod";
import { trackEvent } from "@/src/server/observability/analytics";

const postSchema = z.object({
  async: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const snapshot = await getWorkspaceSnapshot(user.workspaceId);
    return apiSuccess({ insights: snapshot.insights });
  } catch (error) {
    return apiError(error, "Unable to load insights.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = postSchema.parse(await request.json().catch(() => ({})));
    if (body.async) {
      const job = queueBackgroundJob(
        "workspace:generate-insights",
        { workspaceId: user.workspaceId },
        { actorId: user.id, actorName: user.name },
      );
      trackEvent({
        event: "insight_generation_requested",
        actorId: user.id,
        workspaceId: user.workspaceId,
        properties: { jobId: job.id },
      });
      return apiSuccess({ job }, { status: 202 });
    }

    const insights = await generateWorkspaceInsights(user.workspaceId);
    if (insights.length) {
      trackEvent({
        event: "insight_generated",
        actorId: user.id,
        workspaceId: user.workspaceId,
        properties: { count: insights.length },
      });
    }
    return apiSuccess({ insights }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to generate insights.");
  }
}
