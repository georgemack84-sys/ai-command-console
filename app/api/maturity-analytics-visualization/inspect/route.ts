import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMaturityAnalyticsUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMaturityAnalyticsUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect maturity analytics visualization."); }
}
export async function POST(request: Request) {
  try { await requireMaturityAnalyticsUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect maturity analytics visualization."); }
}
