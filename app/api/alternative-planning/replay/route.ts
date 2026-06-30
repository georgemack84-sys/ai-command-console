import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAlternativePlanningRequest, requireAlternativePlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await replayAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay alternative planning package.");
  }
}
