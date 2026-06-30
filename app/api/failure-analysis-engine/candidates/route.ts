import { apiError, apiSuccess } from "@/src/server/api/response";
import { candidatesRequest, requireFailureAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureAnalysisUser();
    return apiSuccess(await candidatesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate recovery candidates.");
  }
}
