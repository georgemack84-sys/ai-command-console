import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyCertificationContractResponse, requireAutonomyCertificationContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyCertificationContractUser(); return apiSuccess(getAutonomyCertificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomy Certification Contract."); }
}
