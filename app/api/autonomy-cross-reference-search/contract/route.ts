import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyCrossReferenceSearchContractResponse, requireAutonomyCrossReferenceSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(getAutonomyCrossReferenceSearchContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Autonomy Cross-Reference Search contract."); }
}
