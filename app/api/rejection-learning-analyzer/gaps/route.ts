import { apiError, apiSuccess } from "@/src/server/api/response";
import { gapsRequest, requireRejectionLearningAnalyzerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRejectionLearningAnalyzerUser();
    return apiSuccess(await gapsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve rejection gaps.");
  }
}
