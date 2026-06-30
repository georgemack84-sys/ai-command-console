import { apiError, apiSuccess } from "@/src/server/api/response";
import { getVisibilityCertificationForRequest, requireVisibilityCertificationUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ certification_run_id: string }> }) {
  try {
    await requireVisibilityCertificationUser();
    const { certification_run_id } = await params;
    return apiSuccess(getVisibilityCertificationForRequest(request, certification_run_id).surface_results);
  } catch (error) {
    return apiError(error, "Unable to load visibility surface certification results.");
  }
}
