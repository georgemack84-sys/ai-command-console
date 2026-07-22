import { apiError, apiSuccess } from "@/src/server/api/response";
import { failureRequest, requireRejectionLearningAnalyzerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRejectionLearningAnalyzerUser();
    return apiSuccess(await failureRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve rejection failure analysis.");
  }
}
