import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { trackEvent } from "@/src/server/observability/analytics";
import { generateWorkspaceInsights } from "@/src/server/services/insight-service";

const insightGenerationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate-direct"), payload: z.object({}).passthrough() }),
  z.object({ action: z.literal("generate-queued"), payload: z.object({}).passthrough() }),
]);

type InsightGenerationActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeInsightGenerationAction(input: unknown, actor: InsightGenerationActor) {
  const request = insightGenerationActionSchema.parse(input);
  await requireWorkspaceMember({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  if (request.action === "generate-queued") {
    const job = queueBackgroundJob(
      "workspace:generate-insights",
      { workspaceId: actor.workspaceId },
      { actorId: actor.id, actorName: actor.name },
      { admissionSource: "governed_insights_api" },
    );
    trackEvent({
      event: "insight_generation_requested",
      actorId: actor.id,
      workspaceId: actor.workspaceId,
      properties: { jobId: job.id },
    });
    return { data: { job }, status: 202 };
  }

  const insights = await generateWorkspaceInsights(actor.workspaceId);
  if (insights.length) {
    trackEvent({
      event: "insight_generated",
      actorId: actor.id,
      workspaceId: actor.workspaceId,
      properties: { count: insights.length },
    });
  }
  return { data: { insights }, status: 201 };
}
