import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayViewerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceReplayViewerUser(); const view = viewForRequest(request); return apiSuccess({ viewer_id: view.viewer_id, viewer_hash: view.viewer_hash }); } catch (error) { return apiError(error, "Unable to hash governance replay viewer."); } }
