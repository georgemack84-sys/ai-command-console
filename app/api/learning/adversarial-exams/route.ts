import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaAdversarialExaminationArtifactRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only inspection. Examiner-only rubrics are never returned by this endpoint. */
export async function GET() {
  try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const artifacts = await new PrismaAdversarialExaminationArtifactRepository(user.workspaceId).listWorkspaceArtifacts(); return apiSuccess({ artifacts: artifacts.filter((artifact) => artifact.artifactType !== "RUBRIC"), sealedRubricCount: artifacts.filter((artifact) => artifact.artifactType === "RUBRIC").length }); } catch (error) { return apiError(error, "Unable to load adversarial examination artifacts."); }
}
