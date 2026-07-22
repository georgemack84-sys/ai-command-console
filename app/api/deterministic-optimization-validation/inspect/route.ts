import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireDeterministicOptimizationValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect deterministic optimization validation."); }
}
export async function POST(request: Request) {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect deterministic optimization validation."); }
}
