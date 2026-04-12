import type { Prisma } from "@prisma/client";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  completedByName: string | null;
};

const DEFAULT_CHECKLIST: Array<Pick<ChecklistItem, "id" | "label">> = [
  { id: "owner_assigned", label: "Assign an incident owner" },
  { id: "followup_created", label: "Create a remediation follow-up" },
  { id: "summary_generated", label: "Generate an incident summary" },
  { id: "shared_handoff", label: "Share the incident handoff" },
];

export const SUPPORTED_INCIDENT_STATUSES = [
  "open",
  "investigating",
  "ready_for_closeout",
  "resolved",
  "shared",
  "archived",
] as const;

export type SupportedIncidentStatus = (typeof SUPPORTED_INCIDENT_STATUSES)[number];

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function buildDefaultChecklist(existing?: unknown): ChecklistItem[] {
  const prior = new Map(
    Array.isArray(existing)
      ? existing
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => [String(item.id || ""), item])
      : [],
  );

  return DEFAULT_CHECKLIST.map((item) => {
    const current = prior.get(item.id);
    return {
      id: item.id,
      label: item.label,
      completed: Boolean(current?.completed),
      completedAt: typeof current?.completedAt === "string" ? current.completedAt : null,
      completedByName: typeof current?.completedByName === "string" ? current.completedByName : null,
    };
  });
}

export async function ensureWorkspaceOperationsState(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
      updates: {
        orderBy: { happenedAt: "desc" },
        take: 8,
      },
      insights: {
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
      reports: {
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
    },
  });

  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  const existing = await prisma.workspaceOperationsState.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    return existing;
  }

  const owners = workspace.members.filter((member) => member.user.role === "admin" || member.role === "owner");
  const primaryOwner = owners[0]?.user ?? workspace.members[0]?.user;
  const backupOwner = owners[1]?.user ?? null;
  const latestInsight = workspace.insights[0] ?? null;
  const latestReport = workspace.reports[0] ?? null;
  const criticalUpdates = workspace.updates.filter((update) => update.severity === "critical" || update.severity === "high");

  return prisma.workspaceOperationsState.create({
    data: {
      workspaceId,
      escalationOwner: primaryOwner?.name ?? primaryOwner?.email ?? null,
      incidentApproverTarget: primaryOwner?.email ?? primaryOwner?.name ?? null,
      backupApproverTarget: backupOwner?.email ?? backupOwner?.name ?? null,
      incidentSummary: latestInsight?.summary ?? latestReport?.excerpt ?? workspace.description,
      incidentSummaryUpdatedAt: latestInsight?.updatedAt ?? latestReport?.updatedAt ?? workspace.updatedAt,
      incidentHandoffDraft: latestReport?.excerpt ?? null,
      incidentHandoffDraftUpdatedAt: latestReport?.updatedAt ?? null,
      incidentArchiveRecommendation:
        criticalUpdates.length === 0 ? "Prepare this workspace for archive after the final summary is shared." : null,
      incidentStatus: criticalUpdates.length > 0 ? "investigating" : "open",
      incidentStatusUpdatedAt: workspace.updatedAt,
      incidentChecklist: asJson(buildDefaultChecklist()),
      lastGeneratedCount: workspace.insights.length,
    },
  });
}

export async function recordWorkspaceOperationActivity(input: {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      metadata: asJson(input.metadata ?? {}),
    },
  });
}

export async function updateWorkspaceChecklistItem(
  workspaceId: string,
  itemId: string,
  completed: boolean,
  completedByName: string,
) {
  const state = await ensureWorkspaceOperationsState(workspaceId);
  const nextChecklist = buildDefaultChecklist(state.incidentChecklist).map((item) =>
    item.id === itemId
      ? {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          completedByName: completed ? completedByName : null,
        }
      : item,
  );

  return prisma.workspaceOperationsState.update({
    where: { workspaceId },
    data: {
      incidentChecklist: asJson(nextChecklist),
      updatedAt: new Date(),
    },
  });
}
