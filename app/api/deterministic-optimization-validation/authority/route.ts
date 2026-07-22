import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireDeterministicOptimizationValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(await authorityRequest(request)); }
  catch (error) { return apiError(error, "Unable to load authority validation records."); }
}
