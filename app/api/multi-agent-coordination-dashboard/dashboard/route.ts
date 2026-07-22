import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, dashboardRequest, requireCoordinationDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireCoordinationDashboardUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load multi-agent coordination dashboard."); }
}
export async function POST(request: Request) {
  try { await requireCoordinationDashboardUser(); return apiSuccess(await dashboardRequest(request)); }
  catch (error) { return apiError(error, "Unable to load multi-agent coordination dashboard."); }
}
