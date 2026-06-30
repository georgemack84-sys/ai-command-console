import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyQueryContractResponse, requireAutonomyQueryContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(getAutonomyQueryContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomy Query contract."); }
}
