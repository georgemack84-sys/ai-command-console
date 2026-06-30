import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDeterministicValidationRequest, requireDeterministicValidationEngineUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireDeterministicValidationEngineUser(); return apiSuccess(await inspectDeterministicValidationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Deterministic Validation Engine."); }
}
export async function POST(request: Request) {
  try { await requireDeterministicValidationEngineUser(); return apiSuccess({ validation: await validateRequest(request), observability: await inspectDeterministicValidationRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Deterministic Validation Engine."); }
}
