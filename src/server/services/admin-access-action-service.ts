import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";
import {
  createAdminWorkspaceInvite,
  moveUserToWorkspace,
  renameWorkspace,
  revokeAdminWorkspaceInvite,
  runAdminAiSummaryCheck,
  updateUserRole,
  updateUserStatus,
} from "@/src/server/services/admin-service";
import {
  saveControlCenterGovernance,
  saveControlCenterWorkspacePolicy,
} from "@/src/server/services/control-center-service";

const adminAccessActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user-role"),
    userId: z.string().min(1),
    role: z.enum(["viewer", "operator", "approver", "admin"]),
  }),
  z.object({
    type: z.literal("user-status"),
    userId: z.string().min(1),
    status: z.enum(["active", "disabled"]),
  }),
  z.object({
    type: z.literal("user-workspace"),
    userId: z.string().min(1),
    workspaceId: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-rename"),
    workspaceId: z.string().min(1),
    workspaceName: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-invite"),
    workspaceId: z.string().min(1),
    email: z.string().email().optional().nullable(),
  }),
  z.object({
    type: z.literal("workspace-invite-revoke"),
    token: z.string().min(1),
  }),
  z.object({
    type: z.literal("workspace-policy"),
    workspaceId: z.string().min(1),
    reset: z.boolean().optional(),
    policyOverride: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal("governance"),
    governance: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("ai-summary-check"),
    workspaceId: z.string().min(1).optional(),
    forceFallback: z.boolean().optional(),
  }),
]);

type AdminActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export async function executeAdminAccessAction(input: unknown, actor: AdminActor) {
  if (actor.role !== "admin") {
    throw new AppError(403, "forbidden", "Admin access required.");
  }

  const body = adminAccessActionSchema.parse(input);

  if (body.type === "user-role") {
    return { data: { user: await updateUserRole(body.userId, body.role) } };
  }

  if (body.type === "user-status") {
    return { data: { user: await updateUserStatus(body.userId, body.status) } };
  }

  if (body.type === "user-workspace") {
    return { data: { workspace: await moveUserToWorkspace(body.userId, body.workspaceId) } };
  }

  if (body.type === "workspace-rename") {
    return { data: { workspace: await renameWorkspace(body.workspaceId, body.workspaceName) } };
  }

  if (body.type === "workspace-invite") {
    const invite = await createAdminWorkspaceInvite({
      workspaceId: body.workspaceId,
      email: body.email,
      createdById: actor.id,
    });
    return { data: { invite }, status: 201 };
  }

  if (body.type === "workspace-invite-revoke") {
    return { data: { invite: await revokeAdminWorkspaceInvite(body.token) } };
  }

  if (body.type === "workspace-policy") {
    const governance = await saveControlCenterWorkspacePolicy(
      body.workspaceId,
      body.policyOverride,
      body.reset,
      actor,
    );
    return { data: { governance } };
  }

  if (body.type === "governance") {
    return { data: { governance: await saveControlCenterGovernance(body.governance) } };
  }

  return {
    data: {
      summaryCheck: await runAdminAiSummaryCheck({
        workspaceId: body.workspaceId || actor.workspaceId,
        requestedById: actor.id,
        forceFallback: body.forceFallback,
      }),
    },
  };
}
