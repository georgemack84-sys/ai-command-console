import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { requestCapabilityGrant } from "@/src/server/services/application-permission-service";
export async function POST(request: Request, context: { params: Promise<{ applicationId: string; capabilityId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { applicationId, capabilityId } = await context.params; return apiSuccess({ grant: await requestCapabilityGrant(user.workspaceId, applicationId, capabilityId, user.id, await request.json()) }, { status: 201 }); } catch (error) { return apiError(error, "Unable to request capability permission."); } }
