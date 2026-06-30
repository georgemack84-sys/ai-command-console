import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeObservationEngineUser, validateRuntimeObservationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await validateRuntimeObservationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Runtime Observation package.");
  }
}
