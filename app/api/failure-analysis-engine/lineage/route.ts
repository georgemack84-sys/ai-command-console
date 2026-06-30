import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireFailureAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(await lineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load failure lineage.");
  }
}
