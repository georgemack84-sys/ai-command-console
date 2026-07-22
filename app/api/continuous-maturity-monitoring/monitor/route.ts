import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitorRequest, monitoringBundleResponse, requireContinuousMonitoringUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousMonitoringUser(); return apiSuccess(monitoringBundleResponse()); }
  catch (error) { return apiError(error, "Unable to load continuous maturity monitoring."); }
}
export async function POST(request: Request) {
  try { await requireContinuousMonitoringUser(); return apiSuccess(await monitorRequest(request)); }
  catch (error) { return apiError(error, "Unable to run continuous maturity monitoring cycle."); }
}
