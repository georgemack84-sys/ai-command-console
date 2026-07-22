import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskDriftUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk drift contract.");
  }
}
