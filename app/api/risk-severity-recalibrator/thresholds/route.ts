import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskSeverityRecalibratorUser, thresholdsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskSeverityRecalibratorUser();
    return apiSuccess(await thresholdsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve threshold recalibration analysis.");
  }
}
