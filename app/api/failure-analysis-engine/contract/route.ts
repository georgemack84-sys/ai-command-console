import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireFailureAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load failure analysis engine contract.");
  }
}
