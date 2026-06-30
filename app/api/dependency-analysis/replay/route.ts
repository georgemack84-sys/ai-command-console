import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayDependencyAnalysisRequest, requireDependencyAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDependencyAnalysisUser();
    return apiSuccess(await replayDependencyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay dependency graph.");
  }
}
