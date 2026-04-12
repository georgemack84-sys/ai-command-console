import { randomUUID } from "node:crypto";
import { prisma } from "@/src/server/db/prisma";
import { generateStructuredSummary } from "@/src/server/services/ai-service";

type TriageFilter = "all" | "blocked" | "review" | "publish" | "complete";
type TriageSort = "urgency" | "priority" | "recent";

export type SavedTriageView = {
  name: string;
  filter: TriageFilter;
  sort: TriageSort;
  freshnessHours: number;
};

export type SummarySchedule = {
  id: string;
  viewName: string;
  cadence: "weekday-morning" | "daily-brief" | "weekly-review";
  destination: "report-draft" | "clipboard-memo";
  lastRunAt?: string | null;
};

const PRIORITY_SCORE = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

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

export function isScheduleDue(schedule: SummarySchedule) {
  if (schedule.cadence === "weekday-morning") {
    return isWeekdayMorningDue(schedule.lastRunAt);
  }
  if (!schedule.lastRunAt) {
    return true;
  }
  return Date.now() - new Date(schedule.lastRunAt).getTime() >= cadenceIntervalMs(schedule.cadence);
}

function buildActionableBriefs(
  briefs: Array<{
    id: string;
    title: string;
    question: string;
    status: "draft" | "queued" | "in_progress" | "in_review" | "complete";
    priority: "low" | "medium" | "high";
    linkedTaskId: string | null;
    updatedAt: Date;
  }>,
  reports: Array<{
    briefId: string;
    title: string;
    status: "draft" | "ready" | "published";
  }>,
  filter: TriageFilter,
  sort: TriageSort,
  freshnessHours: number,
) {
  return briefs
    .map((brief) => {
      const linkedReports = reports.filter((report) => report.briefId === brief.id);
      const readyReport = linkedReports.find((report) => report.status === "ready");
      const draftReport = linkedReports.find((report) => report.status === "draft");

      let urgency = 0;
      let reason = "Monitor progress";

      if (!brief.linkedTaskId && brief.status !== "complete") {
        urgency = 100;
        reason = "Not queued yet";
      } else if (readyReport) {
        urgency = 90;
        reason = `Report "${readyReport.title}" is ready to publish`;
      } else if (brief.status === "in_review") {
        urgency = 80;
        reason = "Editorial review is waiting";
      } else if (draftReport) {
        urgency = 70;
        reason = `Draft report "${draftReport.title}" needs refinement`;
      } else if (brief.status === "in_progress") {
        urgency = 50;
        reason = "Work is actively in progress";
      } else if (brief.status === "complete") {
        urgency = 10;
        reason = "Completed brief";
      }

      return {
        brief,
        linkedReports,
        readyReport,
        updatedAtMs: brief.updatedAt.getTime(),
        priorityScore: PRIORITY_SCORE[brief.priority] || 0,
        urgency,
        reason,
      };
    })
    .filter((item) => {
      if (filter === "blocked") return !item.brief.linkedTaskId && item.brief.status !== "complete";
      if (filter === "review") return item.brief.status === "in_review";
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

export async function generateSummaryForView(
  workspaceId: string,
  view: SavedTriageView,
  options?: { traceId?: string; forceFallbackReason?: string | null; maxAttemptsOverride?: number },
) {
  const [workspace, briefs, reports] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    prisma.researchBrief.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.researchReport.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const items = buildActionableBriefs(briefs, reports, view.filter, view.sort, view.freshnessHours);
  const bulletPoints = items.length
    ? items.map((item) => `${item.brief.title}: ${item.reason}.`)
    : ["No urgent briefs matched the current triage view."];

  return generateStructuredSummary({
    workspaceName: workspace.name,
    summaryType: "triage-brief",
    focus: `${view.name} for ${workspace.name}`,
    bulletPoints,
    traceId: options?.traceId,
  }, {
    forceFallbackReason: options?.forceFallbackReason,
    maxAttemptsOverride: options?.maxAttemptsOverride,
  });
}

export async function createSummaryReportForView(
  workspaceId: string,
  view: SavedTriageView,
  options?: { traceId?: string; maxAttemptsOverride?: number },
) {
  const summary = await generateSummaryForView(workspaceId, view, options);
  const targetBrief =
    (await prisma.researchBrief.findFirst({
      where: {
        workspaceId,
        status: {
          not: "complete",
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    })) ??
    (await prisma.researchBrief.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    }));

  if (!targetBrief) {
    return null;
  }

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.researchReport.create({
      data: {
        id: `scheduled_${randomUUID()}`,
        workspaceId,
        briefId: targetBrief.id,
        ownerId: targetBrief.ownerId,
        title: summary.title,
        format: "briefing",
        status: "draft",
        excerpt: summary.summary,
        keyFindings: summary.bullets,
      },
    });

    await tx.researchBrief.update({
      where: { id: targetBrief.id },
      data: {
        status: "in_review",
        summary: `Scheduled summary "${summary.title}" created a new draft report via ${summary.provider}.`,
      },
    });

    await tx.activityEvent.create({
      data: {
        workspaceId,
        userId: targetBrief.ownerId ?? null,
        type: "summary.generated",
        title: summary.title,
        description: `Scheduled ${view.name} summary generated using ${summary.provider}.`,
        metadata: {
          provider: summary.provider,
          model: summary.model,
          viewName: view.name,
          traceId: summary.traceId,
        },
      },
    });

    return created;
  });

  return {
    reportId: report.id,
    title: summary.title,
    destination: "report-draft" as const,
    provider: summary.provider,
    traceId: summary.traceId,
  };
}
