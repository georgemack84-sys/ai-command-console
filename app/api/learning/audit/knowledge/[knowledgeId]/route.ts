import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { CanonicalAuditExplanationService, LearningAuditQueryService, PrismaLearningAuditLedger } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: Readonly<{ params: Promise<{ knowledgeId: string }> }>) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to inspect audit history.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { knowledgeId } = await context.params;
    if (!knowledgeId.trim()) throw new AppError(400, "knowledge_id_required", "Knowledge identifier is required.");
    const query = new LearningAuditQueryService(new PrismaLearningAuditLedger(user.workspaceId));
    return apiSuccess({ history: await query.history(user.workspaceId, knowledgeId), explanation: await new CanonicalAuditExplanationService(query).explain(user.workspaceId, knowledgeId) });
  } catch (error) { return apiError(error, "Unable to load learning audit history."); }
}
