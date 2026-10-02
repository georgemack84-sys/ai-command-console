import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { correctionDecisionSchema, NuruTemporalClaimService } from "@/src/server/services/nuru-temporal-claim-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";
export async function POST(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId }); return apiSuccess({ decision: await NuruTemporalClaimService.decideCorrection(correctionDecisionSchema.parse(await request.json()), { workspaceId: user.workspaceId, actor: `human:${user.id}`, correlationId: crypto.randomUUID() }) }, { status: 201 }); } catch (error) { return apiError(error, "Unable to record correction decision."); } }
