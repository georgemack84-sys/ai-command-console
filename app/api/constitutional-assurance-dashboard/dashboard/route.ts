import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, dashboardRequest, requireConstitutionalAssuranceDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalAssuranceDashboardUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional assurance dashboard."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalAssuranceDashboardUser(); return apiSuccess(await dashboardRequest(request)); }
  catch (error) { return apiError(error, "Unable to build constitutional assurance dashboard."); }
}
