import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ target_ref: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { target_ref } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, target_ref).history);
  } catch (error) {
    return apiError(error, "Unable to load integrity history.");
  }
}
