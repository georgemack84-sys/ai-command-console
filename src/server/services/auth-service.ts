import { createHash } from "node:crypto";
import type { User, WorkspaceMember } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser, UserAccount, UserRole } from "@/src/lib/types";
import { createPasswordHash, verifyPassword } from "@/src/server/auth/password";

type UserWithMemberships = User & {
  memberships: Array<WorkspaceMember & { workspace: { id: string; name: string } }>;
};

function getDefaultMembership(user: UserWithMemberships) {
  return user.memberships.find((membership) => membership.isDefault) ?? user.memberships[0] ?? null;
}

function toSessionUser(user: UserWithMemberships): SessionUser {
  const membership = getDefaultMembership(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    status: user.status,
    workspaceId: membership?.workspace.id ?? "default",
    workspaceName: membership?.workspace.name ?? "Main Workspace",
  };
}

export function toUserAccount(user: UserWithMemberships): UserAccount {
  const sessionUser = toSessionUser(user);
  return {
    ...sessionUser,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      memberships: {
        include: {
          workspace: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function createUserAccount(email: string, password: string, name: string, workspaceOverride?: { workspaceId: string; workspaceName: string }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const userCount = await prisma.user.count();
  const role: UserRole = userCount === 0 ? "admin" : "operator";

  const created = await prisma.$transaction(async (tx) => {
    let workspaceId = workspaceOverride?.workspaceId;
    let workspaceName = workspaceOverride?.workspaceName;

    if (!workspaceId || !workspaceName) {
      const defaultWorkspace = await tx.workspace.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (defaultWorkspace) {
        workspaceId = defaultWorkspace.id;
        workspaceName = defaultWorkspace.name;
      } else {
        const workspace = await tx.workspace.create({
          data: {
            name: "Main Workspace",
            slug: "main-workspace",
            description: "Primary product workspace for monitoring updates, insights, and action lanes.",
          },
        });
        workspaceId = workspace.id;
        workspaceName = workspace.name;
      }
    }

    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: createPasswordHash(password),
        role,
        status: "active",
      },
    });

    await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: role === "admin" ? "owner" : "member",
        isDefault: true,
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        memberships: {
          include: {
            workspace: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
      },
    });
  });

  return { user: toSessionUser(created) };
}

export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || user.status === "disabled" || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  return { user: toSessionUser(user) };
}

export async function createAuthSession(userId: string, context?: { userAgent?: string | null; ipAddress?: string | null }) {
  const ipHash = context?.ipAddress ? createHash("sha256").update(context.ipAddress).digest("hex") : null;

  return prisma.authSession.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      userAgent: context?.userAgent ?? null,
      ipHash,
    },
  });
}

export async function deleteAuthSession(sessionId: string) {
  await prisma.authSession.deleteMany({ where: { id: sessionId } });
}

export async function resolveSessionUser(sessionId: string) {
  const session = await prisma.authSession.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              workspace: {
                select: { id: true, name: true },
              },
            },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.status === "disabled") {
    if (session) {
      await deleteAuthSession(session.id);
    }
    return null;
  }

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    session,
    user: toSessionUser(session.user as UserWithMemberships),
  };
}

export async function requireWorkspaceAccess(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
  if (!membership) {
    throw new AppError(403, "forbidden", "You do not have access to this workspace.");
  }
  return membership;
}
