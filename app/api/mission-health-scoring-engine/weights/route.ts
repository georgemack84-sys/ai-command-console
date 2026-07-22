import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthScoringUser, weightsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthScoringUser();
    return apiSuccess(await weightsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health weights.");
  }
}
