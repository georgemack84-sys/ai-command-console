import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDependencyAnalysisUser, visibilityDependencyAnalysisRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencyAnalysisUser();
    return apiSuccess(await visibilityDependencyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve dependency visibility.");
  }
}
