import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireRiskAdaptationDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationDashboardUser();
    return apiSuccess(await dashboardRequest(request, "SIMULATION"));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation simulation dashboard.");
  }
}
