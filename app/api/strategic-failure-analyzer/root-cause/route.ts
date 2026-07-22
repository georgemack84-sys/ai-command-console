import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicFailureUser, rootCauseRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategicFailureUser();
    return apiSuccess(await rootCauseRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic failure root cause analysis.");
  }
}
