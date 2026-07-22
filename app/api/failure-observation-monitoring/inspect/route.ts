import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireFailureObservationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireFailureObservationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect failure observations.");
  }
}

export async function POST(request: Request) {
  try {
    await requireFailureObservationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect failure observations.");
  }
}
