import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayIntegrityCertificationContractResponse, requireReplayIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess(getReplayIntegrityCertificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Replay Integrity Certification contract."); }
}
