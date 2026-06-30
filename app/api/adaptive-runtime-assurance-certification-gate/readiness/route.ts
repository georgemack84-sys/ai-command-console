import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireAdaptiveRuntimeCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeCertificationUser();
    return apiSuccess(await readinessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load adaptive runtime certification readiness.");
  }
}
