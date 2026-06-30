import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditAutonomyQueryContractRequest, requireAutonomyQueryContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(await auditAutonomyQueryContractRequest(request)); }
  catch (error) { return apiError(error, "Unable to audit Autonomy Query contract."); }
}
