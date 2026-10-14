import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceOwner } from "@/src/server/auth/permissions";
import { approveCapabilityGrant } from "@/src/server/services/application-permission-service";
export async function POST(_request: Request, context: { params: Promise<{ applicationId: string; capabilityId: string; grantId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceOwner({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { applicationId, capabilityId, grantId } = await context.params; return apiSuccess({ grant: await approveCapabilityGrant(user.workspaceId, applicationId, capabilityId, grantId, user.id) }); } catch (error) { return apiError(error, "Unable to approve capability permission."); } }
