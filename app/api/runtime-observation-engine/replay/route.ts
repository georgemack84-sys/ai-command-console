import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRuntimeObservationRequest, requireRuntimeObservationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await replayRuntimeObservationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Runtime Observation package.");
  }
}
