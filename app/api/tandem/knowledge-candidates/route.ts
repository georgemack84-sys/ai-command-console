import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { tandemKnowledgeCandidateSchema } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruTandemKnowledgeIntakeService } from "@/src/server/services/nuru-tandem-knowledge-intake-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const candidate = tandemKnowledgeCandidateSchema.parse(await request.json());
    return apiSuccess(await nuruTandemKnowledgeIntakeService.intake(candidate, { workspaceId: user.workspaceId, actor: `tandem:${user.id}` }), { status: 202 });
  } catch (error) { return apiError(error, "Unable to submit a Tandem knowledge candidate to Nuru."); }
}
