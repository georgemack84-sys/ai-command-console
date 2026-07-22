import { apiError, apiSuccess } from "@/src/server/api/response";
import { policiesRequest, requireAdaptivePolicyConflictDetectorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireAdaptivePolicyConflictDetectorUser();
    return apiSuccess(await policiesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve conflict policies.");
  }
}
