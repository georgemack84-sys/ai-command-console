import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireConfidenceRiskDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceRiskDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect confidence risk dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskDashboardUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build confidence risk dashboard.");
  }
}
