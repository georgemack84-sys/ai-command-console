import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDeterministicValidationContractResponse, requireDeterministicValidationEngineUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicValidationEngineUser(); return apiSuccess(getDeterministicValidationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Deterministic Validation Engine contract."); }
}
