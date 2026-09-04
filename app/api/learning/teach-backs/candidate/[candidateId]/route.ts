import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaTeachBackHumanDecisionRepository, PrismaTeachBackRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Manager-only immutable teach-back review history. */
export async function GET(_request: Request, context: Readonly<{ params: Promise<{ candidateId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to review teach-backs.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { candidateId } = await context.params; if (!candidateId.trim()) throw new AppError(400, "candidate_id_required", "Candidate identifier is required.");
    const teachBacks = await new PrismaTeachBackRepository(user.workspaceId).listByCandidateId(candidateId);
    const evaluations = await Promise.all(teachBacks.map(async (teachBack) => ({ teachBackId: teachBack.teachBackId, evaluations: await new PrismaTeachBackRepository(user.workspaceId).listEvaluations(teachBack.teachBackId), reviews: await new PrismaTeachBackHumanDecisionRepository(user.workspaceId).list(teachBack.teachBackId) })));
    return apiSuccess({ teachBacks, evaluations });
  } catch (error) { return apiError(error, "Unable to load teach-back history."); }
}
