import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskAdaptationDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskAdaptationDashboardUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation dashboard contract.");
  }
}
