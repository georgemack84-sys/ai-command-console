import { apiError, apiSuccess } from "@/src/server/api/response";
import { createAutonomyQueryContractRequest, requireAutonomyQueryContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(await createAutonomyQueryContractRequest(request)); }
  catch (error) { return apiError(error, "Unable to create Autonomy Query contract."); }
}
