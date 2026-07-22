import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAdaptivePolicyConflictDetectorUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireAdaptivePolicyConflictDetectorUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive policy conflict detector.");
  }
}
export async function POST(request: Request) {
  try {
    await requireAdaptivePolicyConflictDetectorUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive policy conflict detector.");
  }
}
