import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { createWorkspaceInvite, revokeWorkspaceInvite } from "@/src/server/services/invite-service";
import type { WorkspaceApiSnapshot } from "@/src/types/platform";

export async function getWorkspaceSnapshot(workspaceId: string): Promise<WorkspaceApiSnapshot> {
  const [workspace, alerts] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: {
        members: true,
        sources: {
          orderBy: { updatedAt: "desc" },
        },
        updates: {
          orderBy: { happenedAt: "desc" },
          take: 8,
        },
        insights: {
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        activity: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.alert.findMany({
      where: { workspaceId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      memberCount: workspace.members.length,
    },
    sources: workspace.sources.map((source) => ({
      id: source.id,
      name: source.name,
      status: source.status,
      type: source.type,
      updateCadence: source.updateCadence,
      description: source.description,
      url: source.url,
    })),
    updates: workspace.updates.map((update) => ({
      id: update.id,
      title: update.title,
      summary: update.summary,
      severity: update.severity,
      category: update.category,
      happenedAt: update.happenedAt.toISOString(),
    })),
    insights: workspace.insights.map((insight) => ({
      id: insight.id,
      title: insight.title,
      summary: insight.summary,
      type: insight.type,
      confidence: insight.confidence,
      score: insight.score ?? 0,
      createdAt: insight.createdAt.toISOString(),
    })),
    activity: workspace.activity.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      createdAt: event.createdAt.toISOString(),
    })),
    alerts: alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
      readAt: alert.readAt?.toISOString() ?? null,
    })),
  };
}

export async function getWorkspaceSettingsSnapshot(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
      invites: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  const membership = workspace.members.find((item) => item.userId === userId) ?? null;

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      plan: workspace.plan,
    },
    membershipRole: membership?.role ?? null,
    members: workspace.members.map((item) => ({
      id: item.user.id,
      name: item.user.name,
      email: item.user.email,
      role: item.role,
      isDefault: item.isDefault,
    })),
    invites: workspace.invites.map((invite) => ({
      id: invite.id,
      token: invite.token,
      email: invite.email,
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
    })),
  };
}

async function requireWorkspaceManager(input: {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
}) {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      userId: input.userId,
    },
  });

  if (!membership) {
    throw new AppError(403, "forbidden", "You do not have access to this workspace.");
  }

  const canManageWorkspace = input.userRole === "admin" || membership.role === "owner" || membership.role === "admin";
  if (!canManageWorkspace) {
    throw new AppError(403, "forbidden", "Only workspace owners or admins can update workspace settings.");
  }

  return membership;
}

export async function updateWorkspaceSettings(input: {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
  workspaceName?: string;
}) {
  await requireWorkspaceManager(input);

  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { id: true, name: true },
  });

  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (typeof input.workspaceName === "string" && input.workspaceName.trim()) {
      await tx.workspace.update({
        where: { id: input.workspaceId },
        data: { name: input.workspaceName.trim() },
      });
    }

    await tx.activityEvent.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        type: "workspace.settings_updated",
        title: "Workspace settings updated",
        description: `Updated settings for ${input.workspaceName?.trim() || workspace.name}.`,
        metadata: {
          workspaceName: input.workspaceName?.trim() || null,
        },
      },
    });
  });

  return getWorkspaceSettingsSnapshot(input.userId, input.workspaceId);
}

export async function createWorkspaceSettingsInvite(input: {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
  email?: string | null;
}) {
  await requireWorkspaceManager(input);

  const invite = await createWorkspaceInvite({
    workspaceId: input.workspaceId,
    email: input.email,
    createdById: input.userId,
  });

  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: "workspace.invite_created",
      title: "Workspace invite created",
      description: `Created ${invite.email ? `an invite for ${invite.email}` : "an open workspace invite"}.`,
      metadata: {
        inviteToken: invite.token,
        inviteEmail: invite.email,
      },
    },
  });

  return invite;
}

export async function revokeWorkspaceSettingsInvite(input: {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
  token: string;
}) {
  await requireWorkspaceManager(input);

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token: input.token },
    select: { workspaceId: true, email: true },
  });

  if (!invite || invite.workspaceId !== input.workspaceId) {
    throw new AppError(404, "invite_not_found", "Invite not found for this workspace.");
  }

  const revoked = await revokeWorkspaceInvite(input.token);

  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: "workspace.invite_revoked",
      title: "Workspace invite revoked",
      description: `Revoked ${revoked.email ? `the invite for ${revoked.email}` : "an open workspace invite"}.`,
      metadata: {
        inviteToken: revoked.token,
        inviteEmail: revoked.email,
      },
    },
  });

  return revoked;
}
