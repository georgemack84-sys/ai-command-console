import { apiError, apiSuccess } from "@/src/server/api/response";
import { forecastRequest, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await forecastRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health forecasts.");
  }
}
