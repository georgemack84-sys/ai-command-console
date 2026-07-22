import { apiError, apiSuccess } from "@/src/server/api/response";
import { anomaliesRequest, requireFailureObservationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFailureObservationUser();
    return apiSuccess(await anomaliesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build anomaly ledger.");
  }
}
