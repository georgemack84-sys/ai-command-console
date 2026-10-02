import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { tandemKnowledgeSubscriptionSchema } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruTandemKnowledgeSubscriptionService } from "@/src/server/services/nuru-tandem-knowledge-subscription-service";
export const dynamic = "force-dynamic";
export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess(await nuruTandemKnowledgeSubscriptionService.list(user.workspaceId)); } catch (error) { return apiError(error, "Unable to list Nuru subscriptions."); } }
export async function POST(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess(await nuruTandemKnowledgeSubscriptionService.subscribe(tandemKnowledgeSubscriptionSchema.parse(await request.json()), user.workspaceId), { status: 201 }); } catch (error) { return apiError(error, "Unable to create Nuru subscription."); } }
