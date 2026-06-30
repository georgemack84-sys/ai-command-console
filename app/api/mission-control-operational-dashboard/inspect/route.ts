import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDashboardRequest, requireMissionControlOperationalDashboardUser, validateDashboardRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(await inspectDashboardRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Operational Dashboard."); }
}
export async function POST(request: Request) {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess({ validation: await validateDashboardRequest(request), observability: await inspectDashboardRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Mission Control Operational Dashboard."); }
}
