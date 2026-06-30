import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomyQueryContractRequest, requireAutonomyQueryContractUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(await inspectAutonomyQueryContractRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Query contract."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyQueryContractUser(); return apiSuccess(await inspectAutonomyQueryContractRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Query contract."); }
}
