import { apiError, apiSuccess } from "@/src/server/api/response";
import { degradationRequest, requireMissionHealthScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthScoringUser();
    return apiSuccess(await degradationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission degradation score.");
  }
}
