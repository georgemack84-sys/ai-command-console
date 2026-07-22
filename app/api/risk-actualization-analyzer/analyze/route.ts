import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, requireRiskActualizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskActualizationUser();
    return apiSuccess(await analyzeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze risk actualization.");
  }
}
