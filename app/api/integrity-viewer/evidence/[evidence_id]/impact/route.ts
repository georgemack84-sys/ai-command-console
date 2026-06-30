import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ evidence_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { evidence_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, evidence_id).evidence_impact);
  } catch (error) {
    return apiError(error, "Unable to load evidence integrity impact.");
  }
}
