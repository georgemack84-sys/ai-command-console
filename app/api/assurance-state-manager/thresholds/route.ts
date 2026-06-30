import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAssuranceStateUser, thresholdsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAssuranceStateUser();
    return apiSuccess(await thresholdsRequest());
  } catch (error) {
    return apiError(error, "Unable to load assurance state thresholds.");
  }
}
