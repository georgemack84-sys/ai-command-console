import { apiError, apiSuccess } from "@/src/server/api/response";
import { consistencyRequest, requireConfidenceCalibrationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceCalibrationUser();
    return apiSuccess(await consistencyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence calibration consistency.");
  }
}
