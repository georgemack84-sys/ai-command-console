import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayViewerDetailForRequest, requireReplayViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ replay_id: string }> }) {
  try {
    await requireReplayViewerUser();
    const { replay_id } = await params;
    return apiSuccess({ governance_refs: getReplayViewerDetailForRequest(request, replay_id).governance_refs });
  } catch (error) {
    return apiError(error, "Unable to load governance replay context.");
  }
}
