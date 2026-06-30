import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyAnalysisUser, transitionPolicyAnalysisRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyAnalysisUser();
    return apiSuccess(await transitionPolicyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition PolicyAnalysis state.");
  }
}
