import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPolicyAnalysisRequest, requirePolicyAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyAnalysisUser();
    return apiSuccess(await inspectPolicyAnalysisRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect PolicyAnalysis contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePolicyAnalysisUser();
    return apiSuccess(await inspectPolicyAnalysisRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect PolicyAnalysis contract.");
  }
}
