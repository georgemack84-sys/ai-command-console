import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyQueryContractUser, validateAutonomyQueryContractRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(await validateAutonomyQueryContractRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Autonomy Query contract."); }
}
