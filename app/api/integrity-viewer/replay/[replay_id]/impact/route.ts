import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ replay_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { replay_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, replay_id).replay_impact);
  } catch (error) {
    return apiError(error, "Unable to load replay integrity impact.");
  }
}
