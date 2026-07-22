import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDeterministicOptimizationValidationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load deterministic optimization validation."); }
}
export async function POST(request: Request) {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate deterministic optimization."); }
}
