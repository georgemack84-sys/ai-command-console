import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import type { WorkspaceMemberRole } from "@prisma/client";

const ROLE_RANK: Record<WorkspaceMemberRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export type WorkspacePermissionContext = {
  userId: string;
  userRole: "viewer" | "operator" | "approver" | "admin";
  workspaceId: string;
};

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });
}

export function roleMeetsRequirement(role: WorkspaceMemberRole, minimum: WorkspaceMemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function requireWorkspaceAccess(input: WorkspacePermissionContext) {
  if (input.userRole === "admin") {
    return { role: "admin" as WorkspaceMemberRole };
  }

  const membership = await getWorkspaceMembership(input.workspaceId, input.userId);
  if (!membership) {
    throw new AppError(403, "forbidden", "You do not have access to this workspace.");
  }
  return membership;
}

export async function requireWorkspaceRole(input: WorkspacePermissionContext, minimumRole: WorkspaceMemberRole) {
  const membership = await requireWorkspaceAccess(input);
  if (input.userRole === "admin") {
    return membership;
  }

  if (!roleMeetsRequirement(membership.role, minimumRole)) {
    throw new AppError(403, "forbidden", "Insufficient workspace permissions.");
  }
  return membership;
}

export async function requireWorkspaceManager(input: WorkspacePermissionContext) {
  return requireWorkspaceRole(input, "admin");
}

export async function requireWorkspaceViewer(input: WorkspacePermissionContext) {
  return requireWorkspaceRole(input, "viewer");
}

export async function requireWorkspaceMember(input: WorkspacePermissionContext) {
  return requireWorkspaceRole(input, "member");
}

export async function requireWorkspaceOwner(input: WorkspacePermissionContext) {
  return requireWorkspaceRole(input, "owner");
}
