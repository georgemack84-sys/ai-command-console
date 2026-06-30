import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicValidationEngineUser, validationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeterministicValidationEngineUser(); return apiSuccess(await validationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Deterministic Validation Engine."); }
}
