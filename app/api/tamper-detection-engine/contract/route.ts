import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTamperDetectionContractResponse, requireTamperDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireTamperDetectionUser(); return apiSuccess(getTamperDetectionContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Tamper Detection contract."); }
}
