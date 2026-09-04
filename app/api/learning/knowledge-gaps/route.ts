import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { KnowledgeGapRegistryService, PrismaKnowledgeGapArtifactRepository } from "@/services/learning-constitution";
export const dynamic = "force-dynamic";
const userFor = async () => { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; };
/** Read-only registry: it explains gaps and proposed remedies but cannot start learning or promote knowledge. */
export async function GET(request: Request) { try { const user = await userFor(); const parameters = new URL(request.url).searchParams; const gaps = await new KnowledgeGapRegistryService(new PrismaKnowledgeGapArtifactRepository(user.workspaceId!)).list({ subject: parameters.get("subject") ?? undefined, blockingOnly: parameters.get("blocking") === "true" }); return apiSuccess({ gaps }); } catch (error) { return apiError(error, "Unable to load knowledge gaps."); } }
