import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireRecommendationDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation intelligence dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRecommendationDashboardUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build recommendation intelligence dashboard.");
  }
}
