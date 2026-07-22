import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireOverrideLearningAnalyzerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideLearningAnalyzerUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect override learning analyzer.");
  }
}
