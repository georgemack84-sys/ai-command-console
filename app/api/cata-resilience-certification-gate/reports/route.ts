import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireCataResilienceCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCataResilienceCertificationUser(); return apiSuccess(await reportsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load CATA resilience certification reports."); }
}
