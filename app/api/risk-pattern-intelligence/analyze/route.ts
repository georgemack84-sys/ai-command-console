import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, requireRiskPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskPatternUser();
    return apiSuccess(await analyzeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze risk patterns.");
  }
}
