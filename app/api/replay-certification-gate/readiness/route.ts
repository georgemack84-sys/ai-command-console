import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayCertificationReadinessRequest, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayCertificationUser(); return apiSuccess(await replayCertificationReadinessRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate replay readiness assessment."); }
}
