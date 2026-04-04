import { createRequire } from "node:module";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";

const require = createRequire(import.meta.url);
const { listBriefs, listReports } = require("../../../../../services/researchDesk");
const { listAuditEvents } = require("../../../../../services/auditTrail");
const { listReviewItems } = require("../../../../../services/reviewQueue");
const { getTaskById } = require("../../../../../services/taskQueue");

function getWorkspaceId(user: { workspaceId?: string; id?: string } | null) {
  return user?.workspaceId || user?.id || "default";
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = getWorkspaceId(user);
  const briefs = listBriefs(workspaceId);
  const brief = briefs.find((item: { id: string }) => item.id === id);

  if (!brief) {
    return NextResponse.json({ error: "Brief not found." }, { status: 404 });
  }

  const reports = listReports(workspaceId).filter((report: { briefId: string }) => report.briefId === brief.id);
  const task = brief.linkedTaskId ? getTaskById(brief.linkedTaskId) : null;
  const reviews = brief.linkedTaskId
    ? listReviewItems().filter((item: { taskId: string; followupTaskId?: string | null }) => {
        return item.taskId === brief.linkedTaskId || item.followupTaskId === brief.linkedTaskId;
      })
    : [];
  const activity = listAuditEvents(200).filter((entry: { payload?: Record<string, unknown>; summary?: string; message?: string }) => {
    const payload = entry.payload || {};
    return (
      payload.briefId === brief.id ||
      payload.taskId === brief.linkedTaskId ||
      payload.reportId && reports.some((report: { id: string }) => report.id === payload.reportId) ||
      String(entry.summary || "").includes(brief.title) ||
      String(entry.message || "").includes(brief.id)
    );
  });

  return NextResponse.json({
    brief,
    task,
    reports,
    reviews,
    activity,
  });
}
