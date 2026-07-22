import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContinuousConstitutionalUser, trendsRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await trendsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional trends."); }
}
