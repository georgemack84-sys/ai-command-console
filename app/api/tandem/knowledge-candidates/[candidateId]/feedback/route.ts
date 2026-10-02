import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { nuruTandemKnowledgeIntakeService } from "@/src/server/services/nuru-tandem-knowledge-intake-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ candidateId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { candidateId } = await context.params;
    return apiSuccess(await nuruTandemKnowledgeIntakeService.feedback(user.workspaceId, candidateId));
  } catch (error) { return apiError(error, "Unable to retrieve Tandem candidate feedback."); }
}
