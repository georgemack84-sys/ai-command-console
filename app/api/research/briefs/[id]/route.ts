import { prisma } from "@/src/server/db/prisma";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";

function mapTaskStatus(status: string) {
  if (status === "complete") return "completed";
  if (status === "queued") return "queued";
  if (status === "in_review") return "reviewing";
  if (status === "in_progress") return "claimed";
  return status;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { id } = await context.params;
    const brief = await prisma.researchBrief.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!brief) {
      throw new AppError(404, "brief_not_found", "Brief not found.");
    }

    const [reports, activity] = await Promise.all([
      prisma.researchReport.findMany({
        where: {
          workspaceId: user.workspaceId,
          briefId: brief.id,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.activityEvent.findMany({
        where: {
          workspaceId: user.workspaceId,
          OR: [
            { title: { contains: brief.title, mode: "insensitive" } },
            { description: { contains: brief.id, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    const routeActivity = activity.find((entry) => entry.type === "research.brief.routed");
    const followupActivity = activity.find((entry) => entry.type === "research.review.followup_created");
    const reportPublishActivity = activity.find((entry) => entry.type === "research.report.published");

    const task = brief.linkedTaskId
      ? {
          id: brief.linkedTaskId,
          agentName:
            (followupActivity?.metadata &&
            typeof followupActivity.metadata === "object" &&
            !Array.isArray(followupActivity.metadata) &&
            typeof followupActivity.metadata.agentName === "string"
              ? followupActivity.metadata.agentName
              : brief.assignedAgent),
          description:
            (followupActivity?.metadata &&
            typeof followupActivity.metadata === "object" &&
            !Array.isArray(followupActivity.metadata) &&
            typeof followupActivity.metadata.description === "string"
              ? followupActivity.metadata.description
              : `Investigate brief: ${brief.question}`),
          status: mapTaskStatus(brief.status),
          priority: brief.priority === "high" ? 1 : brief.priority === "medium" ? 2 : 3,
          createdAt: routeActivity?.createdAt.toISOString() || brief.updatedAt.toISOString(),
          claimedAt: ["in_progress", "in_review", "complete"].includes(brief.status)
            ? routeActivity?.createdAt.toISOString() || brief.updatedAt.toISOString()
            : null,
          completedAt: brief.status === "complete" ? reportPublishActivity?.createdAt.toISOString() || brief.updatedAt.toISOString() : null,
          result: reportPublishActivity ? reportPublishActivity.description : brief.summary,
        }
      : null;

    const reviews = activity
      .filter((entry) => entry.type === "research.review.created" || entry.type === "research.review.followup_created")
      .map((entry) => {
        const metadata =
          entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata) ? entry.metadata : {};

        return {
          id: entry.id,
          taskId: typeof metadata.taskId === "string" ? metadata.taskId : brief.linkedTaskId || brief.id,
          status: entry.type === "research.review.followup_created" ? "reviewed" : "pending",
          decision: entry.type === "research.review.followup_created" ? "followup_created" : null,
          decisionNote:
            typeof metadata.description === "string"
              ? metadata.description
              : entry.type === "research.review.followup_created"
                ? entry.description
                : null,
          reviewedAt: entry.type === "research.review.followup_created" ? entry.createdAt.toISOString() : null,
          createdAt: entry.createdAt.toISOString(),
        };
      });

    return apiSuccess({
      brief: {
        ...brief,
        createdAt: brief.createdAt.toISOString(),
        updatedAt: brief.updatedAt.toISOString(),
      },
      task,
      reports: reports.map((report) => ({
        ...report,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      })),
      reviews,
      activity: activity.map((entry) => ({
        id: entry.id,
        timestamp: entry.createdAt.toISOString(),
        type: entry.type,
        message: entry.title,
        summary: entry.description,
      })),
    });
  } catch (error) {
    return apiError(error, "Unable to load brief detail.");
  }
}
