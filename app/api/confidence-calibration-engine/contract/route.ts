import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConfidenceCalibrationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceCalibrationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence calibration contract.");
  }
}
