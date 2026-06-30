import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPlanningConfidenceRequest, requirePlanningConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePlanningConfidenceUser();
    return apiSuccess(await replayPlanningConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay planning confidence assessment.");
  }
}
