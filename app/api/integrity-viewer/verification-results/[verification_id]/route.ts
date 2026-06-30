import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ verification_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { verification_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, verification_id).verification_result);
  } catch (error) {
    return apiError(error, "Unable to load verification result.");
  }
}
