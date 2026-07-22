import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOverrideLearningAnalyzerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOverrideLearningAnalyzerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve override learning analyzer contract.");
  }
}
