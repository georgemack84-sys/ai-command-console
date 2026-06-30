import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayCertificationContractResponse, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayCertificationUser(); return apiSuccess(getReplayCertificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Replay Certification Gate contract."); }
}
