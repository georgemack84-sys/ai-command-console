import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSocraticArtifactRepository } from "@/services/learning-constitution";
import type { LearningObjective, SocraticSession } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";
const userFor = async () => { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; };
/** Read-only by design: Socratic sessions may be viewed here, but candidate promotion remains exclusively in the durable learning pipeline. */
export async function GET() { try { const user = await userFor(); const artifacts = await new PrismaSocraticArtifactRepository(user.workspaceId!).listWorkspaceArtifacts(); return apiSuccess({ objectives: artifacts.filter((artifact) => artifact.artifactType === "OBJECTIVE").map((artifact) => artifact.payload as LearningObjective), sessions: artifacts.filter((artifact) => artifact.artifactType === "SESSION").map((artifact) => artifact.payload as SocraticSession), candidateSubmissions: artifacts.filter((artifact) => artifact.artifactType === "CANDIDATE_SUBMISSION").map((artifact) => artifact.payload) }); } catch (error) { return apiError(error, "Unable to load Socratic sessions."); } }
