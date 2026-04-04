import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import {
  createWorkspaceInviteInStorage,
  readInvitesFromStorage,
  readUsersFromStorage,
  renameWorkspaceInStorage,
  revokeWorkspaceInviteInStorage,
  updateUserRoleInStorage,
  updateUserStatusInStorage,
  updateUserWorkspaceInStorage,
type WorkspaceInvite,
} from "@/src/lib/workspace/storage";
import type { UserRole, UserStatus } from "@/src/lib/types";
import { loadCollaborationState, updateGovernance } from "@/services/collaboration";
import { normalizeRole, canManageGovernanceInEnvironment } from "@/services/permissions";
import { appendAuditEvent, listAuditEvents } from "@/services/auditTrail";
import { listRecentDiagnostics, recordHandledError, summarizeDiagnostics } from "@/services/operationalDiagnostics";

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role?: string;
  status?: string;
  workspaceId?: string;
  workspaceName?: string;
  createdAt: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role, "operator"),
    status: user.status === "disabled" ? "disabled" : "active",
    workspaceId: user.workspaceId || "default",
    workspaceName: user.workspaceName || "Main Workspace",
    createdAt: user.createdAt,
  };
}

function buildWorkspaces(users: Awaited<ReturnType<typeof readUsersFromStorage>>) {
  const map = new Map<string, { id: string; name: string; memberCount: number }>();
  for (const user of users) {
    const id = user.workspaceId || "default";
    const name = user.workspaceName || "Main Workspace";
    const current = map.get(id);
    map.set(id, {
      id,
      name,
      memberCount: (current?.memberCount || 0) + 1,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function forbidden() {
  return NextResponse.json({ error: "Admin access required." }, { status: 403 });
}

export async function GET() {
  try {
    const user = await getSessionUser();
    const collaboration = loadCollaborationState();
    const governance = collaboration.governance;

    if (!user || !canManageGovernanceInEnvironment(user.role || "operator", governance)) {
      return forbidden();
    }

    const users = await readUsersFromStorage();
    return NextResponse.json({
      users: users.map(sanitizeUser),
      workspaces: buildWorkspaces(users),
      invites: (await readInvitesFromStorage()).slice(0, 40),
      runtime: getRuntimePosture(),
      governance,
      approvals: collaboration.approvals ?? [],
      diagnostics: {
        summary: summarizeDiagnostics(100),
        recent: listRecentDiagnostics(12),
      },
      audit: listAuditEvents(60).filter((entry) =>
        [
          "admin:user-role-updated",
          "admin:user-status-updated",
          "admin:user-workspace-updated",
          "admin:workspace-renamed",
          "admin:workspace-invite-created",
          "admin:workspace-invite-revoked",
          "admin:workspace-policy-updated",
          "admin:governance-updated",
        ].includes(String(entry.type || ""))
      ),
    });
  } catch (error) {
    recordHandledError("admin-access", error, { method: "GET" }, { dedupeKey: "admin-access:get", cooldownMs: 60 * 1000 });
    return NextResponse.json({ error: "Unable to load admin access data." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    const governance = loadCollaborationState().governance;

    if (!user || !canManageGovernanceInEnvironment(user.role || "operator", governance)) {
      return forbidden();
    }

    const body = (await request.json()) as {
    type?:
      | "user-role"
      | "user-status"
      | "user-workspace"
      | "workspace-rename"
      | "workspace-invite"
      | "workspace-invite-revoke"
      | "workspace-policy"
      | "governance";
    userId?: string;
    role?: UserRole;
    status?: UserStatus;
    workspaceId?: string;
    workspaceName?: string;
    email?: string;
    token?: string;
    reset?: boolean;
    policyOverride?: Record<string, unknown>;
    governance?: Record<string, unknown>;
  };

    if (body.type === "user-role" && body.userId && body.role) {
    const before = (await readUsersFromStorage()).find((account) => account.id === body.userId);
    const updated = await updateUserRoleInStorage(body.userId, body.role);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    appendAuditEvent({
      type: "admin:user-role-updated",
      message: `Updated role for ${updated.email} to ${body.role}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        targetUserId: updated.id,
        targetEmail: updated.email,
        previousRole: before?.role || "operator",
        nextRole: body.role,
      },
    });

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  }

    if (body.type === "user-status" && body.userId && body.status) {
    const before = (await readUsersFromStorage()).find((account) => account.id === body.userId);
    const updated = await updateUserStatusInStorage(body.userId, body.status);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    appendAuditEvent({
      type: "admin:user-status-updated",
      message: `${body.status === "disabled" ? "Disabled" : "Reactivated"} ${updated.email}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        targetUserId: updated.id,
        targetEmail: updated.email,
        previousStatus: before?.status || "active",
        nextStatus: body.status,
      },
    });

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  }

    if (body.type === "user-workspace" && body.userId && body.workspaceId && body.workspaceName) {
    const before = (await readUsersFromStorage()).find((account) => account.id === body.userId);
    const updated = await updateUserWorkspaceInStorage(body.userId, body.workspaceId, body.workspaceName);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    appendAuditEvent({
      type: "admin:user-workspace-updated",
      message: `Moved ${updated.email} to workspace ${body.workspaceName}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        targetUserId: updated.id,
        targetEmail: updated.email,
        previousWorkspaceId: before?.workspaceId || "default",
        previousWorkspaceName: before?.workspaceName || "Main Workspace",
        nextWorkspaceId: body.workspaceId,
        nextWorkspaceName: body.workspaceName,
      },
    });

    return NextResponse.json({ ok: true, user: sanitizeUser(updated) });
  }

    if (body.type === "workspace-rename" && body.workspaceId && body.workspaceName) {
    const renamed = await renameWorkspaceInStorage(body.workspaceId, body.workspaceName);
    appendAuditEvent({
      type: "admin:workspace-renamed",
      message: `Renamed workspace ${body.workspaceId} to ${body.workspaceName}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        workspaceId: body.workspaceId,
        workspaceName: body.workspaceName,
        affectedUsers: renamed.map((account) => account.id),
      },
    });
    return NextResponse.json({ ok: true, workspace: { id: body.workspaceId, name: body.workspaceName, memberCount: renamed.length } });
  }

    if (body.type === "workspace-invite" && body.workspaceId && body.workspaceName) {
    const invite = await createWorkspaceInviteInStorage({
      email: body.email || null,
      workspaceId: body.workspaceId,
      workspaceName: body.workspaceName,
      createdById: user.id,
      createdByEmail: user.email,
    });
    appendAuditEvent({
      type: "admin:workspace-invite-created",
      message: `Created workspace invite for ${body.workspaceName}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        workspaceId: body.workspaceId,
        workspaceName: body.workspaceName,
        email: invite.email,
        token: invite.token,
      },
    });
    return NextResponse.json({ ok: true, invite });
  }

    if (body.type === "workspace-invite-revoke" && body.token) {
    const invite: WorkspaceInvite | null = await revokeWorkspaceInviteInStorage(body.token);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    appendAuditEvent({
      type: "admin:workspace-invite-revoked",
      message: `Revoked workspace invite for ${invite.workspaceName}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspaceName,
        token: invite.token,
      },
    });
    return NextResponse.json({ ok: true, invite });
  }

    if (body.type === "workspace-policy" && body.workspaceId) {
    const previous = loadCollaborationState().governance;
    const currentOverrides =
      previous.workspacePolicyOverrides && typeof previous.workspacePolicyOverrides === "object"
        ? previous.workspacePolicyOverrides
        : {};
    const nextOverrides = { ...currentOverrides };
    if (body.reset) {
      delete nextOverrides[body.workspaceId];
    } else {
      const incoming = body.policyOverride && typeof body.policyOverride === "object" ? body.policyOverride : {};
      const normalized = Object.fromEntries(
        Object.entries(incoming).filter(([, value]) => value !== null && value !== undefined && value !== "")
      );
      nextOverrides[body.workspaceId] = normalized;
    }
    const next = updateGovernance({
      ...previous,
      workspacePolicyOverrides: nextOverrides,
    });
    appendAuditEvent({
      type: "admin:workspace-policy-updated",
      message: `${body.reset ? "Reset" : "Updated"} workspace policy override for ${body.workspaceId}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        workspaceId: body.workspaceId,
        previous: currentOverrides[body.workspaceId] || null,
        next: next.workspacePolicyOverrides?.[body.workspaceId] || null,
        reset: Boolean(body.reset),
      },
    });
    return NextResponse.json({ ok: true, governance: next });
  }

    if (body.type === "governance" && body.governance) {
    const previous = loadCollaborationState().governance;
    const next = updateGovernance(body.governance);
    appendAuditEvent({
      type: "admin:governance-updated",
      message: `Updated access governance for ${next.currentEnvironment || "development"}.`,
      payload: {
        actorId: user.id,
        actorEmail: user.email,
        previous,
        next,
      },
    });
    return NextResponse.json({ ok: true, governance: next });
  }

    return NextResponse.json({ error: "Unsupported admin update." }, { status: 400 });
  } catch (error) {
    recordHandledError("admin-access", error, { method: "PATCH" }, { dedupeKey: "admin-access:patch", cooldownMs: 60 * 1000 });
    return NextResponse.json({ error: "Unable to apply admin update." }, { status: 500 });
  }
}
