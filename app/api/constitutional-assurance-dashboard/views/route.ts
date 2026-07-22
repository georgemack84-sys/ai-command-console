import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalAssuranceDashboardUser, viewsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalAssuranceDashboardUser(); return apiSuccess(await viewsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional dashboard views."); }
}
