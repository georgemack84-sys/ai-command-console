import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskForecastingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskForecastingUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load risk forecasting engine contract.");
  }
}
