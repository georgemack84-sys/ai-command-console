import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePatternIntelligenceDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternIntelligenceDashboardUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern intelligence dashboard contract.");
  }
}
