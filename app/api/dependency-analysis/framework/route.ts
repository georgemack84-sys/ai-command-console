import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDependencyAnalysisResponse, requireDependencyAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDependencyAnalysisUser();
    return apiSuccess(getDependencyAnalysisResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve dependency analysis framework.");
  }
}
