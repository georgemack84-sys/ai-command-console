import { apiError, apiSuccess } from "@/src/server/api/response";
import { getControlledAutonomyCompletionContractResponse, requireControlledAutonomyCompletionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireControlledAutonomyCompletionUser(); return apiSuccess(getControlledAutonomyCompletionContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Controlled Autonomy Completion contract."); }
}
