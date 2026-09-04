import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaPracticeArtifactRepository } from "@/services/learning-constitution";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ skillId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { skillId } = await context.params; const artifacts = await new PrismaPracticeArtifactRepository(user.workspaceId).listArtifacts(skillId); return apiSuccess({ skillId, evidence: artifacts.filter((artifact) => artifact.artifactType === "EVIDENCE") }); } catch (error) { return apiError(error, "Unable to load practice history."); } }
