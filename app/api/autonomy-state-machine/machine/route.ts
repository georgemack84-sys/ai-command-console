import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyStateMachineResponse, requireAutonomyStateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyStateUser();
    return apiSuccess(getAutonomyStateMachineResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy state machine.");
  }
}
