import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireOverrideLearningAnalyzerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideLearningAnalyzerUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay override learning analysis.");
  }
}
