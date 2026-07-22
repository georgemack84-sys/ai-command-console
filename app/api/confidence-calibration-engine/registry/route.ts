import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireConfidenceCalibrationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceCalibrationUser();
    return apiSuccess(await registryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence calibration registry.");
  }
}
