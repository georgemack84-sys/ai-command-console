import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ governance_ref: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { governance_ref } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, governance_ref).governance_impact);
  } catch (error) {
    return apiError(error, "Unable to load governance integrity impact.");
  }
}
