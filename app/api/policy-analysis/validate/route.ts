import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyAnalysisUser, validatePolicyAnalysisRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyAnalysisUser();
    return apiSuccess(await validatePolicyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate PolicyAnalysis contract.");
  }
}
