import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruTandemMissionReplayService } from "@/src/server/services/nuru-tandem-mission-replay-service";
import { nuruTandemMissionContextService } from "@/src/server/services/nuru-tandem-mission-context-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ missionId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const missionId = (await context.params).missionId; const asOf = new URL(request.url).searchParams.get("asOf"); if (!asOf) throw new AppError(400, "as_of_required", "An asOf timestamp is required for replay."); const replay = new NuruTandemMissionReplayService({ list: (workspaceId, id) => nuruTandemMissionContextService.list(workspaceId, id) }); return apiSuccess(await replay.replay({ missionId, asOf }, user.workspaceId)); } catch (error) { return apiError(error, "Unable to replay Nuru mission knowledge context."); } }
