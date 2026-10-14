import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { publishWorkflowDefinition } from "@/src/server/services/workflow-coordinator-service";
import { nuruHeadlineWorkflowTemplate } from "@/src/server/services/nuru-headline-workflow-template";
export async function POST() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess(await publishWorkflowDefinition(user.workspaceId, user.id, nuruHeadlineWorkflowTemplate), { status: 201 }); } catch (error) { return apiError(error, "Unable to publish the Nuru to Headline Flow reference workflow."); } }
