import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ lineage_ref: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { lineage_ref } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, lineage_ref).lineage_impact);
  } catch (error) {
    return apiError(error, "Unable to load lineage integrity impact.");
  }
}
