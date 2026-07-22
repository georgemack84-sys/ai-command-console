import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePredictionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePredictionCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load prediction certification gate contract.");
  }
}
