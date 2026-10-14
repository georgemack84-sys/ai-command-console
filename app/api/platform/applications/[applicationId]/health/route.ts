import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { getApplicationHealth } from "@/src/server/services/application-health-service";
export async function GET(_request: Request, context: { params: Promise<{ applicationId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { applicationId } = await context.params; return apiSuccess({ health: await getApplicationHealth(user.workspaceId, applicationId) }); } catch (error) { return apiError(error, "Unable to load application health."); } }
