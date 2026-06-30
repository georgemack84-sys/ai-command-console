import { apiError, apiSuccess } from "@/src/server/api/response";
import { getVisibilityCertificationForRequest, requireVisibilityCertificationUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ certification_run_id: string }> }) {
  try {
    await requireVisibilityCertificationUser();
    const { certification_run_id } = await params;
    const result = getVisibilityCertificationForRequest(request, certification_run_id);
    return apiSuccess({ certification_state: result.certification_state, gate_state: result.gate_state, generated_at: result.generated_at });
  } catch (error) {
    return apiError(error, "Unable to load visibility certification results.");
  }
}
