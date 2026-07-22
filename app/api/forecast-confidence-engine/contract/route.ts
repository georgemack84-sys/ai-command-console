import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireForecastConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireForecastConfidenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load forecast confidence engine contract.");
  }
}
