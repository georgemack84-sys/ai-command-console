import { apiError, apiSuccess } from "@/src/server/api/response";
import { conflictsRequest, requireAdaptivePolicyConflictDetectorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireAdaptivePolicyConflictDetectorUser();
    return apiSuccess(await conflictsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive policy conflicts.");
  }
}
