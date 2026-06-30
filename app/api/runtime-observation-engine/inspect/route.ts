import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRuntimeObservationRequest, requireRuntimeObservationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await inspectRuntimeObservationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Observation Engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(await inspectRuntimeObservationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Observation Engine.");
  }
}
