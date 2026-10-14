import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { revokeCapabilityGrant } from "@/src/server/services/application-permission-service";
export async function DELETE(request: Request, context: { params: Promise<{ applicationId: string; capabilityId: string; grantId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { applicationId, capabilityId, grantId } = await context.params; return apiSuccess({ grant: await revokeCapabilityGrant(user.workspaceId, applicationId, capabilityId, grantId, user.id, await request.json()) }); } catch (error) { return apiError(error, "Unable to revoke capability permission."); } }
