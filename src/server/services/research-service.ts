import type { BriefPriority, BriefStatus, ReportFormat, ReportStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { ResearchBrief, ResearchReport } from "../../lib/types";
import { AppError } from "../api/errors";

function mapBrief(brief: {
  id: string;
  title: string;
  question: string;
  status: BriefStatus;
  priority: BriefPriority;
  assignedAgent: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  ownerId: string | null;
  summary: string;
  linkedTaskId: string | null;
}): ResearchBrief {
  return {
    id: brief.id,
    title: brief.title,
    question: brief.question,
    status: brief.status,
    priority: brief.priority,
    assignedAgent: brief.assignedAgent,
    tags: brief.tags,
    createdAt: brief.createdAt.toISOString(),
    updatedAt: brief.updatedAt.toISOString(),
    ownerId: brief.ownerId ?? undefined,
    ownerName: undefined,
    summary: brief.summary,
    linkedTaskId: brief.linkedTaskId,
  };
}

function mapReport(report: {
  id: string;
  briefId: string;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string | null;
  excerpt: string;
  keyFindings: string[];
}): ResearchReport {
  return {
    id: report.id,
    briefId: report.briefId,
    title: report.title,
    format: report.format,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    ownerId: report.ownerId ?? undefined,
    ownerName: undefined,
    excerpt: report.excerpt,
    keyFindings: report.keyFindings,
  };
}

export async function listBriefs(workspaceId: string) {
  const briefs = await prisma.researchBrief.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  return briefs.map(mapBrief);
}

export async function createBrief(input: {
  workspaceId: string;
  ownerId: string;
  title: string;
  question: string;
  status: BriefStatus;
  priority: BriefPriority;
  assignedAgent: string;
  tags: string[];
  summary: string;
  linkedTaskId?: string | null;
}) {
  const brief = await prisma.researchBrief.create({
    data: input,
  });
  return mapBrief(brief);
}

export async function updateBrief(input: {
  workspaceId: string;
  briefId: string;
  actorId: string;
  actorRole: string;
  patch: Partial<{
    title: string;
    question: string;
    status: BriefStatus;
    priority: BriefPriority;
    assignedAgent: string;
    tags: string[];
    summary: string;
    ownerId: string | null;
    linkedTaskId: string | null;
  }>;
}) {
  const existing = await prisma.researchBrief.findFirst({
    where: { id: input.briefId, workspaceId: input.workspaceId },
  });
  if (!existing) {
    throw new AppError(404, "brief_not_found", "Brief not found.");
  }
  if (existing.ownerId && existing.ownerId !== input.actorId && input.actorRole !== "admin") {
    throw new AppError(403, "brief_forbidden", "Only the owner or an admin can update this brief.");
  }

  const brief = await prisma.researchBrief.update({
    where: { id: input.briefId },
    data: input.patch,
  });
  return mapBrief(brief);
}

export async function deleteBrief(workspaceId: string, briefId: string, actorId: string, actorRole: string) {
  const existing = await prisma.researchBrief.findFirst({
    where: { id: briefId, workspaceId },
  });
  if (!existing) {
    return;
  }
  if (existing.ownerId && existing.ownerId !== actorId && actorRole !== "admin") {
    throw new AppError(403, "brief_forbidden", "Only the owner or an admin can delete this brief.");
  }
  await prisma.researchBrief.delete({ where: { id: briefId } });
}

export async function listReports(workspaceId: string) {
  const reports = await prisma.researchReport.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  return reports.map(mapReport);
}

export async function createReport(input: {
  workspaceId: string;
  briefId: string;
  ownerId: string;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  excerpt: string;
  keyFindings: string[];
}) {
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.researchReport.create({
      data: input,
    });
    await tx.researchBrief.update({
      where: { id: input.briefId },
      data: {
        status: "in_review",
        summary: `Report draft "${input.title}" created and waiting for editorial review.`,
      },
    });
    return created;
  });
  return mapReport(report);
}

export async function updateReport(input: {
  workspaceId: string;
  reportId: string;
  actorId: string;
  actorRole: string;
  patch: Partial<{
    title: string;
    briefId: string;
    format: ReportFormat;
    status: ReportStatus;
    excerpt: string;
    keyFindings: string[];
    ownerId: string | null;
  }>;
}) {
  const existing = await prisma.researchReport.findFirst({
    where: { id: input.reportId, workspaceId: input.workspaceId },
  });
  if (!existing) {
    throw new AppError(404, "report_not_found", "Report not found.");
  }
  if (existing.ownerId && existing.ownerId !== input.actorId && input.actorRole !== "admin") {
    throw new AppError(403, "report_forbidden", "Only the owner or an admin can update this report.");
  }

  const report = await prisma.$transaction(async (tx) => {
    const updated = await tx.researchReport.update({
      where: { id: input.reportId },
      data: input.patch,
    });
    if (input.patch.status === "published") {
      await tx.researchBrief.update({
        where: { id: updated.briefId },
        data: {
          status: "complete",
          summary: `Published report "${updated.title}" completed this brief.`,
        },
      });
    }
    return updated;
  });

  return mapReport(report);
}

export async function deleteReport(workspaceId: string, reportId: string, actorId: string, actorRole: string) {
  const existing = await prisma.researchReport.findFirst({
    where: { id: reportId, workspaceId },
  });
  if (!existing) {
    return;
  }
  if (existing.ownerId && existing.ownerId !== actorId && actorRole !== "admin") {
    throw new AppError(403, "report_forbidden", "Only the owner or an admin can delete this report.");
  }
  await prisma.researchReport.delete({ where: { id: reportId } });
}
