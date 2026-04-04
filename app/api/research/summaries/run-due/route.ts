import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import type { ResearchBrief, ResearchReport } from "@/src/lib/types";

const require = createRequire(import.meta.url);
const { listBriefs, saveBriefs, listReports, saveReports } = require("../../../../../services/researchDesk");
const { listTasks } = require("../../../../../services/taskQueue");
const { listReviewItems } = require("../../../../../services/reviewQueue");
const { appendAuditEvent } = require("../../../../../services/auditTrail");

type TriageFilter = "all" | "blocked" | "review" | "publish" | "complete";
type TriageSort = "urgency" | "priority" | "recent";
type SavedTriageView = {
  name: string;
  filter: TriageFilter;
  sort: TriageSort;
  freshnessHours: number;
};
type SummarySchedule = {
  id: string;
  viewName: string;
  cadence: "weekday-morning" | "daily-brief" | "weekly-review";
  destination: "report-draft" | "clipboard-memo";
  lastRunAt?: string | null;
};

const PRIORITY_SCORE: Record<ResearchBrief["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function cadenceIntervalMs(value: SummarySchedule["cadence"]) {
  if (value === "weekly-review") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  return 24 * 60 * 60 * 1000;
}

function isWeekdayMorningDue(lastRunAt?: string | null) {
  const now = new Date();
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isMorningWindow = now.getHours() >= 7;
  if (!isWeekday || !isMorningWindow) {
    return false;
  }

  if (!lastRunAt) {
    return true;
  }

  const lastRun = new Date(lastRunAt);
  return lastRun.toDateString() !== now.toDateString();
}

function isScheduleDue(schedule: SummarySchedule) {
  if (schedule.cadence === "weekday-morning") {
    return isWeekdayMorningDue(schedule.lastRunAt);
  }

  if (!schedule.lastRunAt) {
    return true;
  }

  return Date.now() - new Date(schedule.lastRunAt).getTime() >= cadenceIntervalMs(schedule.cadence);
}

function buildActionableBriefs(
  briefs: ResearchBrief[],
  reports: ResearchReport[],
  queue: Array<{ id: string; status: string }>,
  reviews: Array<{ taskDescription: string }>,
  filter: TriageFilter,
  sort: TriageSort,
  freshnessHours: number
) {
  return briefs
    .map((brief) => {
      const linkedQueueTask = brief.linkedTaskId ? queue.find((task) => task.id === brief.linkedTaskId) : null;
      const linkedReports = reports.filter((report) => report.briefId === brief.id);
      const readyReport = linkedReports.find((report) => report.status === "ready");
      const draftReport = linkedReports.find((report) => report.status === "draft");
      const pendingReview = brief.linkedTaskId
        ? reviews.find((review) => review.taskDescription.includes(brief.title) || review.taskDescription.includes(brief.question))
        : null;

      let urgency = 0;
      let reason = "Monitor progress";

      if (!brief.linkedTaskId && brief.status !== "complete") {
        urgency = 100;
        reason = "Not queued yet";
      } else if (readyReport) {
        urgency = 90;
        reason = `Report "${readyReport.title}" is ready to publish`;
      } else if (pendingReview || brief.status === "in_review") {
        urgency = 80;
        reason = "Editorial review is waiting";
      } else if (draftReport) {
        urgency = 70;
        reason = `Draft report "${draftReport.title}" needs refinement`;
      } else if (linkedQueueTask?.status === "claimed" || brief.status === "in_progress") {
        urgency = 50;
        reason = "Work is actively in progress";
      } else if (brief.status === "complete") {
        urgency = 10;
        reason = "Completed brief";
      }

      return {
        brief,
        linkedReports,
        pendingReview,
        readyReport,
        updatedAtMs: new Date(brief.updatedAt).getTime(),
        priorityScore: PRIORITY_SCORE[brief.priority] || 0,
        urgency,
        reason,
      };
    })
    .filter((item) => {
      if (filter === "blocked") return !item.brief.linkedTaskId && item.brief.status !== "complete";
      if (filter === "review") return Boolean(item.pendingReview) || item.brief.status === "in_review";
      if (filter === "publish") return Boolean(item.readyReport);
      if (filter === "complete") return item.brief.status === "complete";
      return true;
    })
    .filter((item) => Date.now() - item.updatedAtMs <= freshnessHours * 60 * 60 * 1000)
    .sort((a, b) => {
      if (sort === "priority") {
        const diff = b.priorityScore - a.priorityScore;
        if (diff !== 0) return diff;
      }
      if (sort === "recent") {
        const diff = b.updatedAtMs - a.updatedAtMs;
        if (diff !== 0) return diff;
      }
      const diff = b.urgency - a.urgency;
      if (diff !== 0) return diff;
      return b.updatedAtMs - a.updatedAtMs;
    })
    .slice(0, 6);
}

function buildSummaryLines(items: ReturnType<typeof buildActionableBriefs>) {
  const total = items.length;
  const blocked = items.filter((item) => !item.brief.linkedTaskId && item.brief.status !== "complete").length;
  const inReview = items.filter((item) => item.brief.status === "in_review" || item.pendingReview).length;
  const publishReady = items.filter((item) => item.readyReport).length;
  const topItems = items.slice(0, 3).map((item) => `${item.brief.title} (${item.reason.toLowerCase()})`);

  return [
    `${total} briefs match this operator view.`,
    blocked ? `${blocked} need routing before work can continue.` : "No briefs are currently blocked on routing.",
    inReview ? `${inReview} are waiting on editorial review.` : "No briefs are currently waiting on review.",
    publishReady ? `${publishReady} reports are ready to publish.` : "No reports are currently ready to publish.",
    topItems.length ? `Top items: ${topItems.join("; ")}.` : "No immediate follow-ups were surfaced.",
  ];
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    views?: SavedTriageView[];
    schedules?: SummarySchedule[];
    scheduleId?: string;
  };

  const views = Array.isArray(body.views) ? body.views : [];
  const schedules = Array.isArray(body.schedules) ? body.schedules : [];
  const workspaceId = user.workspaceId || user.id;
  const briefs = listBriefs(workspaceId) as ResearchBrief[];
  const reports = listReports(workspaceId) as ResearchReport[];
  const queue = listTasks();
  const reviews = listReviewItems();

  const targetSchedules = schedules.filter((schedule) => {
    if (body.scheduleId) {
      return schedule.id === body.scheduleId;
    }
    return isScheduleDue(schedule);
  });

  const generated: Array<{ scheduleId: string; reportId?: string; title: string; destination: string }> = [];
  const nextSchedules = schedules.map((schedule) => {
    const target = targetSchedules.find((item) => item.id === schedule.id);
    if (!target) {
      return schedule;
    }

    const view = views.find((item) => item.name === target.viewName);
    if (!view) {
      return schedule;
    }

    const items = buildActionableBriefs(briefs, reports, queue, reviews, view.filter, view.sort, view.freshnessHours);
    const lines = buildSummaryLines(items);
    const title = `${target.viewName} Summary`;
    const now = new Date().toISOString();

    if (target.destination === "report-draft") {
      const targetBrief = items.find((item) => item.brief.status !== "complete")?.brief || briefs[0];
      if (targetBrief) {
        const report: ResearchReport = {
          id: randomUUID(),
          briefId: targetBrief.id,
          title,
          format: "briefing",
          status: "draft",
          createdAt: now,
          updatedAt: now,
          excerpt: lines[0],
          keyFindings: lines.slice(1),
        };
        saveReports(workspaceId, [report, ...reports]);
        saveBriefs(
          workspaceId,
          briefs.map((brief) =>
            brief.id === targetBrief.id
              ? {
                  ...brief,
                  status: "in_review",
                  updatedAt: now,
                  summary: `Scheduled summary "${title}" created a new draft report.`,
                }
              : brief
          )
        );
        appendAuditEvent({
          type: "scheduled_summary_generated",
          message: `Generated scheduled summary report for "${target.viewName}".`,
          summary: title,
          payload: { scheduleId: target.id, briefId: targetBrief.id, reportId: report.id },
        });
        generated.push({ scheduleId: target.id, reportId: report.id, title, destination: target.destination });
      }
    } else {
      appendAuditEvent({
        type: "scheduled_summary_due",
        message: `Clipboard summary for "${target.viewName}" is due.`,
        summary: title,
        payload: { scheduleId: target.id },
      });
      generated.push({ scheduleId: target.id, title, destination: target.destination });
    }

    return {
      ...schedule,
      lastRunAt: now,
    };
  });

  return NextResponse.json({
    ok: true,
    schedules: nextSchedules,
    generated,
  });
}
