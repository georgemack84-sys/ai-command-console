import { apiError, apiSuccess } from "@/src/server/api/response";
import { eventsGovernanceTamperDetectionRequest, requireGovernanceTamperDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await eventsGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance tamper detection events.");
  }
}
