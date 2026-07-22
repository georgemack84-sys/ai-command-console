import { apiError, apiSuccess } from "@/src/server/api/response";
import { getOverrideAnalysisContractResponse, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(getOverrideAnalysisContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load override analysis engine contract.");
  }
}
