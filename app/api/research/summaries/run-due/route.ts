import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { createSummaryReportForView, generateSummaryForView, isScheduleDue, type SavedTriageView, type SummarySchedule } from "@/src/server/services/summary-service";

const viewSchema = z.object({
  name: z.string(),
  filter: z.enum(["all", "blocked", "review", "publish", "complete"]),
  sort: z.enum(["urgency", "priority", "recent"]),
  freshnessHours: z.number().positive(),
});

const scheduleSchema = z.object({
  id: z.string(),
  viewName: z.string(),
  cadence: z.enum(["weekday-morning", "daily-brief", "weekly-review"]),
  destination: z.enum(["report-draft", "clipboard-memo"]),
  lastRunAt: z.string().nullable().optional(),
});

const bodySchema = z.object({
  views: z.array(viewSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
  scheduleId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = bodySchema.parse(await request.json());
    const views = body.views as SavedTriageView[];
    const schedules = body.schedules as SummarySchedule[];

    const targetSchedules = schedules.filter((schedule) => {
      if (body.scheduleId) {
        return schedule.id === body.scheduleId;
      }
      return isScheduleDue(schedule);
    });

    const generated: Array<{ scheduleId: string; reportId?: string; title: string; destination: string; provider?: string }> = [];

    const nextSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        const target = targetSchedules.find((item) => item.id === schedule.id);
        if (!target) {
          return schedule;
        }

        const view = views.find((item) => item.name === target.viewName);
        if (!view) {
          return schedule;
        }

        const now = new Date().toISOString();
        if (target.destination === "report-draft") {
          const report = await createSummaryReportForView(user.workspaceId, view);
          if (report) {
            generated.push({
              scheduleId: target.id,
              reportId: report.reportId,
              title: report.title,
              destination: report.destination,
              provider: report.provider,
            });
          }
        } else {
          const summary = await generateSummaryForView(user.workspaceId, view);
          generated.push({
            scheduleId: target.id,
            title: summary.title,
            destination: target.destination,
            provider: summary.provider,
          });
        }

        return {
          ...schedule,
          lastRunAt: now,
        };
      }),
    );

    return apiSuccess({
      schedules: nextSchedules,
      generated,
    });
  } catch (error) {
    return apiError(error, "Unable to run scheduled summaries.");
  }
}
