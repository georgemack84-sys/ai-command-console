import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConfidenceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load confidence risk reasoning contract.");
  }
}
