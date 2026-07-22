import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, requireAdaptivePolicyConflictDetectorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireAdaptivePolicyConflictDetectorUser();
    return apiSuccess(await analyzeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze adaptive policy conflicts.");
  }
}
