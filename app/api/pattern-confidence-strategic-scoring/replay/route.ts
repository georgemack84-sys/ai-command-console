import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternScoringRequest, requirePatternScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternScoringUser();
    return apiSuccess(await replayPatternScoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern scoring.");
  }
}
