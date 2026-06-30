import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAutonomyStateRequest, requireAutonomyStateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyStateUser();
    return apiSuccess(await replayAutonomyStateRequest());
  } catch (error) {
    return apiError(error, "Unable to replay autonomy state history.");
  }
}
