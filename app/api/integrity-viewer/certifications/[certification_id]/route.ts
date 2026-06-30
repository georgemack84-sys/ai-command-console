import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ certification_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { certification_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, certification_id).certification_gate);
  } catch (error) {
    return apiError(error, "Unable to load certification gate status.");
  }
}
