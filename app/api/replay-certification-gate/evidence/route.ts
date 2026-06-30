import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayCertificationEvidenceRequest, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayCertificationUser(); return apiSuccess(await replayCertificationEvidenceRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate replay certification evidence."); }
}
