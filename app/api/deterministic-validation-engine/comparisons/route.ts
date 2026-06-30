import { apiError, apiSuccess } from "@/src/server/api/response";
import { comparisonsRequest, requireDeterministicValidationEngineUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeterministicValidationEngineUser(); return apiSuccess(await comparisonsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load deterministic comparisons."); }
}
