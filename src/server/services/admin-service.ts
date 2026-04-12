import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { createWorkspaceInvite, listWorkspaceInvites, revokeWorkspaceInvite } from "@/src/server/services/invite-service";
import { generateSummaryForView, type SavedTriageView } from "@/src/server/services/summary-service";
import { createTraceId } from "@/src/server/observability/trace-id";
import { isProductionRuntime } from "@/src/lib/server/runtime";

export async function listAdminAccessPayload(currentUser: { workspaceId: string; workspaceName: string }) {
  const [users, workspaces, invites] = await Promise.all([
    prisma.user.findMany({
      include: {
        memberships: {
          include: {
            workspace: true,
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspace.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    listWorkspaceInvites(),
  ]);

  return {
    users: users.map((account: (typeof users)[number]) => {
      const membership = account.memberships.find((item) => item.isDefault) ?? account.memberships[0];
      return {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        status: account.status,
        workspaceId: membership?.workspace.id ?? currentUser.workspaceId,
        workspaceName: membership?.workspace.name ?? currentUser.workspaceName,
        createdAt: account.createdAt.toISOString(),
      };
    }),
    workspaces: workspaces.map((workspace: (typeof workspaces)[number]) => ({
      id: workspace.id,
      name: workspace.name,
      memberCount: workspace._count.members,
    })),
    invites,
  };
}

export async function listAdminIncidentApprovals() {
  const approvals = await prisma.incidentApprovalRequest.findMany({
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return approvals.map((approval) => ({
    id: approval.id,
    workspaceId: approval.workspaceId,
    workspaceName: approval.workspace.name,
    label: approval.label,
    status: approval.status,
    requestedStatus: approval.requestedStatus,
    archiveRationale: approval.archiveRationale,
    approverTarget: approval.approverTarget,
    routingMode: approval.routingMode,
    routingReason: approval.routingReason,
    routedFromTarget: approval.routedFromTarget,
    requestedById: approval.requestedById,
    requestedByName: approval.requestedByName,
    approvedById: approval.approvedById,
    approvedByName: approval.approvedByName,
    rejectedById: approval.rejectedById,
    rejectedByName: approval.rejectedByName,
    rejectionNote: approval.rejectionNote,
    createdAt: approval.createdAt.toISOString(),
    resolvedAt: approval.resolvedAt?.toISOString() ?? null,
  }));
}

export async function updateUserRole(userId: string, role: "viewer" | "operator" | "approver" | "admin") {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function updateUserStatus(userId: string, status: "active" | "disabled") {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function moveUserToWorkspace(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  });

  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const existing = await tx.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (existing) {
      await tx.workspaceMember.update({
        where: { id: existing.id },
        data: { isDefault: true },
      });
      return;
    }

    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId,
        role: "member",
        isDefault: true,
      },
    });
  });

  return workspace;
}

export async function renameWorkspace(workspaceId: string, workspaceName: string) {
  const normalizedName = workspaceName.trim();
  if (!normalizedName) {
    throw new AppError(400, "invalid_workspace_name", "Workspace name cannot be empty.");
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name: normalizedName },
  });
}

export async function createAdminWorkspaceInvite(input: {
  workspaceId: string;
  email?: string | null;
  createdById: string;
}) {
  return createWorkspaceInvite(input);
}

export async function revokeAdminWorkspaceInvite(token: string) {
  return revokeWorkspaceInvite(token);
}

const ADMIN_SUMMARY_CHECK_VIEW: SavedTriageView = {
  name: "Admin AI summary check",
  filter: "all",
  sort: "recent",
  freshnessHours: 72,
};

export async function runAdminAiSummaryCheck(input: {
  workspaceId: string;
  requestedById: string;
  forceFallback?: boolean;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  const traceId = createTraceId("ai");
  if (input.forceFallback && isProductionRuntime()) {
    throw new AppError(403, "fallback_drill_disabled", "AI fallback drills are disabled in production.");
  }

  const summary = await generateSummaryForView(workspace.id, ADMIN_SUMMARY_CHECK_VIEW, {
    traceId,
    forceFallbackReason: input.forceFallback ? "operator_fallback_drill" : undefined,
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: workspace.id,
      userId: input.requestedById,
      type: "admin.summary-check",
      title: summary.title,
      description: `${input.forceFallback ? "Admin AI fallback drill" : "Admin summary check"} completed using ${summary.provider}.`,
      metadata: {
        traceId: summary.traceId,
        provider: summary.provider,
        model: summary.model,
        promptVersion: summary.promptVersion,
        fallbackReason: summary.fallbackReason,
        attempts: summary.attempts,
        latencyMs: summary.latencyMs,
        viewName: ADMIN_SUMMARY_CHECK_VIEW.name,
        forcedFallback: Boolean(input.forceFallback),
      },
    },
  });

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    title: summary.title,
    summary: summary.summary,
    bullets: summary.bullets,
    provider: summary.provider,
    model: summary.model,
    promptVersion: summary.promptVersion,
    attempts: summary.attempts,
    latencyMs: summary.latencyMs,
    fallbackReason: summary.fallbackReason,
    traceId: summary.traceId,
    viewName: ADMIN_SUMMARY_CHECK_VIEW.name,
    forcedFallback: Boolean(input.forceFallback),
  };
}
