import { apiError, apiSuccess } from "@/src/server/api/response";
import { calibrationRequest, requireRiskSeverityRecalibratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskSeverityRecalibratorUser();
    return apiSuccess(await calibrationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk severity calibration analysis.");
  }
}
