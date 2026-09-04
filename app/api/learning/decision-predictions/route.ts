import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { DecisionPredictionAnalyticsService, PrismaDecisionPredictionArtifactRepository } from "@/services/learning-constitution";
import type { DecisionPrediction } from "@/types/learning-constitution";
export const dynamic = "force-dynamic";
const userFor = async () => { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; };
/** Read-only: this route exposes an inference trail and never converts predictions into instructions or candidates. */
export async function GET() { try { const user = await userFor(); const artifacts = new PrismaDecisionPredictionArtifactRepository(user.workspaceId!); const all = await artifacts.listWorkspaceArtifacts(); const predictions = all.filter((artifact) => artifact.artifactType === "PREDICTION").map((artifact) => artifact.payload as DecisionPrediction); const analytics = await new DecisionPredictionAnalyticsService().analyze({ analysisId: `live:${user.workspaceId}`, artifacts, analyzedAt: new Date().toISOString() }); return apiSuccess({ predictions, analytics }); } catch (error) { return apiError(error, "Unable to load decision predictions."); } }
