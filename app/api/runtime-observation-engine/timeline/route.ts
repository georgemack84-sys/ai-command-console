import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeObservationEngineUser, runtimeObservationTimelineRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await runtimeObservationTimelineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build Runtime Observation timeline.");
  }
}
