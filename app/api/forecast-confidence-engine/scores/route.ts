import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireForecastConfidenceUser, scoresRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireForecastConfidenceUser();
    return apiSuccess(await scoresRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load forecast confidence scores.");
  }
}
