import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, requireRiskAdaptationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationUser();
    return apiSuccess(await analyzeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze risk adaptation foundation.");
  }
}
