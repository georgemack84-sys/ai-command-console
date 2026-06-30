import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRuntimeObservationRequest, requireRuntimeObservationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await createRuntimeObservationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Runtime Observation package.");
  }
}
