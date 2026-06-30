import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveRuntimeCertificationUser, validateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeCertificationUser();
    return apiSuccess(await validateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate adaptive runtime certification.");
  }
}
