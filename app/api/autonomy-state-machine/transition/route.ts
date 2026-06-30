import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyStateUser, transitionAutonomyStateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyStateUser();
    return apiSuccess(await transitionAutonomyStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition autonomy state.");
  }
}
