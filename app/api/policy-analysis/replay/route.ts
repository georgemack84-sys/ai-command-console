import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPolicyAnalysisRequest, requirePolicyAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyAnalysisUser();
    return apiSuccess(await replayPolicyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay PolicyAnalysis contract.");
  }
}
