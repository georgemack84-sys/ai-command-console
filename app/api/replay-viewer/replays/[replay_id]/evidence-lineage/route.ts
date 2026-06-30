import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayViewerDetailForRequest, requireReplayViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ replay_id: string }> }) {
  try {
    await requireReplayViewerUser();
    const { replay_id } = await params;
    const detail = getReplayViewerDetailForRequest(request, replay_id);
    return apiSuccess({ evidence_refs: detail.evidence_refs, lineage_refs: detail.lineage_refs });
  } catch (error) {
    return apiError(error, "Unable to load replay evidence and lineage context.");
  }
}
