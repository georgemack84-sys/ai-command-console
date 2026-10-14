import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { provisionHeadlineFlowReferenceIntegration } from "@/src/server/services/nuru-application-integration";
export async function POST() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess(await provisionHeadlineFlowReferenceIntegration(user.workspaceId, user.id), { status: 201 }); } catch (error) { return apiError(error, "Unable to provision Headline Flow reference integration."); } }
