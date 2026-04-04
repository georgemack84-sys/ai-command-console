import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import type { ResearchBrief, ResearchBriefStatus, ResearchPriority } from "@/src/lib/types";

const require = createRequire(import.meta.url);
const { addTask } = require("../../../../services/taskQueue");
const { appendAuditEvent } = require("../../../../services/auditTrail");
const { listBriefs, saveBriefs } = require("../../../../services/researchDesk");

function numericPriority(priority: ResearchPriority) {
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  return 3;
}

function queueTaskForBrief(brief: ResearchBrief) {
  const task = addTask(brief.assignedAgent, `${brief.title}: ${brief.question}`, {
    priority: numericPriority(brief.priority),
    sourceAgent: "research-desk",
    delegationReason: `Queued from research brief ${brief.id}.`,
    tags: ["research-brief", ...brief.tags],
    notifyAgent: "manager",
    callbackEnabled: true,
  });

  appendAuditEvent({
    type: "research_brief_queued",
    message: `Queued research brief ${brief.id} for ${brief.assignedAgent}.`,
    summary: brief.title,
    payload: { briefId: brief.id, taskId: task.id, agentName: brief.assignedAgent },
  });

  return task;
}

function getWorkspaceId(user: { workspaceId?: string; id?: string } | null) {
  return user?.workspaceId || user?.id || "default";
}

function canManageResource(ownerId: string | undefined, userId: string, role: string) {
  return !ownerId || ownerId === userId || role === "admin";
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ briefs: [] }, { status: 401 });
  }

  const briefs = listBriefs(getWorkspaceId(user));
  return NextResponse.json({ briefs });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ResearchBrief> & { queueBrief?: boolean };
  if (!body.title?.trim() || !body.question?.trim()) {
    return NextResponse.json({ error: "Title and question are required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const status = body.queueBrief ? "queued" : ((body.status as ResearchBriefStatus) || "draft");
  let brief: ResearchBrief = {
    id: body.id || randomUUID(),
    title: body.title.trim(),
    question: body.question.trim(),
    status,
    priority: (body.priority as ResearchPriority) || "medium",
    assignedAgent: body.assignedAgent?.trim() || "researcher",
    tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).map((tag) => String(tag).trim()) : [],
    createdAt: body.createdAt || now,
    updatedAt: now,
    ownerId: user.id,
    ownerName: user.name,
    summary: body.summary?.trim() || "New research brief created from the desk.",
    linkedTaskId: null,
  };

  if (body.queueBrief) {
    const task = queueTaskForBrief(brief);
    brief = { ...brief, linkedTaskId: task.id };
  }

  const workspaceId = getWorkspaceId(user);
  const current = listBriefs(workspaceId);
  const next = [brief, ...current.filter((item: ResearchBrief) => item.id !== brief.id)];
  saveBriefs(workspaceId, next);
  return NextResponse.json({ briefs: next });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ResearchBrief> & { id?: string; routeToQueue?: boolean };
  if (!body.id) {
    return NextResponse.json({ error: "Brief id is required." }, { status: 400 });
  }

  const workspaceId = getWorkspaceId(user);
  const current = listBriefs(workspaceId);
  const existing = current.find((brief: ResearchBrief) => brief.id === body.id);
  if (existing && !canManageResource(existing.ownerId, user.id, user.role)) {
    return NextResponse.json({ error: "Only the owner or an admin can update this brief." }, { status: 403 });
  }
  let routedTaskId: string | null = null;
  const next = current.map((brief: ResearchBrief) => {
    if (brief.id !== body.id) {
      return brief;
    }

    let updated: ResearchBrief = {
      ...brief,
      ...(body.title ? { title: body.title.trim() } : {}),
      ...(body.question ? { question: body.question.trim() } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.assignedAgent ? { assignedAgent: body.assignedAgent.trim() } : {}),
      ...(body.tags ? { tags: body.tags.filter(Boolean).map((tag) => String(tag).trim()) } : {}),
      ...(body.summary ? { summary: body.summary.trim() } : {}),
      ...(user.role === "admin" && body.ownerId ? { ownerId: body.ownerId } : {}),
      ...(user.role === "admin" && body.ownerName ? { ownerName: body.ownerName.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    if (user.role === "admin" && body.ownerId && body.ownerId !== brief.ownerId) {
      appendAuditEvent({
        type: "admin:brief-owner-reassigned",
        message: `Reassigned brief ${brief.title} to ${body.ownerName || body.ownerId}.`,
        payload: {
          actorId: user.id,
          briefId: brief.id,
          briefTitle: brief.title,
          previousOwnerId: brief.ownerId || null,
          previousOwnerName: brief.ownerName || null,
          nextOwnerId: body.ownerId,
          nextOwnerName: body.ownerName || null,
        },
      });
    }

    if (body.routeToQueue) {
      const task = queueTaskForBrief({ ...updated, status: "queued" });
      routedTaskId = task.id;
      updated = {
        ...updated,
        status: "queued",
        linkedTaskId: task.id,
      };
    }

    return updated;
  });

  saveBriefs(workspaceId, next);
  if (body.routeToQueue && routedTaskId) {
    appendAuditEvent({
      type: "research_brief_routed",
      message: `Routed research brief ${body.id} into the task queue.`,
      payload: { briefId: body.id, taskId: routedTaskId },
    });
  }
  return NextResponse.json({ briefs: next });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { briefId } = (await request.json()) as { briefId?: string };
  const workspaceId = getWorkspaceId(user);
  const current = listBriefs(workspaceId);
  const target = current.find((brief: ResearchBrief) => brief.id === briefId);
  if (target && !canManageResource(target.ownerId, user.id, user.role)) {
    return NextResponse.json({ error: "Only the owner or an admin can delete this brief." }, { status: 403 });
  }
  const next = current.filter((brief: ResearchBrief) => brief.id !== briefId);
  saveBriefs(workspaceId, next);
  return NextResponse.json({ briefs: next });
}
