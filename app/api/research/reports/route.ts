import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import type { ResearchBrief, ResearchReport } from "@/src/lib/types";
import { appendAuditEvent } from "@/services/auditTrail";

const require = createRequire(import.meta.url);
const { listBriefs, saveBriefs, listReports, saveReports } = require("../../../../services/researchDesk");

function getWorkspaceId(user: { workspaceId?: string; id?: string } | null) {
  return user?.workspaceId || user?.id || "default";
}

function canManageResource(ownerId: string | undefined, userId: string, role: string) {
  return !ownerId || ownerId === userId || role === "admin";
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ reports: [] }, { status: 401 });
  }

  const reports = listReports(getWorkspaceId(user));
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ResearchReport>;
  if (!body.title?.trim() || !body.briefId?.trim()) {
    return NextResponse.json({ error: "Title and brief id are required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const report: ResearchReport = {
    id: body.id || randomUUID(),
    briefId: body.briefId.trim(),
    title: body.title.trim(),
    format: body.format || "memo",
    status: body.status || "draft",
    createdAt: body.createdAt || now,
    updatedAt: now,
    ownerId: user.id,
    ownerName: user.name,
    excerpt: body.excerpt?.trim() || "Draft report created from the research desk.",
    keyFindings: Array.isArray(body.keyFindings)
      ? body.keyFindings.filter(Boolean).map((item) => String(item).trim())
      : [],
  };

  const workspaceId = getWorkspaceId(user);
  const current = listReports(workspaceId);
  const next = [report, ...current.filter((item: ResearchReport) => item.id !== report.id)];
  saveReports(workspaceId, next);
  const briefs = listBriefs(workspaceId);
  const nextBriefs = briefs.map((brief: ResearchBrief) =>
    brief.id === report.briefId
      ? {
          ...brief,
          status: "in_review",
          updatedAt: new Date().toISOString(),
          summary: `Report draft "${report.title}" created and waiting for editorial review.`,
        }
      : brief,
  );
  saveBriefs(workspaceId, nextBriefs);
  return NextResponse.json({ reports: next });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ResearchReport> & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Report id is required." }, { status: 400 });
  }

  const workspaceId = getWorkspaceId(user);
  const current = listReports(workspaceId);
  const existing = current.find((report: ResearchReport) => report.id === body.id);
  if (existing && !canManageResource(existing.ownerId, user.id, user.role)) {
    return NextResponse.json({ error: "Only the owner or an admin can update this report." }, { status: 403 });
  }
  const next = current.map((report: ResearchReport) =>
    report.id === body.id
      ? (() => {
          if (user.role === "admin" && body.ownerId && body.ownerId !== report.ownerId) {
            appendAuditEvent({
              type: "admin:report-owner-reassigned",
              message: `Reassigned report ${report.title} to ${body.ownerName || body.ownerId}.`,
              payload: {
                actorId: user.id,
                reportId: report.id,
                reportTitle: report.title,
                previousOwnerId: report.ownerId || null,
                previousOwnerName: report.ownerName || null,
                nextOwnerId: body.ownerId,
                nextOwnerName: body.ownerName || null,
              },
            });
          }

          return {
          ...report,
          ...(body.title ? { title: body.title.trim() } : {}),
          ...(body.briefId ? { briefId: body.briefId.trim() } : {}),
          ...(body.format ? { format: body.format } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(body.excerpt ? { excerpt: body.excerpt.trim() } : {}),
          ...(body.keyFindings ? { keyFindings: body.keyFindings.filter(Boolean).map((item) => String(item).trim()) } : {}),
          ...(user.role === "admin" && body.ownerId ? { ownerId: body.ownerId } : {}),
          ...(user.role === "admin" && body.ownerName ? { ownerName: body.ownerName.trim() } : {}),
          updatedAt: new Date().toISOString(),
        };
        })()
      : report,
  );

  saveReports(workspaceId, next);
  const changed = next.find((report: ResearchReport) => report.id === body.id);
  if (changed?.status === "published") {
    const briefs = listBriefs(workspaceId);
    const nextBriefs = briefs.map((brief: ResearchBrief) =>
      brief.id === changed.briefId
        ? {
            ...brief,
            status: "complete",
            updatedAt: new Date().toISOString(),
            summary: `Published report "${changed.title}" completed this brief.`,
          }
        : brief,
    );
    saveBriefs(workspaceId, nextBriefs);
  }
  return NextResponse.json({ reports: next });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { reportId } = (await request.json()) as { reportId?: string };
  const workspaceId = getWorkspaceId(user);
  const current = listReports(workspaceId);
  const target = current.find((report: ResearchReport) => report.id === reportId);
  if (target && !canManageResource(target.ownerId, user.id, user.role)) {
    return NextResponse.json({ error: "Only the owner or an admin can delete this report." }, { status: 403 });
  }
  const next = current.filter((report: ResearchReport) => report.id !== reportId);
  saveReports(workspaceId, next);
  return NextResponse.json({ reports: next });
}
