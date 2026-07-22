import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireContinuousMonitoringUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousMonitoringUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect continuous maturity monitoring."); }
}
export async function POST(request: Request) {
  try { await requireContinuousMonitoringUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect continuous maturity monitoring."); }
}
