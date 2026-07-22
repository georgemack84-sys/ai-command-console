import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireDeterministicOptimizationValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireDeterministicOptimizationValidationUser(); return apiSuccess(await governanceRequest(request)); }
  catch (error) { return apiError(error, "Unable to load governance validation records."); }
}
