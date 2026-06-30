import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomySearchContractResponse, requireAutonomySearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomySearchUser(); return apiSuccess(getAutonomySearchContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomy Search contract."); }
}
