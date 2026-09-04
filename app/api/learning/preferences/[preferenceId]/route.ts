import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaPreferenceArtifactRepository } from "@/services/learning-constitution";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: Readonly<{ params: Promise<{ preferenceId: string }> }>) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to inspect preferences."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { preferenceId } = await context.params; if (!preferenceId.trim()) throw new AppError(400, "preference_required", "Preference identifier is required."); return apiSuccess({ artifacts: await new PrismaPreferenceArtifactRepository(user.workspaceId).listArtifacts(preferenceId) }); } catch (error) { return apiError(error, "Unable to load preference history."); } }
