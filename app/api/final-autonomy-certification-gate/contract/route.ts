import { apiError, apiSuccess } from "@/src/server/api/response";
import { getFinalAutonomyCertificationContractResponse, requireFinalAutonomyCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireFinalAutonomyCertificationUser(); return apiSuccess(getFinalAutonomyCertificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Final Autonomy Certification contract."); }
}
