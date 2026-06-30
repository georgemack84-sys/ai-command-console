import { apiError, apiSuccess } from "@/src/server/api/response";
import { initializeAutonomyStateRequest, requireAutonomyStateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAutonomyStateUser();
    return apiSuccess(await initializeAutonomyStateRequest());
  } catch (error) {
    return apiError(error, "Unable to initialize autonomy state.");
  }
}
