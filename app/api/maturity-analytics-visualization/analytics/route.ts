import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyticsRequest, requireMaturityAnalyticsUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireMaturityAnalyticsUser(); return apiSuccess(await analyticsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load maturity analytics."); }
}
