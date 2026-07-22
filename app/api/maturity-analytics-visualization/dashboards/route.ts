import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyticsBundleResponse, dashboardsRequest, requireMaturityAnalyticsUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityAnalyticsUser(); return apiSuccess(analyticsBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load maturity analytics visualization."); }
}
export async function POST(request: Request) {
  try { await requireMaturityAnalyticsUser(); return apiSuccess(await dashboardsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list maturity dashboards."); }
}
