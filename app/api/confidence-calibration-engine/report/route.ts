import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireConfidenceCalibrationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceCalibrationUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence calibration report.");
  }
}
