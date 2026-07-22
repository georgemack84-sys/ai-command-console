import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireAdaptationScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationScoringUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation scoring metrics.");
  }
}
