import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyLineageSearchContractResponse, requireAutonomyLineageSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyLineageSearchUser(); return apiSuccess(getAutonomyLineageSearchContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomy Lineage Search contract."); }
}
