import { randomUUID } from "node:crypto";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";

function normalizeInviteEmail(email?: string | null) {
  const value = String(email || "").trim().toLowerCase();
  return value || null;
}

export async function listWorkspaceInvites() {
  const invites = await prisma.workspaceInvite.findMany({
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invites.map((invite: (typeof invites)[number]) => ({
    id: invite.id,
    token: invite.token,
    email: invite.email,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    createdAt: invite.createdAt.toISOString(),
    createdByEmail: invite.createdBy.email,
    status: invite.status,
  }));
}

export async function readInviteByToken(token: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return null;
  }

  return {
    id: invite.id,
    token: invite.token,
    email: invite.email,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    status: invite.status,
    createdAt: invite.createdAt.toISOString(),
  };
}

export async function createWorkspaceInvite(input: {
  workspaceId: string;
  email?: string | null;
  createdById: string;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { id: true, name: true },
  });

  if (!workspace) {
    throw new AppError(404, "workspace_not_found", "Workspace not found.");
  }

  const email = normalizeInviteEmail(input.email);

  const invite = await prisma.workspaceInvite.create({
    data: {
      token: randomUUID(),
      email,
      workspaceId: workspace.id,
      createdById: input.createdById,
      status: "pending",
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
    },
  });

  return {
    id: invite.id,
    token: invite.token,
    email: invite.email,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    createdAt: invite.createdAt.toISOString(),
    createdByEmail: invite.createdBy.email,
    status: invite.status,
  };
}

export async function revokeWorkspaceInvite(token: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!invite) {
    throw new AppError(404, "invite_not_found", "Invite not found.");
  }

  const revoked = await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { status: "revoked" },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
    },
  });

  return {
    id: revoked.id,
    token: revoked.token,
    email: revoked.email,
    workspaceId: revoked.workspaceId,
    workspaceName: revoked.workspace.name,
    createdAt: revoked.createdAt.toISOString(),
    createdByEmail: revoked.createdBy.email,
    status: revoked.status,
  };
}

export async function consumeWorkspaceInvite(token: string, acceptedByUserId: string) {
  const result = await prisma.workspaceInvite.updateMany({
    where: {
      token,
      status: "pending",
    },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
      acceptedByUserId,
    },
  });

  if (result.count === 0) {
    return null;
  }

  const consumed = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  return consumed;
}
