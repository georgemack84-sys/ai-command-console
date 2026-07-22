import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireContinuousConstitutionalUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await reportsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional validation reports."); }
}
