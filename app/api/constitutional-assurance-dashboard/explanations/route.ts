import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationsRequest, requireConstitutionalAssuranceDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalAssuranceDashboardUser(); return apiSuccess(await explanationsRequest(request)); }
  catch (error) { return apiError(error, "Unable to explain constitutional dashboard metrics."); }
}
