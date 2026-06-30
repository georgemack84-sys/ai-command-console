import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimeObservationContractResponse, requireRuntimeObservationEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeObservationEngineUser();
    return apiSuccess(getRuntimeObservationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Runtime Observation Engine.");
  }
}
