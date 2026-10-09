import { z } from "zod";
import type { SessionUser } from "@/src/lib/types";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  createSummaryReportForView,
  generateSummaryForView,
  isScheduleDue,
} from "@/src/server/services/summary-service";

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

export const scheduledSummaryActionSchema = z.object({
  views: z.array(viewSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
  scheduleId: z.string().optional(),
  confirmed: z.boolean().optional(),
});

type ScheduledSummaryActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeScheduledSummaryAction(input: unknown, actor: ScheduledSummaryActor) {
  const body = scheduledSummaryActionSchema.parse(input);
  await requireWorkspaceMember({
    userId: actor.id,
    userRole: actor.role,
    workspaceId: actor.workspaceId,
  });

  const targetScheduleIds = new Set(
    body.schedules
      .filter((schedule) => (body.scheduleId ? schedule.id === body.scheduleId : isScheduleDue(schedule)))
      .map((schedule) => schedule.id),
  );
  const viewsByName = new Map(body.views.map((view) => [view.name, view]));
  const generated: Array<{
    scheduleId: string;
    reportId?: string;
    title: string;
    destination: string;
    provider?: string;
  }> = [];

  const nextSchedules = await Promise.all(
    body.schedules.map(async (schedule) => {
      if (!targetScheduleIds.has(schedule.id)) {
        return schedule;
      }
      const view = viewsByName.get(schedule.viewName);
      if (!view) {
        return schedule;
      }

      const now = new Date().toISOString();
      if (schedule.destination === "report-draft") {
        const report = await createSummaryReportForView(actor.workspaceId, view);
        if (report) {
          generated.push({
            scheduleId: schedule.id,
            reportId: report.reportId,
            title: report.title,
            destination: report.destination,
            provider: report.provider,
          });
        }
      } else {
        const summary = await generateSummaryForView(actor.workspaceId, view);
        generated.push({
          scheduleId: schedule.id,
          title: summary.title,
          destination: schedule.destination,
          provider: summary.provider,
        });
      }

      return { ...schedule, lastRunAt: now };
    }),
  );

  return { data: { schedules: nextSchedules, generated } };
}
