import { apiError, apiSuccess } from "@/src/server/api/response";
import { calculateConfidenceRequest, requireConfidenceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(await calculateConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate confidence reasoning.");
  }
}
