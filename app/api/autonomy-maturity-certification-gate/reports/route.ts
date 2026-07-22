import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireAutonomyMaturityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyMaturityCertificationUser(); return apiSuccess(await reportsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list autonomy maturity certification reports."); }
}
